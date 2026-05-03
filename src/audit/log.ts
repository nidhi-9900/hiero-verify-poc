// Saves and reads verification results
// Every PR check is stored in audit.json so we can look it up later

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AuditRecord } from '../types';

const auditFile = path.join(__dirname, '../../data/audit.json');

function readFile(): AuditRecord[] {
  try {
    const raw = fs.readFileSync(auditFile, 'utf-8');
    if (!raw || raw.trim() === '') return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFile(records: AuditRecord[]): void {
  fs.writeFileSync(auditFile, JSON.stringify(records, null, 2));
}

export function saveRecord(record: Omit<AuditRecord, 'id' | 'checked_at'>): string {
  const id = crypto.randomUUID();
  const full: AuditRecord = {
    ...record,
    id,
    checked_at: new Date().toISOString()
  };

  const records = readFile();
  records.push(full);
  writeFile(records);

  return id;
}

export function getRecord(prNumber: number, repo: string): AuditRecord | null {
  const records = readFile();
  return records.find(r => r.pr_number === prNumber && r.repo === repo) ?? null;
}