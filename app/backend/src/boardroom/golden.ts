/**
 * Golden-transcript loader for REPLAY MODE.
 *
 * Replay is a first-class path (the Step 6 demo fallback): the boardroom can
 * source validated envelopes from a golden transcript instead of calling Qwen
 * live. Transcripts are captured from real qwen-max runs via
 * `npm run capture:golden -- S04` and replayed deterministically in tests and demo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BoardroomEnvelope } from '@trustflow/shared';
import { parseEnvelope } from './envelope.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Golden transcripts live with the tests; override with TRUSTFLOW_GOLDEN_DIR.
const DEFAULT_GOLDEN_DIR = join(__dirname, '..', '..', 'test', 'golden');

export function goldenDir(): string {
  return process.env.TRUSTFLOW_GOLDEN_DIR ?? DEFAULT_GOLDEN_DIR;
}

export function hasGolden(scenarioId: string): boolean {
  return existsSync(join(goldenDir(), `${scenarioId}.json`));
}

/** Load + validate a golden transcript. Every envelope is zod-validated. */
export function loadGolden(scenarioId: string): BoardroomEnvelope[] {
  const path = join(goldenDir(), `${scenarioId}.json`);
  if (!existsSync(path)) {
    throw new Error(`no golden transcript for ${scenarioId} at ${path}`);
  }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown[];
  return raw.map((e) => parseEnvelope(e));
}
