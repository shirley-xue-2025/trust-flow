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

// --- Gateway routes (LOCAL_QWEN_72B / CLOUD_QWEN_MAX) ----------------------
//
// The gateway needs raw completion text, not the boardroom envelope above.
// LOCAL_QWEN_72B is presented as a sovereign on-prem node; until a real GPU
// box is wired up, it's backed by the same DashScope service under dedicated
// env vars, so pointing it at a genuine local endpoint later is a config
// change, not a code change.

export const LOCAL_QWEN_72B_BASE_URL = process.env.LOCAL_QWEN_72B_BASE_URL ?? QWEN_BASE_URL;
export const LOCAL_QWEN_72B_MODEL = process.env.LOCAL_QWEN_72B_MODEL ?? QWEN_MODEL;
// A real local box likely needs no key; fall back to the DashScope key so the
// cloud-backed default works out of the box.
export const LOCAL_QWEN_72B_API_KEY =
  process.env.LOCAL_QWEN_72B_API_KEY ?? process.env.DASHSCOPE_API_KEY;

export interface RouteClientConfig {
  baseURL: string;
  apiKey: string | undefined;
  model: string;
}

export const CLOUD_QWEN_MAX_CONFIG: RouteClientConfig = {
  baseURL: QWEN_BASE_URL,
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: QWEN_MODEL,
};

export const LOCAL_QWEN_72B_CONFIG: RouteClientConfig = {
  baseURL: LOCAL_QWEN_72B_BASE_URL,
  apiKey: LOCAL_QWEN_72B_API_KEY,
  model: LOCAL_QWEN_72B_MODEL,
};

export function hasApiKeyFor(cfg: RouteClientConfig): boolean {
  return Boolean(cfg.apiKey);
}

const routeClients = new Map<string, OpenAI>();
function getRouteClient(cfg: RouteClientConfig): OpenAI {
  if (!cfg.apiKey) {
    throw new Error(`No API key configured for baseURL ${cfg.baseURL} — live path unavailable.`);
  }
  let routeClient = routeClients.get(cfg.baseURL);
  if (!routeClient) {
    routeClient = new OpenAI({
      apiKey: cfg.apiKey,
      baseURL: cfg.baseURL,
      // See getClient() above — same undici-fetch workaround.
      fetch: globalThis.fetch as unknown as ClientOptions['fetch'],
    });
    routeClients.set(cfg.baseURL, routeClient);
  }
  return routeClient;
}

/** Plain-text single-turn completion for the gateway routes (not a boardroom envelope). */
export async function chatComplete(
  cfg: RouteClientConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const completion = await getRouteClient(cfg).chat.completions.create({
    model: cfg.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
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
