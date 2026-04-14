import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';

export const burndownRouter = Router();
burndownRouter.use(authenticate);

// GET /api/v1/burndown/:txn_id
burndownRouter.get('/:txnId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tracker = await prisma.burnDownTracker.findUnique({
      where: { txnId: req.params.txnId },
      include: {
        transaction: {
          select: {
            dispensedAt: true,
            burnTargetDate: true,
            burnTargetAmount: true,
            agent: { select: { businessName: true, msisdn: true } },
          },
        },
      },
    });

    if (!tracker) {
      res.status(404).json({ error: 'Burn-down tracker not found' });
      return;
    }

    const now = new Date();
    const targetDate = tracker.transaction.burnTargetDate;
    const hoursRemaining = targetDate
      ? Math.max(0, (targetDate.getTime() - now.getTime()) / 3600000)
      : 0;

    res.json({
      ...tracker,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      isOverdue: targetDate ? now > targetDate : false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch burn-down data' });
  }
});

// GET /api/v1/burndown — all active trackers with alert filter
burndownRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { alertLevel, agentId } = req.query;
  try {
    const where: Record<string, unknown> = { status: { not: 'EXPIRED' } };
    if (alertLevel) where.alertLevel = alertLevel;
    if (agentId) where.agentId = agentId;

    const trackers = await prisma.burnDownTracker.findMany({
      where,
      include: {
        agent: { select: { businessName: true, msisdn: true, gpsLat: true, gpsLng: true } },
        transaction: { select: { dispensedAt: true, burnTargetDate: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    res.json(trackers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch burn-down trackers' });
  }
});
