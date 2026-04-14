"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./routes/auth");
const agents_1 = require("./routes/agents");
const rebalance_1 = require("./routes/rebalance");
const reports_1 = require("./routes/reports");
const transactions_1 = require("./routes/transactions");
const trn_1 = require("./routes/trn");
const burndown_1 = require("./routes/burndown");
const commissions_1 = require("./routes/commissions");
const admin_1 = require("./routes/admin");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use(requestLogger_1.requestLogger);
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'ZLMS API',
        version: '1.0.0',
        integrationMode: process.env.INTEGRATION_MODE || 'standalone',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
const api = '/api/v1';
app.use(`${api}/auth`, auth_1.authRouter);
app.use(`${api}/agents`, agents_1.agentsRouter);
app.use(`${api}/rebalance`, rebalance_1.rebalanceRouter);
app.use(`${api}/reports`, reports_1.reportsRouter);
app.use(`${api}/transactions`, transactions_1.transactionsRouter);
app.use(`${api}/trn`, trn_1.trnRouter);
app.use(`${api}/burndown`, burndown_1.burndownRouter);
app.use(`${api}/commissions`, commissions_1.commissionsRouter);
app.use(`${api}/admin`, admin_1.adminRouter);
// 404
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handler
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 ZLMS API running on port ${PORT}`);
    console.log(`   Integration mode: ${process.env.INTEGRATION_MODE || 'standalone'}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map