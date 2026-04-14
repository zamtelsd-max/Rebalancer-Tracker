import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('SUPER_ADMIN', 'TDE'));

// GET /api/v1/admin/config
adminRouter.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    res.json(configMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// PATCH /api/v1/admin/config
adminRouter.patch(
  '/config',
  requireRole('SUPER_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ error: 'key and value required' });
      return;
    }

    try {
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'CONFIG_UPDATE',
          entityType: 'SystemConfig',
          details: `${key} = ${value}`,
        },
      });

      res.json(config);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update config' });
    }
  }
);

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '50' } = req.query;
  try {
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, role: true } } },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/v1/admin/integration-status
adminRouter.get('/integration-status', async (_req: Request, res: Response): Promise<void> => {
  const mode = process.env.INTEGRATION_MODE || 'standalone';

  res.json({
    mode,
    features: {
      gpsVerification: true,
      qrOtpDispense: true,
      auditTrail: true,
      routeManagement: true,
      observationReports: true,
      lurCalculation: mode !== 'standalone',
      burnDownTracking: mode !== 'standalone',
      fraudDetection: mode !== 'standalone',
      commissionCalculation: mode !== 'standalone',
      csvImport: mode === 'tier1' || mode === 'tier3',
      webhookSync: mode === 'tier3',
      realTimeCore: mode === 'tier3',
    },
    webhookUrl: mode === 'tier3' ? `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/transactions/sync` : null,
  });
});
