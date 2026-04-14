"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.transactionsRouter = (0, express_1.Router)();
// POST /api/v1/transactions/sync — Tier 3 webhook from Core
exports.transactionsRouter.post('/sync', async (req, res) => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    if (mode !== 'tier3') {
        res.status(400).json({
            error: 'Webhook sync requires Tier 3 integration mode',
            currentMode: mode,
        });
        return;
    }
    // Verify webhook secret
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
        res.status(401).json({ error: 'Invalid webhook secret' });
        return;
    }
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
        res.status(400).json({ error: 'transactions array required' });
        return;
    }
    try {
        let processed = 0;
        let errors = 0;
        for (const txn of transactions) {
            try {
                const agent = await prisma_1.prisma.agent.findFirst({
                    where: { msisdn: txn.msisdn },
                });
                if (!agent)
                    continue;
                await prisma_1.prisma.agentMoneyTransaction.create({
                    data: {
                        agentId: agent.id,
                        coreTxnRef: txn.txnRef,
                        amount: txn.amount,
                        txnType: txn.type,
                        txnTimestamp: new Date(txn.timestamp),
                        source: 'CORE_SYNC',
                        verified: true,
                    },
                });
                // Recalculate LUR for agent
                await recalculateLUR(agent.id);
                processed++;
            }
            catch {
                errors++;
            }
        }
        res.json({ processed, errors, total: transactions.length });
    }
    catch (err) {
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// GET /api/v1/transactions
exports.transactionsRouter.get('/', auth_1.authenticate, async (req, res) => {
    const { agentId, source, page = '1', limit = '50' } = req.query;
    try {
        const where = {};
        if (agentId)
            where.agentId = agentId;
        if (source)
            where.source = source;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [txns, total] = await Promise.all([
            prisma_1.prisma.agentMoneyTransaction.findMany({
                where,
                include: { agent: { select: { businessName: true, msisdn: true } } },
                skip,
                take: parseInt(limit),
                orderBy: { txnTimestamp: 'desc' },
            }),
            prisma_1.prisma.agentMoneyTransaction.count({ where }),
        ]);
        res.json({ transactions: txns, total });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
async function recalculateLUR(agentId) {
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
        include: {
            rebalanceTransactions: {
                where: { otpVerified: true },
                orderBy: { dispensedAt: 'desc' },
                take: 1,
            },
        },
    });
    if (!agent || !agent.rebalanceTransactions[0])
        return;
    const lastTxn = agent.rebalanceTransactions[0];
    const rebalanceAmount = lastTxn.cashAmount + lastTxn.floatAmount;
    if (!lastTxn.dispensedAt)
        return;
    const utilizedTxns = await prisma_1.prisma.agentMoneyTransaction.aggregate({
        where: {
            agentId,
            verified: true,
            txnTimestamp: { gte: lastTxn.dispensedAt },
        },
        _sum: { amount: true },
    });
    const utilized = utilizedTxns._sum.amount ?? 0;
    const lur = rebalanceAmount > 0 ? Math.min(utilized / rebalanceAmount, 1) : 0;
    await prisma_1.prisma.agent.update({
        where: { id: agentId },
        data: { lurScore: lur },
    });
}
//# sourceMappingURL=transactions.js.map