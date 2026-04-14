"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.agentsRouter = (0, express_1.Router)();
exports.agentsRouter.use(auth_1.authenticate);
// GET /api/v1/agents — list with filters
exports.agentsRouter.get('/', async (req, res) => {
    const { status, zone, masterId, search, page = '1', limit = '50' } = req.query;
    try {
        const where = {};
        if (status)
            where.status = status;
        if (masterId)
            where.masterAgentId = masterId;
        if (search) {
            where.OR = [
                { businessName: { contains: search } },
                { msisdn: { contains: search } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [agents, total] = await Promise.all([
            prisma_1.prisma.agent.findMany({
                where,
                include: {
                    masterAgent: { select: { name: true, zone: true } },
                },
                skip,
                take: parseInt(limit),
                orderBy: { businessName: 'asc' },
            }),
            prisma_1.prisma.agent.count({ where }),
        ]);
        res.json({ agents, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
// GET /api/v1/agents/:id
exports.agentsRouter.get('/:id', async (req, res) => {
    try {
        const agent = await prisma_1.prisma.agent.findUnique({
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch agent' });
    }
});
// GET /api/v1/agents/:id/score — LUR + eligibility
exports.agentsRouter.get('/:id/score', async (req, res) => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    try {
        const agent = await prisma_1.prisma.agent.findUnique({ where: { id: req.params.id } });
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to get score' });
    }
});
// PATCH /api/v1/agents/:id/status
exports.agentsRouter.patch('/:id/status', (0, auth_1.requireRole)('SUPER_ADMIN', 'TDE'), async (req, res) => {
    const { status, requestLocked } = req.body;
    try {
        const agent = await prisma_1.prisma.agent.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status: status }),
                ...(typeof requestLocked === 'boolean' && { requestLocked }),
            },
        });
        res.json(agent);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update agent status' });
    }
});
function getLurStatus(lur) {
    if (lur === null)
        return 'UNKNOWN';
    if (lur >= 0.80)
        return 'GREEN';
    if (lur >= 0.50)
        return 'AMBER';
    if (lur >= 0.30)
        return 'ORANGE';
    return 'RED';
}
//# sourceMappingURL=agents.js.map