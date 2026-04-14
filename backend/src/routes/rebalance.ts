import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { isWithinGeofence } from '../utils/haversine';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp';

export const rebalanceRouter = Router();
rebalanceRouter.use(authenticate);

// POST /api/v1/rebalance/scan-agent — QR scan + geofence check
rebalanceRouter.post(
  '/scan-agent',
  requireRole('REBALANCER'),
  async (req: Request, res: Response): Promise<void> => {
    const { qrToken, rebalancerLat, rebalancerLng } = req.body;

    if (!qrToken || rebalancerLat === undefined || rebalancerLng === undefined) {
      res.status(400).json({ error: 'qrToken, rebalancerLat, rebalancerLng required' });
      return;
    }

    try {
      const agent = await prisma.agent.findUnique({ where: { qrCodeToken: qrToken } });
      if (!agent) {
        res.status(404).json({ error: 'Agent QR code not found' });
        return;
      }

      const { within, distanceM } = isWithinGeofence(
        rebalancerLat, rebalancerLng,
        agent.gpsLat, agent.gpsLng,
        agent.geofenceRadiusM
      );

      res.json({
        agentId: agent.id,
        agentName: agent.businessName,
        msisdn: agent.msisdn,
        distanceM: Math.round(distanceM),
        withinGeofence: within,
        geofenceRadiusM: agent.geofenceRadiusM,
        status: agent.status,
        requestLocked: agent.requestLocked,
        lurScore: agent.lurScore,
        casScore: agent.casScore,
      });
    } catch (err) {
      res.status(500).json({ error: 'Scan failed' });
    }
  }
);

// POST /api/v1/rebalance/initiate — create request and send OTP
rebalanceRouter.post(
  '/initiate',
  requireRole('REBALANCER'),
  async (req: Request, res: Response): Promise<void> => {
    const { agentId, cashAmount, floatAmount, gpsLat, gpsLng } = req.body;

    if (!agentId || gpsLat === undefined || gpsLng === undefined) {
      res.status(400).json({ error: 'agentId, gpsLat, gpsLng required' });
      return;
    }

    try {
      const rebalancer = await prisma.rebalancer.findUnique({
        where: { userId: req.user!.userId },
      });
      if (!rebalancer) {
        res.status(403).json({ error: 'Rebalancer profile not found' });
        return;
      }

      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent || agent.status === 'SUSPENDED' || agent.requestLocked) {
        res.status(400).json({ error: 'Agent is not eligible for rebalancing' });
        return;
      }

      const total = (cashAmount || 0) + (floatAmount || 0);
      if (total <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      const type: string =
        cashAmount > 0 && floatAmount > 0 ? 'BOTH' :
        cashAmount > 0 ? 'CASH' : 'FLOAT';

      const request = await prisma.rebalanceRequest.create({
        data: {
          agentId,
          rebalancerId: rebalancer.id,
          amountRequested: total,
          amountApproved: total,
          type,
          status: 'APPROVED',
          lurAtRequest: agent.lurScore,
        },
      });

      // Generate and store OTP
      const otp = generateOTP();
      storeOTP(request.id, otp);

      // In production: send OTP via SMS to agent's msisdn
      console.log(`[OTP] Request ${request.id} → agent ${agent.msisdn}: ${otp}`);

      res.json({
        requestId: request.id,
        agentName: agent.businessName,
        agentMsisdn: agent.msisdn,
        cashAmount: cashAmount || 0,
        floatAmount: floatAmount || 0,
        total,
        otpSentTo: agent.msisdn,
        message: 'OTP sent to agent phone. Collect OTP from agent.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to initiate rebalance' });
    }
  }
);

