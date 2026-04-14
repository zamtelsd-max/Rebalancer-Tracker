"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
// POST /api/v1/auth/login
exports.authRouter.post('/login', async (req, res) => {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
        res.status(400).json({ error: 'Phone and PIN required' });
        return;
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { phone } });
        if (!user || !user.active) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(pin, user.pin);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = (0, auth_1.signToken)({ userId: user.id, role: user.role, phone: user.phone });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entityType: 'User',
                entityId: user.id,
                details: `User ${user.name} logged in`,
            },
        });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                zone: user.zone,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});
// GET /api/v1/auth/me
exports.authRouter.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, phone: true, role: true, zone: true, active: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// GET /api/v1/auth/integration-mode
exports.authRouter.get('/integration-mode', (_req, res) => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    res.json({ mode });
});
//# sourceMappingURL=auth.js.map