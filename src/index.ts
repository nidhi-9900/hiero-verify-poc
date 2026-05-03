// Entry point — starts the server

import express from 'express';
import dotenv from 'dotenv';
import { handleWebhook } from './webhooks/handler';
import auditRouter from './routes/audit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// raw body needed for webhook signature verification
app.use('/webhooks/github', express.raw({ type: 'application/json' }));
app.use(express.json());

// routes
app.post('/webhooks/github', handleWebhook);
app.use('/audit', auditRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook: POST http://localhost:${PORT}/webhooks/github`);
  console.log(`Audit:   GET  http://localhost:${PORT}/audit/:owner/:repo/:pr_number`);
});