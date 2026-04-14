"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebalanceRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const haversine_1 = require("../utils/haversine");
const otp_1 = require("../utils/otp");
exports.rebalanceRouter = (0, express_1.Router)();
exports.rebalanceRouter.use(auth_1.authenticate);
// POST /api/v1/rebalance/scan-agent — QR scan + geofence check
exports.rebalanceRouter.post('/scan-agent', (0, auth_1.requireRole)('REBALANCER'), async (req, res) => {
    const { qrToken, rebalancerLat, rebalancerLng } = req.body;
    if (!qrToken || rebalancerLat === undefined || rebalancerLng === undefined) {
        res.status(400).json({ error: 'qrToken, rebalancerLat, rebalancerLng required' });
        return;
    }
    try {
        const agent = await prisma_1.prisma.agent.findUnique({ where: { qrCodeToken: qrToken } });
        if (!agent) {
            res.status(404).json({ error: 'Agent QR code not found' });
            return;
        }
        const { within, distanceM } = (0, haversine_1.isWithinGeofence)(rebalancerLat, rebalancerLng, agent.gpsLat, agent.gpsLng, agent.geofenceRadiusM);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Scan failed' });
    }
});
// POST /api/v1/rebalance/initiate — create request and send OTP
exports.rebalanceRouter.post('/initiate', (0, auth_1.requireRole)('REBALANCER'), async (req, res) => {
    const { agentId, cashAmount, floatAmount, gpsLat, gpsLng } = req.body;
    if (!agentId || gpsLat === undefined || gpsLng === undefined) {
        res.status(400).json({ error: 'agentId, gpsLat, gpsLng required' });
        return;
    }
    try {
        const rebalancer = await prisma_1.prisma.rebalancer.findUnique({
            where: { userId: req.user.userId },
        });
        if (!rebalancer) {
            res.status(403).json({ error: 'Rebalancer profile not found' });
            return;
        }
        const agent = await prisma_1.prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent || agent.status === 'SUSPENDED' || agent.requestLocked) {
            res.status(400).json({ error: 'Agent is not eligible for rebalancing' });
            return;
        }
        const total = (cashAmount || 0) + (floatAmount || 0);
        if (total <= 0) {
            res.status(400).json({ error: 'Amount must be greater than 0' });
            return;
        }
        const type = cashAmount > 0 && floatAmount > 0 ? 'BOTH' :
            cashAmount > 0 ? 'CASH' : 'FLOAT';
        const request = await prisma_1.prisma.rebalanceRequest.create({
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
        const otp = (0, otp_1.generateOTP)();
        (0, otp_1.storeOTP)(request.id, otp);
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to initiate rebalance' });
    }
});
// POST /api/v1/rebalance/confirm-dispense — OTP verify + start burn-down
exports.rebalanceRouter.post('/confirm-dispense', (0, auth_1.requireRole)('REBALANCER'), async (req, res) => {
    const { requestId, otp, gpsLat, gpsLng, cashAmount, floatAmount } = req.body;
    if (!requestId || !otp) {
        res.status(400).json({ error: 'requestId and otp required' });
        return;
    }
    const otpValid = (0, otp_1.verifyOTP)(requestId, otp);
    if (!otpValid) {
        res.status(400).json({ error: 'Invalid or expired OTP' });
        return;
    }
    try {
        const request = await prisma_1.prisma.rebalanceRequest.findUnique({
            where: { id: requestId },
            include: { agent: true },
        });
        if (!request || request.status !== 'APPROVED') {
            res.status(400).json({ error: 'Request not found or not approved' });
            return;
        }
        const rebalancer = await prisma_1.prisma.rebalancer.findUnique({
            where: { userId: req.user.userId },
        });
        if (!rebalancer) {
            res.status(403).json({ error: 'Rebalancer not found' });
            return;
        }
        const { distanceM } = (0, haversine_1.isWithinGeofence)(gpsLat ?? 0, gpsLng ?? 0, request.agent.gpsLat, request.agent.gpsLng, request.agent.geofenceRadiusM);
        const now = new Date();
        const burnTarget = new Date(now.getTime() + 72 * 3600 * 1000);
        const totalAmount = (cashAmount || 0) + (floatAmount || 0);
        const txn = await prisma_1.prisma.rebalanceTransaction.create({
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
        await prisma_1.prisma.burnDownTracker.create({
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
        await prisma_1.prisma.rebalanceRequest.update({
            where: { id: requestId },
            data: { status: 'COMPLETED' },
        });
        // Update agent last rebalanced
        await prisma_1.prisma.agent.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to confirm dispense' });
    }
});
// GET /api/v1/rebalance/requests
exports.rebalanceRouter.get('/requests', async (req, res) => {
    const { status, agentId } = req.query;
    try {
        const where = {};
        if (status)
            where.status = status;
        if (agentId)
            where.agentId = agentId;
        // Rebalancers see only their requests
        if (req.user?.role === 'REBALANCER') {
            const rebalancer = await prisma_1.prisma.rebalancer.findUnique({
                where: { userId: req.user.userId },
            });
            if (rebalancer)
                where.rebalancerId = rebalancer.id;
        }
        const requests = await prisma_1.prisma.rebalanceRequest.findMany({
            where,
            include: {
                agent: { select: { businessName: true, msisdn: true, gpsLat: true, gpsLng: true } },
                transaction: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// POST /api/v1/rebalance/observations
exports.rebalanceRouter.post('/observations', (0, auth_1.requireRole)('REBALANCER'), async (req, res) => {
    const { agentId, visitTxnId, customerTraffic, competitorFloatVisible, zamtelBrandingVisible, agentAttitude, notes } = req.body;
    try {
        const rebalancer = await prisma_1.prisma.rebalancer.findUnique({
            where: { userId: req.user.userId },
        });
        if (!rebalancer) {
            res.status(403).json({ error: 'Rebalancer not found' });
            return;
        }
        const obs = await prisma_1.prisma.rebalancerObservation.create({
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to save observation' });
    }
});
//# sourceMappingURL=rebalance.js.map