/**
 * File-backed stores (no DB). Policy store (JSON), audit log (JSONL), sessions
 * (in-memory). Paths default under <repo>/data and can be overridden by env, so
 * tests use an isolated temp dir and don't pollute the real audit log.
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GatewayAuditEvent, PolicyArtifact, PolicyActivationStatus } from '@trustflow/shared';

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
  activation_status: PolicyActivationStatus;
  request_id?: string;
  activated_at?: string;
  activated_by_reviewer_ids?: string[];
}

export interface WritePolicyOptions {
  activation_status?: PolicyActivationStatus;
  request_id?: string;
}

function normalizeStoredPolicy(raw: StoredPolicy): StoredPolicy {
  return {
    ...raw,
    activation_status: raw.activation_status ?? 'draft',
  };
}

export function writePolicy(
  policy: PolicyArtifact,
  hash: string,
  opts: WritePolicyOptions = {},
): StoredPolicy {
  ensureDir(policyDir());
  const record: StoredPolicy = {
    policy,
    policy_version_hash: hash,
    activation_status: opts.activation_status ?? 'draft',
    request_id: opts.request_id ?? policy.request_id,
  };
  writeFileSync(join(policyDir(), `${policy.policy_id}.json`), JSON.stringify(record, null, 2));
  writeFileSync(join(policyDir(), `hash_${hash}.json`), JSON.stringify(record, null, 2));
  return record;
}

/** Prefer hash-specific artifact when demos share a policy_id (e.g. S04 vs S02). */
export function resolveStoredPolicy(
  policyId: string,
  policyVersionHash?: string | null,
): StoredPolicy | null {
  if (policyVersionHash) {
    const byHash = readPolicyByHash(policyVersionHash);
    if (byHash && byHash.policy.policy_id === policyId) return byHash;
  }
  return readPolicyById(policyId);
}

export function activatePolicy(
  policyId: string,
  reviewerIds: string[],
  policyVersionHash?: string | null,
): StoredPolicy | null {
  const stored = resolveStoredPolicy(policyId, policyVersionHash);
  if (!stored) return null;
  const record: StoredPolicy = {
    ...stored,
    activation_status: 'active',
    activated_at: new Date().toISOString(),
    activated_by_reviewer_ids: reviewerIds,
  };
  writeFileSync(join(policyDir(), `${policyId}.json`), JSON.stringify(record, null, 2));
  writeFileSync(join(policyDir(), `hash_${record.policy_version_hash}.json`), JSON.stringify(record, null, 2));
  return record;
}

/**
 * Newest ACTIVE version of a policy id. A later draft compile (e.g. a glassbox
 * replay) overwrites the `<policyId>.json` latest pointer, but the signed
 * version survives as `hash_*.json` — the gateway must keep enforcing it.
 */
export function readActivePolicy(policyId: string): StoredPolicy | null {
  const latest = readPolicyById(policyId);
  if (latest?.activation_status === 'active') return latest;
  if (!existsSync(policyDir())) return null;
  const actives = readdirSync(policyDir())
    .filter((f) => f.startsWith('hash_') && f.endsWith('.json'))
    .map((f) => normalizeStoredPolicy(JSON.parse(readFileSync(join(policyDir(), f), 'utf8')) as StoredPolicy))
    .filter((p) => p.policy.policy_id === policyId && p.activation_status === 'active')
    .sort((a, b) => (b.activated_at ?? '').localeCompare(a.activated_at ?? ''));
  return actives[0] ?? null;
}

export function readPolicyById(policyId: string): StoredPolicy | null {
  const p = join(policyDir(), `${policyId}.json`);
  if (!existsSync(p)) return null;
  return normalizeStoredPolicy(JSON.parse(readFileSync(p, 'utf8')) as StoredPolicy);
}

export function readPolicyByHash(hash: string): StoredPolicy | null {
  const p = join(policyDir(), `hash_${hash}.json`);
  if (!existsSync(p)) return null;
  return normalizeStoredPolicy(JSON.parse(readFileSync(p, 'utf8')) as StoredPolicy);
}

export function listPolicies(): StoredPolicy[] {
  if (!existsSync(policyDir())) return [];
  return readdirSync(policyDir())
    .filter((f) => f.endsWith('.json') && !f.startsWith('hash_'))
    .map((f) => normalizeStoredPolicy(JSON.parse(readFileSync(join(policyDir(), f), 'utf8')) as StoredPolicy));
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
