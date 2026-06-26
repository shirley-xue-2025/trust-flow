/**
 * File-backed stores (no DB). Policy store (JSON), audit log (JSONL), sessions
 * (in-memory). Paths default under <repo>/data and can be overridden by env, so
 * tests use an isolated temp dir and don't pollute the real audit log.
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GatewayAuditEvent, PolicyArtifact } from '@trustflow/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = join(__dirname, '..', '..', '..', '..', 'data');

export function dataDir(): string {
  return process.env.TRUSTFLOW_DATA_DIR ?? DEFAULT_DATA_DIR;
}

function policyDir(): string {
  return join(dataDir(), 'policies');
}
function auditPath(): string {
  return join(dataDir(), 'audit.jsonl');
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// --- Policy store -----------------------------------------------------------

export interface StoredPolicy {
  policy: PolicyArtifact;
  policy_version_hash: string;
}

export function writePolicy(policy: PolicyArtifact, hash: string): void {
  ensureDir(policyDir());
  const record: StoredPolicy = { policy, policy_version_hash: hash };
  writeFileSync(join(policyDir(), `${policy.policy_id}.json`), JSON.stringify(record, null, 2));
  // Also index by hash for gateway load-by-hash.
  writeFileSync(join(policyDir(), `hash_${hash}.json`), JSON.stringify(record, null, 2));
}

export function readPolicyById(policyId: string): StoredPolicy | null {
  const p = join(policyDir(), `${policyId}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8')) as StoredPolicy;
}

export function readPolicyByHash(hash: string): StoredPolicy | null {
  const p = join(policyDir(), `hash_${hash}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8')) as StoredPolicy;
}

export function listPolicies(): StoredPolicy[] {
  if (!existsSync(policyDir())) return [];
  return readdirSync(policyDir())
    .filter((f) => f.endsWith('.json') && !f.startsWith('hash_'))
    .map((f) => JSON.parse(readFileSync(join(policyDir(), f), 'utf8')) as StoredPolicy);
}

// --- Audit log (JSONL) ------------------------------------------------------

export function appendAudit(event: GatewayAuditEvent): void {
  ensureDir(dataDir());
  appendFileSync(auditPath(), JSON.stringify(event) + '\n');
}

export function readAudit(limit = 100): GatewayAuditEvent[] {
  if (!existsSync(auditPath())) return [];
  const lines = readFileSync(auditPath(), 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l) as GatewayAuditEvent);
}
