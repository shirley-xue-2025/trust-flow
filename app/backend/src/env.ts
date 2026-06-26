/**
 * Auto-load a local, git-ignored `.env` so you never have to pass secrets on the
 * command line (keeps keys out of shell history and out of pasted commands).
 *
 * Uses Node's built-in env-file loader (Node 20.12+) — no `dotenv` dependency.
 * Tries a few locations relative to the process cwd so it works whether `.env`
 * lives at the repo root, the `src/` workspace root, or the backend package.
 * In production (e.g. Docker) there is no `.env`, so this is a safe no-op and the
 * real environment variables are used as-is.
 *
 * Import this for its side effect as the FIRST import of any entry point, before
 * anything reads `process.env` (e.g. qwen/client.ts resolves QWEN_BASE_URL at
 * module load).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const candidate of ['.env', '../.env', '../../.env']) {
  const abs = resolve(process.cwd(), candidate);
  if (existsSync(abs)) {
    process.loadEnvFile(abs);
    break;
  }
}
