/**
 * Canonical JSON serialization + content hash for policy artifacts.
 *
 * The policy_version_hash MUST be stable regardless of key insertion order,
 * because the SAME artifact is hashed by the compiler (when written) and by the
 * gateway (when enforced) and shown by the UI. json-stable-stringify gives a
 * deterministic key ordering; sha256 gives the version hash.
 */
import { createHash } from 'node:crypto';
import stableStringify from 'json-stable-stringify';

/** Stable, key-sorted JSON string. */
export function canonicalize(value: unknown): string {
  return stableStringify(value) ?? 'null';
}

/** SHA-256 hex digest of the canonical JSON — the policy_version_hash. */
export function policyVersionHash(value: unknown): string {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

/** SHA-256 of an arbitrary string (input/output fingerprints in the audit log). */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
