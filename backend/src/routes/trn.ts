import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import multer from 'multer';

export const trnRouter = Router();
trnRouter.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/v1/trn/submit — agent TRN submission (standalone workaround)
trnRouter.post('/submit', async (req: Request, res: Response): Promise<void> => {
  const { agentId, trn, declaredAmount, declaredType } = req.body;

  if (!agentId || !trn || !declaredAmount || !declaredType) {
    res.status(400).json({ error: 'agentId, trn, declaredAmount, declaredType required' });
    return;
  }

  try {
    // Basic TRN structural validation
    const structuralValid = /^ZMT\d{10,}$/.test(trn);

    const submission = await prisma.trnSubmission.create({
      data: {
        agentId,
        trn,
        declaredAmount: parseFloat(declaredAmount),
        declaredType: declaredType as string,
        structuralValid,
        coreVerified: false,
      },
    });

    // If structurally valid, add to agent money transactions
    if (structuralValid) {
      await prisma.agentMoneyTransaction.create({
        data: {
          agentId,
          amount: parseFloat(declaredAmount),
          txnType: declaredType as string,
          txnTimestamp: new Date(),
          source: 'TRN_SUBMISSION',
          verified: false,
        },
      });
    }

    res.json({
      submissionId: submission.id,
      structuralValid,
      message: structuralValid
        ? 'TRN submitted. Pending Core verification.'
        : 'TRN format invalid. Expected: ZMT followed by 10+ digits.',
    });
  } catch (err) {
    res.status(500).json({ error: 'TRN submission failed' });
  }
});

// POST /api/v1/trn/batch-validate — CSV upload (Tier 1 batch)
trnRouter.post(
  '/batch-validate',
  requireRole('SUPER_ADMIN', 'TDE'),
  upload.single('csv'),
  async (req: Request, res: Response): Promise<void> => {
    const mode = process.env.INTEGRATION_MODE || 'standalone';
    if (mode === 'standalone') {
      res.status(400).json({ error: 'Batch import requires Tier 1 or Tier 3 mode' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'CSV file required' });
      return;
    }

    try {
      const csv = req.file.buffer.toString('utf-8');
      const lines = csv.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const msisdnIdx = headers.indexOf('msisdn');
      const amountIdx = headers.indexOf('amount');
      const typeIdx = headers.indexOf('type');
      const refIdx = headers.indexOf('ref');
      const timestampIdx = headers.indexOf('timestamp');

      if (msisdnIdx < 0 || amountIdx < 0 || typeIdx < 0) {
        res.status(400).json({ error: 'CSV must have columns: msisdn, amount, type, ref, timestamp' });
        return;
      }

      let processed = 0, errors = 0, notFound = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length < 3) continue;

        const msisdn = cols[msisdnIdx];
        const amount = parseFloat(cols[amountIdx]);
        const txnType = cols[typeIdx]?.toUpperCase() as string;
        const ref = refIdx >= 0 ? cols[refIdx] : undefined;
        const ts = timestampIdx >= 0 ? new Date(cols[timestampIdx]) : new Date();

        if (isNaN(amount) || !['CASH_IN', 'CASH_OUT'].includes(txnType)) {
          errors++;
          continue;
        }

        const agent = await prisma.agent.findFirst({ where: { msisdn } });
        if (!agent) {
          notFound++;
          continue;
        }

        await prisma.agentMoneyTransaction.create({
          data: {
            agentId: agent.id,
            coreTxnRef: ref,
            amount,
            txnType,
            txnTimestamp: ts,
            source: 'CSV_IMPORT',
            verified: true,
          },
        });

        processed++;
      }

      res.json({
        total: lines.length - 1,
        processed,
        errors,
        notFound,
        message: `Batch import complete: ${processed} processed, ${errors} errors, ${notFound} agents not found`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Batch import failed' });
    }
  }
);

// GET /api/v1/trn/submissions
trnRouter.get('/submissions', async (req: Request, res: Response): Promise<void> => {
  const { agentId } = req.query;
  try {
    const submissions = await prisma.trnSubmission.findMany({
      where: agentId ? { agentId: agentId as string } : {},
      include: { agent: { select: { businessName: true, msisdn: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});
