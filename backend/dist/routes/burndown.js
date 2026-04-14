"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.burndownRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.burndownRouter = (0, express_1.Router)();
exports.burndownRouter.use(auth_1.authenticate);
// GET /api/v1/burndown/:txn_id
exports.burndownRouter.get('/:txnId', async (req, res) => {
    try {
        const tracker = await prisma_1.prisma.burnDownTracker.findUnique({
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch burn-down data' });
    }
});
// GET /api/v1/burndown — all active trackers with alert filter
exports.burndownRouter.get('/', async (req, res) => {
    const { alertLevel, agentId } = req.query;
    try {
        const where = { status: { not: 'EXPIRED' } };
        if (alertLevel)
            where.alertLevel = alertLevel;
        if (agentId)
            where.agentId = agentId;
        const trackers = await prisma_1.prisma.burnDownTracker.findMany({
            where,
            include: {
                agent: { select: { businessName: true, msisdn: true, gpsLat: true, gpsLng: true } },
                transaction: { select: { dispensedAt: true, burnTargetDate: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 200,
        });
        res.json(trackers);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch burn-down trackers' });
    }
});
//# sourceMappingURL=burndown.js.map