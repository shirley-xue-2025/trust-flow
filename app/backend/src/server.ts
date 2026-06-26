/**
 * Fastify server — REST + SSE. Loads the three seed fixtures on boot.
 *
 * Endpoints:
 *   POST /v1/boardroom/session         start a negotiation (live or ?replay=S0X)
 *   GET  /v1/boardroom/:id/stream      SSE — one event per agent turn, then result
 *   GET  /v1/policy/:id                compiled policy artifact + hash
 *   POST /v1/inference                 governed inference through the gateway
 *   GET  /v1/audit                     tail of the JSONL audit log
 *   GET  /v1/scenarios, /v1/org        demo metadata
 */
import './env.js'; // auto-load .env before anything reads process.env
import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { RequestPacket } from '@trustflow/shared';
import { ORG, REGISTRY, SCENARIOS, getScenario } from './fixtures/index.js';
import {
  createSession,
  getSession,
  runSession,
  type BoardroomSession,
} from './boardroom/session.js';
import { hasGolden } from './boardroom/golden.js';
import { runInference } from './gateway/enforce.js';
import { readAudit, readPolicyById } from './store/index.js';
import { hasApiKey } from './qwen/client.js';

export function buildServer() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
  app.register(cors, { origin: true });

  app.get('/v1/health', async () => ({
    ok: true,
    live_qwen: hasApiKey(),
    org: ORG.org_id,
  }));

  app.get('/v1/org', async () => ORG);
  app.get('/v1/tools', async () => REGISTRY);
  app.get('/v1/scenarios', async () => SCENARIOS);

  // --- Start a boardroom session --------------------------------------------
  // body: a RequestPacket. query: ?replay=S0X (uses the golden transcript and,
  // if no explicit body, the scenario's own request packet).
  app.post('/v1/boardroom/session', async (req, reply) => {
    const replay = (req.query as { replay?: string }).replay;
    let request = req.body as RequestPacket | undefined;

    if (replay) {
      if (!hasGolden(replay)) return reply.code(404).send({ error: `no golden transcript ${replay}` });
      const scenario = getScenario(replay);
      request = request ?? scenario?.request;
    }
    if (!request?.tool_id) {
      return reply.code(400).send({ error: 'request packet with tool_id required' });
    }

    const session = createSession(request);
    // Stash replay id so the stream endpoint can drive it.
    (session as BoardroomSession & { replay?: string }).replay = replay;
    return { session_id: session.session_id, state: session.state, replay: replay ?? null };
  });

  // --- SSE stream of agent turns + final result -----------------------------
  app.get('/v1/boardroom/:id/stream', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const session = getSession(id);
    if (!session) return reply.code(404).send({ error: 'session not found' });

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const replay = (session as BoardroomSession & { replay?: string }).replay;
    try {
      await runSession(session, ORG, {
        replayScenarioId: replay,
        onTurn: (env) => send('turn', env),
      });
      send('result', {
        outcome: session.outcome,
        state: session.state,
        deny_code: session.deny_code ?? null,
        routing_decision: session.routing_decision ?? null,
        policy: session.policy,
        policy_version_hash: session.policy_version_hash,
      });
    } catch (err) {
      send('error', { message: (err as Error).message });
    } finally {
      reply.raw.end();
    }
  });

  // --- Policy by id ----------------------------------------------------------
  app.get('/v1/policy/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const stored = readPolicyById(id);
    if (!stored) return reply.code(404).send({ error: 'policy not found' });
    return stored;
  });

  // --- Governed inference through the gateway -------------------------------
  // body: { policy_id, prompt, request? }
  app.post('/v1/inference', async (req, reply) => {
    const body = req.body as {
      policy_id: string;
      prompt: string;
      actor_id?: string;
      request?: RequestPacket;
    };
    const stored = readPolicyById(body.policy_id);
    if (!stored) return reply.code(404).send({ error: 'policy not found' });

    const request: RequestPacket =
      body.request ??
      ({
        tool_id: stored.policy.tool_id,
        use_case_category: stored.policy.use_case_category ?? 'code_completion',
        data_classes: [],
        entity_country: ORG.entity_country,
      } as RequestPacket);

    const result = runInference(
      {
        policy: stored.policy,
        policy_version_hash: stored.policy_version_hash,
        request,
        prompt: body.prompt,
        actor_id: body.actor_id,
      },
      { org: ORG, registry: REGISTRY },
    );
    return result;
  });

  // --- Audit tail ------------------------------------------------------------
  app.get('/v1/audit', async (req) => {
    const limit = Number((req.query as { limit?: string }).limit ?? 100);
    return { events: readAudit(limit) };
  });

  return app;
}

// Boot when run directly.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT ?? 8080);
  const app = buildServer();
  app
    .listen({ port, host: '0.0.0.0' })
    .then(() => app.log.info(`TrustFlow backend on :${port} (live_qwen=${hasApiKey()})`))
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
