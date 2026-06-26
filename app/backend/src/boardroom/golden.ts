/**
 * Golden-transcript loader for REPLAY MODE.
 *
 * Replay is a first-class path (the Step 6 demo fallback): the boardroom can
 * source validated envelopes from a hand-authored golden transcript instead of
 * calling qwen-max. This is what makes the whole test suite run with NO network
 * and NO API key, and what makes the live demo recoverable in <2 min.
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
