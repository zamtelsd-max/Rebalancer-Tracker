"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_1.authenticate, (0, auth_1.requireRole)('SUPER_ADMIN', 'TDE'));
// GET /api/v1/admin/config
exports.adminRouter.get('/config', async (_req, res) => {
    try {
        const configs = await prisma_1.prisma.systemConfig.findMany();
        const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));
        res.json(configMap);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});
// PATCH /api/v1/admin/config
exports.adminRouter.patch('/config', (0, auth_1.requireRole)('SUPER_ADMIN'), async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
        res.status(400).json({ error: 'key and value required' });
        return;
    }
    try {
        const config = await prisma_1.prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'CONFIG_UPDATE',
                entityType: 'SystemConfig',
                details: `${key} = ${value}`,
            },
        });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update config' });
    }
});
// GET /api/v1/admin/audit-logs
exports.adminRouter.get('/audit-logs', async (req, res) => {
    const { page = '1', limit = '50' } = req.query;
    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            prisma_1.prisma.auditLog.findMany({
                include: { user: { select: { name: true, role: true } } },
                orderBy: { timestamp: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.prisma.auditLog.count(),
        ]);
        res.json({ logs, total });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
// GET /api/v1/admin/integration-status
exports.adminRouter.get('/integration-status', async (_req, res) => {
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
//# sourceMappingURL=admin.js.map