// POST /api/v1/rebalance/confirm-dispense — OTP verify + start burn-down
rebalanceRouter.post(
  '/confirm-dispense',
  requireRole('REBALANCER'),
  async (req: Request, res: Response): Promise<void> => {
    const { requestId, otp, gpsLat, gpsLng, cashAmount, floatAmount } = req.body;

    if (!requestId || !otp) {
      res.status(400).json({ error: 'requestId and otp required' });
      return;
    }

    const otpValid = verifyOTP(requestId, otp);
    if (!otpValid) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    try {
      const request = await prisma.rebalanceRequest.findUnique({
        where: { id: requestId },
        include: { agent: true },
      });

      if (!request || request.status !== 'APPROVED') {
        res.status(400).json({ error: 'Request not found or not approved' });
        return;
      }

      const rebalancer = await prisma.rebalancer.findUnique({
        where: { userId: req.user!.userId },
      });
      if (!rebalancer) {
        res.status(403).json({ error: 'Rebalancer not found' });
        return;
      }

      const { distanceM } = isWithinGeofence(
        gpsLat ?? 0, gpsLng ?? 0,
        request.agent.gpsLat, request.agent.gpsLng,
        request.agent.geofenceRadiusM
      );

      const now = new Date();
      const burnTarget = new Date(now.getTime() + 72 * 3600 * 1000);
      const totalAmount = (cashAmount || 0) + (floatAmount || 0);

      const txn = await prisma.rebalanceTransaction.create({
        data: {
          requestId,
          rebalancerId: rebalancer.id,
          agentId: request.agentId,
          cashAmount: cashAmount || 0,
          floatAmount: floatAmount || 0,
          gpsLatAtDispense: gpsLat,
          gpsLngAtDispense: gpsLng,
          distanceFromAgent: distanceM,
          qrScanVerified: true,
          otpVerified: true,
          dispensedAt: now,
          burnTargetDate: burnTarget,
          burnTargetAmount: totalAmount,
        },
      });

      // Start burn-down tracker
      await prisma.burnDownTracker.create({
        data: {
          txnId: txn.id,
          agentId: request.agentId,
          initialAmount: totalAmount,
          currentUtilized: 0,
          burnPct: 0,
          alertLevel: 'GREEN',
          status: 'ACTIVE',
        },
      });

      // Update request status
      await prisma.rebalanceRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      });

      // Update agent last rebalanced
      await prisma.agent.update({
        where: { id: request.agentId },
        data: { lastRebalancedAt: now },
      });

      res.json({
        success: true,
        transactionId: txn.id,
        agentName: request.agent.businessName,
        cashAmount: cashAmount || 0,
        floatAmount: floatAmount || 0,
        dispensedAt: now,
        burnTargetDate: burnTarget,
        receiptId: `RID-${txn.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to confirm dispense' });
    }
  }
);

// GET /api/v1/rebalance/requests
rebalanceRouter.get('/requests', async (req: Request, res: Response): Promise<void> => {
  const { status, agentId } = req.query;
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    // Rebalancers see only their requests
    if (req.user?.role === 'REBALANCER') {
      const rebalancer = await prisma.rebalancer.findUnique({
        where: { userId: req.user.userId },
      });
      if (rebalancer) where.rebalancerId = rebalancer.id;
    }

    const requests = await prisma.rebalanceRequest.findMany({
      where,
      include: {
        agent: { select: { businessName: true, msisdn: true, gpsLat: true, gpsLng: true } },
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/v1/rebalance/observations
rebalanceRouter.post(
  '/observations',
  requireRole('REBALANCER'),
  async (req: Request, res: Response): Promise<void> => {
    const { agentId, visitTxnId, customerTraffic, competitorFloatVisible,
      zamtelBrandingVisible, agentAttitude, notes } = req.body;

    try {
      const rebalancer = await prisma.rebalancer.findUnique({
        where: { userId: req.user!.userId },
      });
      if (!rebalancer) {
        res.status(403).json({ error: 'Rebalancer not found' });
        return;
      }

      const obs = await prisma.rebalancerObservation.create({
        data: {
          rebalancerId: rebalancer.id,
          agentId,
          visitTxnId: visitTxnId || undefined,
          customerTraffic: customerTraffic || 3,
          competitorFloatVisible: competitorFloatVisible || false,
          zamtelBrandingVisible: zamtelBrandingVisible !== false,
          agentAttitude: agentAttitude || 3,
          notes: notes || '',
        },
      });

      res.json(obs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save observation' });
    }
  }
);
