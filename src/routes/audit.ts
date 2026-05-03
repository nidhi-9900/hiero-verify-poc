// Audit route — look up any past verification result
// GET /audit/:repo/:pr_number

import { Router } from 'express';
import { getRecord } from '../audit/log';

const router = Router();

router.get('/:repo/:pr_number', (req, res) => {
  const prNumber = parseInt(req.params.pr_number, 10);
  const repo = req.params.repo;

  const record = getRecord(prNumber, repo);

  if (!record) {
    res.status(404).json({ error: 'No audit record found for this PR' });
    return;
  }

  res.json(record);
});

export default router;