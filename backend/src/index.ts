import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { agentsRouter } from './routes/agents';
import { rebalanceRouter } from './routes/rebalance';
import { reportsRouter } from './routes/reports';
import { transactionsRouter } from './routes/transactions';
import { trnRouter } from './routes/trn';
import { burndownRouter } from './routes/burndown';
import { commissionsRouter } from './routes/commissions';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

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
app.use(`${api}/auth`, authRouter);
app.use(`${api}/agents`, agentsRouter);
app.use(`${api}/rebalance`, rebalanceRouter);
app.use(`${api}/reports`, reportsRouter);
app.use(`${api}/transactions`, transactionsRouter);
app.use(`${api}/trn`, trnRouter);
app.use(`${api}/burndown`, burndownRouter);
app.use(`${api}/commissions`, commissionsRouter);
app.use(`${api}/admin`, adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ZLMS API running on port ${PORT}`);
  console.log(`   Integration mode: ${process.env.INTEGRATION_MODE || 'standalone'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
