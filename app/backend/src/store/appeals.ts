/**
 * Employee appeal store.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { AppealRecord, AppealStatus, AppealType } from '@trustflow/shared';
import { dataDir } from './index.js';

const STORE_FILE = () => join(dataDir(), 'appeals.json');

function ensureStore(): AppealRecord[] {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = STORE_FILE();
  if (!existsSync(path)) {
    writeFileSync(path, '[]');
    return [];
  }
  return JSON.parse(readFileSync(path, 'utf8')) as AppealRecord[];
}

function saveAll(records: AppealRecord[]): void {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_FILE(), JSON.stringify(records, null, 2));
}

export function listAppeals(requestId?: string): AppealRecord[] {
  const all = ensureStore();
  return requestId ? all.filter((a) => a.request_id === requestId) : all;
}

export function getAppeal(appealId: string): AppealRecord | null {
  return ensureStore().find((a) => a.appeal_id === appealId) ?? null;
}

export function getPendingAppealForRequest(requestId: string): AppealRecord | null {
  return (
    listAppeals(requestId).find((a) => a.status === 'pending') ??
    listAppeals(requestId).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ??
    null
  );
}

export function createAppeal(input: {
  request_id: string;
  actor_id: string;
  appeal_type: AppealType;
  statement: string;
  chair_reviewer_id?: string;
}): AppealRecord {
  const all = ensureStore();
  const record: AppealRecord = {
    appeal_id: randomUUID(),
    request_id: input.request_id,
    actor_id: input.actor_id,
    appeal_type: input.appeal_type,
    statement: input.statement,
    status: 'pending',
    chair_reviewer_id: input.chair_reviewer_id ?? 'katrin.mueller@nordpay.example',
    submitted_at: new Date().toISOString(),
  };
  all.push(record);
  saveAll(all);
  return record;
}

export function decideAppeal(
  appealId: string,
  decision: 'grant' | 'deny',
  rationale: string,
  grantRouting?: AppealRecord['grant_routing'],
): AppealRecord | null {
  const all = ensureStore();
  const idx = all.findIndex((a) => a.appeal_id === appealId);
  if (idx < 0) return null;
  const status: AppealStatus = decision === 'grant' ? 'granted' : 'denied';
  all[idx] = {
    ...all[idx],
    status,
    decision_rationale: rationale,
    decided_at: new Date().toISOString(),
    grant_routing: decision === 'grant' ? grantRouting : undefined,
  };
  saveAll(all);
  return all[idx];
}
