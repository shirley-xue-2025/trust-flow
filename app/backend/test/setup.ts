/**
 * Test bootstrap: isolate the file stores into a temp dir and point the golden
 * loader at the committed golden transcripts. Ensures NO network and NO key:
 * we explicitly clear DASHSCOPE_API_KEY so any accidental live path throws.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

delete process.env.DASHSCOPE_API_KEY;
process.env.TRUSTFLOW_DATA_DIR = mkdtempSync(join(tmpdir(), 'trustflow-test-'));
process.env.TRUSTFLOW_GOLDEN_DIR = join(__dirname, 'golden');
