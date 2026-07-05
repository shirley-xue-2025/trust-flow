/**
 * Qwen client — uses the OpenAI SDK pointed at the DashScope OpenAI-compatible
 * endpoint, model qwen-max. Returns a structured boardroom envelope validated by
 * the zod schema. Retries once on invalid JSON.
 *
 * The live path is gated behind DASHSCOPE_API_KEY. When the key is absent, the
 * boardroom uses golden-transcript replay instead (see boardroom/round.ts), so
 * the whole test suite runs with no network and no key.
 */
import OpenAI, { type ClientOptions } from 'openai';
import { parseEnvelope } from '../boardroom/envelope.js';
import type { BoardroomEnvelope } from '@trustflow/shared';

export const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

/** Free-quota dev default — set QWEN_MODEL_DEV in .env to override. */
export const QWEN_MODEL_DEV = process.env.QWEN_MODEL_DEV ?? 'qwen-flash';
/** Hackathon / demo video — set QWEN_MODEL_DEMO in .env to override. */
export const QWEN_MODEL_DEMO = process.env.QWEN_MODEL_DEMO ?? 'qwen-max';

function resolveQwenModel(): string {
  const profile = process.env.QWEN_PROFILE;
  if (profile === 'demo') return QWEN_MODEL_DEMO;
  if (profile === 'dev') return QWEN_MODEL_DEV;
  return process.env.QWEN_MODEL ?? QWEN_MODEL_DEV;
}

/** Active model for this process. QWEN_PROFILE=demo forces demo model without editing .env. */
export const QWEN_MODEL = resolveQwenModel();

export function hasApiKey(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!process.env.DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not set — live Qwen path unavailable (use replay mode).');
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: QWEN_BASE_URL,
      // Force Node's native fetch (undici). The SDK otherwise uses its bundled
      // node-fetch@2, whose gzip handling throws ERR_STREAM_PREMATURE_CLOSE on
      // DashScope's compressed responses. undici decodes gzip correctly. Cast
      // bridges native fetch's types to the SDK's node-fetch signature (runtime-safe).
      fetch: globalThis.fetch as unknown as ClientOptions['fetch'],
    });
  }
  return client;
}

export interface QwenTurnArgs {
  systemPrompt: string;
  userPrompt: string;
  session_id: string;
  round: number;
  agent: string;
}

/**
 * One agent turn against qwen-max, returning a validated envelope.
 * Asks for JSON output; retries once with a stricter reminder if parsing fails.
 */
export async function qwenAgentTurn(args: QwenTurnArgs): Promise<BoardroomEnvelope> {
  const attempt = async (extraNudge?: string): Promise<BoardroomEnvelope> => {
    const completion = await getClient().chat.completions.create({
      model: QWEN_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: args.systemPrompt },
        {
          role: 'user',
          content: extraNudge ? `${args.userPrompt}\n\n${extraNudge}` : args.userPrompt,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? '';
    const json = JSON.parse(content);
    return parseEnvelope(json, {
      session_id: args.session_id,
      round: args.round,
      agent: args.agent,
    });
  };

  try {
    return await attempt();
  } catch {
    // Retry once with a strict reminder to emit a single valid envelope object.
    return attempt(
      'Your previous reply was not a single valid JSON envelope. Reply with ONLY the JSON object matching the envelope schema — no prose, no markdown fences.',
    );
  }
}
