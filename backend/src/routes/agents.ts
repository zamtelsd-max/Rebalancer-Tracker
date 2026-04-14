import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';

export const agentsRouter = Router();
agentsRouter.use(authenticate);

// GET /api/v1/agents — list with filters
agentsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, zone, masterId, search, page = '1', limit = '50' } = req.query;

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (masterId) where.masterAgentId = masterId as string;
    if (search) {
      where.OR = [
        { businessName: { contains: search as string } },
        { msisdn: { contains: search as string } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          masterAgent: { select: { name: true, zone: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { businessName: 'asc' },
      }),
      prisma.agent.count({ where }),
    ]);

    res.json({ agents, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/v1/agents/:id
agentsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        masterAgent: true,
        rebalanceTransactions: {
          take: 10,
          orderBy: { dispensedAt: 'desc' },
          include: { burnDownTracker: true },
        },
        burnDownTrackers: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// GET /api/v1/agents/:id/score — LUR + eligibility
agentsRouter.get('/:id/score', async (req: Request, res: Response): Promise<void> => {
  const mode = process.env.INTEGRATION_MODE || 'standalone';

  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const lurScore = mode === 'standalone' ? null : agent.lurScore;
    const casScore = agent.casScore;

    const eligible = !agent.requestLocked &&
      agent.status === 'ACTIVE' &&
      (mode === 'standalone' ? true : (lurScore ?? 0) >= 0.30);

    res.json({
      agentId: agent.id,
      lurScore: mode === 'standalone' ? null : lurScore,
      lurStatus: mode === 'standalone' ? 'PENDING_INTEGRATION' : getLurStatus(lurScore),
      casScore,
      eligible,
      requestLocked: agent.requestLocked,
      status: agent.status,
      integrationMode: mode,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get score' });
  }
});

// PATCH /api/v1/agents/:id/status
agentsRouter.patch(
  '/:id/status',
  requireRole('SUPER_ADMIN', 'TDE'),
  async (req: Request, res: Response): Promise<void> => {
    const { status, requestLocked } = req.body;
    try {
      const agent = await prisma.agent.update({
        where: { id: req.params.id },
        data: {
          ...(status && { status: status as string }),
          ...(typeof requestLocked === 'boolean' && { requestLocked }),
        },
      });
      res.json(agent);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update agent status' });
    }
  }
);

function getLurStatus(lur: number | null): string {
  if (lur === null) return 'UNKNOWN';
  if (lur >= 0.80) return 'GREEN';
  if (lur >= 0.50) return 'AMBER';
  if (lur >= 0.30) return 'ORANGE';
  return 'RED';
}
