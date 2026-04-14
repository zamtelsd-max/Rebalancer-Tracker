import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';

export const commissionsRouter = Router();
commissionsRouter.use(authenticate);

// POST /api/v1/commissions/generate — calculate commissions for a period
commissionsRouter.post(
  '/generate',
  requireRole('SUPER_ADMIN', 'MASTER_AGENT'),
  async (req: Request, res: Response): Promise<void> => {
    const { masterAgentId, periodStart, periodEnd } = req.body;
    const mode = process.env.INTEGRATION_MODE || 'standalone';

    if (!masterAgentId || !periodStart || !periodEnd) {
      res.status(400).json({ error: 'masterAgentId, periodStart, periodEnd required' });
      return;
    }

    try {
      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      const txns = await prisma.rebalanceTransaction.findMany({
        where: {
          rebalancer: { masterAgentId },
          dispensedAt: { gte: start, lte: end },
          otpVerified: true,
        },
        include: {
          burnDownTracker: { select: { burnPct: true } },
        },
      });

      const totalDistributed = txns.reduce((s, t) => s + t.cashAmount + t.floatAmount, 0);
      const lurValues = txns
        .map((t) => t.burnDownTracker?.burnPct ?? 0)
        .filter((v) => v > 0);
      const lurAvg = lurValues.length > 0
        ? lurValues.reduce((s, v) => s + v, 0) / lurValues.length / 100
        : 0;

      const baseFee = totalDistributed * 0.01; // 1% base
      const utilizationBonus = lurAvg >= 0.80 ? baseFee * 0.40 :
        lurAvg >= 0.60 ? baseFee * 0.25 :
        lurAvg >= 0.40 ? baseFee * 0.10 : 0;

      const commission = await prisma.commission.create({
        data: {
          masterAgentId,
          periodStart: start,
          periodEnd: end,
          totalDistributed,
          lurAvg,
          baseFee,
          utilizationBonus,
          totalCommission: baseFee + utilizationBonus,
          status: mode === 'standalone' ? 'DRAFT' : 'DRAFT',
        },
      });

      res.json({
        ...commission,
        note: mode === 'standalone'
          ? 'Commission generated without LUR data. Requires Core integration for accuracy.'
          : 'Commission generated with LUR data.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Commission generation failed' });
    }
  }
);

// GET /api/v1/commissions
commissionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { masterAgentId, status } = req.query;
  try {
    const where: Record<string, unknown> = {};
    if (masterAgentId) where.masterAgentId = masterAgentId;
    if (status) where.status = status;

    // MA can only see their own commissions
    if (req.user?.role === 'MASTER_AGENT') {
      const ma = await prisma.masterAgent.findUnique({
        where: { userId: req.user.userId },
      });
      if (ma) where.masterAgentId = ma.id;
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        masterAgent: { select: { name: true, zone: true } },
        disputes: true,
      },
      orderBy: { periodEnd: 'desc' },
    });

    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

// PATCH /api/v1/commissions/:id/approve
commissionsRouter.patch(
  '/:id/approve',
  requireRole('SUPER_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const commission = await prisma.commission.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED' },
      });
      res.json(commission);
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve commission' });
    }
  }
);

// POST /api/v1/commissions/:id/submit
commissionsRouter.post(
  '/:id/submit',
  requireRole('MASTER_AGENT'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const commission = await prisma.commission.update({
        where: { id: req.params.id },
        data: { status: 'SUBMITTED' },
      });
      res.json(commission);
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit commission' });
    }
  }
);

// POST /api/v1/commissions/disputes
commissionsRouter.post('/disputes', async (req: Request, res: Response): Promise<void> => {
  const { commissionId, description } = req.body;
  if (!commissionId || !description) {
    res.status(400).json({ error: 'commissionId and description required' });
    return;
  }

  try {
    const dispute = await prisma.dispute.create({
      data: {
        commissionId,
        raisedById: req.user!.userId,
        description,
        status: 'OPEN',
      },
    });
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});
