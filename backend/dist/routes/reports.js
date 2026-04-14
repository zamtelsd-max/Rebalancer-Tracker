"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.use(auth_1.authenticate);
// GET /api/v1/reports/heatmap — for Leaflet map serviced areas
exports.reportsRouter.get('/heatmap', async (_req, res) => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    try {
        const agents = await prisma_1.prisma.agent.findMany({
            select: {
                id: true,
                businessName: true,
                gpsLat: true,
                gpsLng: true,
                geofenceRadiusM: true,
                lurScore: true,
                casScore: true,
                status: true,
                requestLocked: true,
                lastRebalancedAt: true,
                rebalanceTransactions: {
                    where: { otpVerified: true, dispensedAt: { not: null } },
                    orderBy: { dispensedAt: 'desc' },
                    take: 1,
                    select: { dispensedAt: true, cashAmount: true, floatAmount: true },
                },
                burnDownTrackers: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { burnPct: true, alertLevel: true, status: true },
                },
            },
        });
        const heatmapData = agents.map((agent) => {
            const lastTxn = agent.rebalanceTransactions[0];
            const burnTracker = agent.burnDownTrackers[0];
            const hasBeenServiced = !!lastTxn;
            // Determine circle colour
            let colour;
            if (mode === 'standalone') {
                colour = hasBeenServiced ? 'blue' : 'grey';
            }
            else {
                const lur = agent.lurScore ?? 0;
                if (agent.requestLocked || agent.status === 'FLAGGED')
                    colour = 'red';
                else if (lur >= 0.80)
                    colour = 'green';
                else if (lur >= 0.50)
                    colour = 'amber';
                else if (lur >= 0.30)
                    colour = 'orange';
                else
                    colour = 'red';
            }
            return {
                agentId: agent.id,
                agentName: agent.businessName,
                gpsLat: agent.gpsLat,
                gpsLng: agent.gpsLng,
                geofenceRadiusM: agent.geofenceRadiusM,
                lurScore: mode === 'standalone' ? null : agent.lurScore,
                casScore: agent.casScore,
                status: agent.status,
                colour,
                hasBeenServiced,
                lastServicedAt: agent.lastRebalancedAt,
                totalDistributed: lastTxn ? lastTxn.cashAmount + lastTxn.floatAmount : 0,
                burnPct: burnTracker?.burnPct ?? null,
                burnStatus: burnTracker?.status ?? null,
                integrationMode: mode,
            };
        });
        res.json(heatmapData);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});
// GET /api/v1/reports/utilization
exports.reportsRouter.get('/utilization', async (_req, res) => {
    try {
        const trackers = await prisma_1.prisma.burnDownTracker.findMany({
            where: { status: { not: 'EXPIRED' } },
        });
        const total = trackers.length;
        const totalDistributed = trackers.reduce((s, t) => s + t.initialAmount, 0);
        const totalUtilized = trackers.reduce((s, t) => s + t.currentUtilized, 0);
        const avgBurnPct = total > 0 ? trackers.reduce((s, t) => s + t.burnPct, 0) / total : 0;
        const byAlertLevel = {
            GREEN: trackers.filter((t) => t.alertLevel === 'GREEN').length,
            YELLOW: trackers.filter((t) => t.alertLevel === 'YELLOW').length,
            ORANGE: trackers.filter((t) => t.alertLevel === 'ORANGE').length,
            RED: trackers.filter((t) => t.alertLevel === 'RED').length,
        };
        res.json({
            total,
            totalDistributed,
            totalUtilized,
            avgBurnPct: Math.round(avgBurnPct * 10) / 10,
            byAlertLevel,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch utilization data' });
    }
});
// GET /api/v1/reports/dashboard — KPI summary
exports.reportsRouter.get('/dashboard', async (_req, res) => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    try {
        const [totalAgents, activeAgents, flaggedAgents, totalTxns, recentAlerts] = await Promise.all([
            prisma_1.prisma.agent.count(),
            prisma_1.prisma.agent.count({ where: { status: 'ACTIVE' } }),
            prisma_1.prisma.agent.count({ where: { status: 'FLAGGED' } }),
            prisma_1.prisma.rebalanceTransaction.count({ where: { otpVerified: true } }),
            prisma_1.prisma.burnDownTracker.count({ where: { alertLevel: 'RED', status: 'ACTIVE' } }),
        ]);
        const txns = await prisma_1.prisma.rebalanceTransaction.findMany({
            where: { otpVerified: true },
            select: { cashAmount: true, floatAmount: true },
        });
        const totalDistributed = txns.reduce((s, t) => s + t.cashAmount + t.floatAmount, 0);
        res.json({
            totalAgents,
            activeAgents,
            flaggedAgents,
            totalTxns,
            totalDistributed,
            redAlerts: recentAlerts,
            integrationMode: mode,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
//# sourceMappingURL=reports.js.map