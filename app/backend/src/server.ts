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
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
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
import { readActivePolicy, readAudit, resolveStoredPolicy } from './store/index.js';
import { hasApiKey, QWEN_MODEL } from './qwen/client.js';
import {
  createEmployeeRequest,
  getEmployeeRequest,
  isApprovedForGateway,
  listEmployeeRequests,
  nextStepsForRecord,
  serializeEmployeeRequest,
  toolDisplayName,
  updateEmployeeRequest,
} from './employee/requests.js';
import { runEmployeeBoardroom, finalizeRequestFromSession } from './employee/runBoardroom.js';
import { deriveDisplayStatus } from './employee/requestState.js';
import {
  activateRequestPolicy,
  buildGovernanceQueue,
  decideAppealForRequest,
  decideReviewForRequest,
  governanceOverviewStats,
  governanceRequestDetail,
} from './governance/service.js';
import {
  acceptDeny,
  getAdvocatePayload,
  proposeAlternative,
  submitAppeal,
} from './employee/resolution.js';
import { seedDemoIfEmpty, forceReseedDemo } from './demo/seed.js';
import type { AppealType, EmployeeProfile } from '@trustflow/shared';

const DEMO_EMPLOYEE: EmployeeProfile = {
  user_id: 'emp_payments_42',
  display_name: 'Alex Weber',
  email: 'alex.weber@nordpay.example',
  department: 'payments_engineering',
  role: 'senior_developer',
};

export function buildServer() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
  app.register(cors, { origin: true });

  app.get('/v1/health', async () => ({
    ok: true,
    live_qwen: hasApiKey(),
    qwen_model: hasApiKey() ? QWEN_MODEL : null,
    org: ORG.org_id,
  }));

  app.get('/v1/org', async () => ORG);
  app.get('/v1/tools', async () => REGISTRY);
  app.get('/v1/scenarios', async () => SCENARIOS);

  // --- Employee portal -------------------------------------------------------

  app.get('/v1/employee/profile', async () => DEMO_EMPLOYEE);

  app.get('/v1/employee/requests', async (req) => {
    const actorId = (req.query as { actor_id?: string }).actor_id ?? DEMO_EMPLOYEE.user_id;
    return { requests: listEmployeeRequests(actorId).map(serializeEmployeeRequest) };
  });

  app.get('/v1/employee/requests/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const record = getEmployeeRequest(id);
    if (!record) return reply.code(404).send({ error: 'request not found' });
    const synced = serializeEmployeeRequest(record);
    return { ...synced, next_steps: nextStepsForRecord(synced, REGISTRY) };
  });

  // body: { tool_id, use_case_category, department?, data_classes?, business_justification?, replay? }
  app.post('/v1/employee/requests', async (req, reply) => {
    const body = req.body as {
      tool_id: string;
      use_case_category: string;
      department?: string;
      data_classes?: string[];
      annex_iii_risk?: boolean;
      business_justification?: string;
      betriebsvereinbarung_status?: RequestPacket['betriebsvereinbarung_status'];
      vendor_dpa_status?: RequestPacket['vendor_dpa_status'];
      replay?: string;
      parent_request_id?: string;
      actor?: Partial<EmployeeProfile>;
    };

    if (!body.tool_id || !body.use_case_category) {
      return reply.code(400).send({ error: 'tool_id and use_case_category required' });
    }

    const replay = body.replay;
    if (replay && !hasGolden(replay)) {
      return reply.code(404).send({ error: `no golden transcript ${replay}` });
    }

    const actor = { ...DEMO_EMPLOYEE, ...body.actor };
    const requestId = randomUUID();
    const packet: RequestPacket = {
      request_id: requestId,
      tool_id: body.tool_id,
      use_case_category: body.use_case_category,
      department: body.department ?? actor.department,
      data_classes: body.data_classes ?? [],
      annex_iii_risk: body.annex_iii_risk ?? body.use_case_category === 'hr_screening',
      entity_country: ORG.entity_country,
      betriebsvereinbarung_status: body.betriebsvereinbarung_status ?? ORG.betriebsvereinbarung_status,
      vendor_dpa_status:
        body.vendor_dpa_status ??
        REGISTRY.tools.find((t) => t.tool_id === body.tool_id)?.vendor_dpa_status,
    };

    if (replay) {
      const scenario = getScenario(replay);
      if (scenario?.request) Object.assign(packet, scenario.request, { request_id: requestId });
    }

    const record = createEmployeeRequest({
      actor_id: actor.user_id,
      actor_name: actor.display_name,
      department: packet.department ?? actor.department,
      role: actor.role,
      tool_id: packet.tool_id,
      tool_display_name: toolDisplayName(REGISTRY, packet.tool_id),
      use_case_category: packet.use_case_category,
      business_justification: body.business_justification,
      packet,
      parent_request_id: body.parent_request_id,
    });

    void runEmployeeBoardroom(record.request_id, ORG, REGISTRY, { replayScenarioId: replay }).catch(
      (err) => {
        updateEmployeeRequest(record.request_id, {
          negotiation_phase: 'complete',
          agent_outcome: 'DENIED',
          outcome: 'DENIED',
          employee_resolution: 'accepted',
          human_decision: 'not_required',
          policy_activation: 'none',
          next_steps: [`Negotiation failed: ${(err as Error).message}`],
        });
      },
    );

    return {
      request_id: record.request_id,
      status: 'submitted',
    };
  });

  app.get('/v1/employee/requests/:id/advocate', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const payload = getAdvocatePayload(id, REGISTRY);
    if (!payload) return reply.code(404).send({ error: 'request not found' });
    return payload;
  });

  app.post('/v1/employee/requests/:id/advocate', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { message?: string };
    if (!body.message?.trim()) return reply.code(400).send({ error: 'message required' });
    const payload = getAdvocatePayload(id, REGISTRY, body.message.trim());
    if (!payload) return reply.code(404).send({ error: 'request not found' });
    return payload;
  });

  app.post('/v1/employee/requests/:id/accept-deny', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const record = acceptDeny(id);
    if (!record) return reply.code(404).send({ error: 'request not found' });
    return { record };
  });

  app.post('/v1/employee/requests/:id/appeal', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { appeal_type?: AppealType; statement?: string };
    if (!body.appeal_type || !body.statement) {
      return reply.code(400).send({ error: 'appeal_type and statement required' });
    }
    const result = submitAppeal(id, DEMO_EMPLOYEE.user_id, body.appeal_type, body.statement);
    if ('error' in result) return reply.code(result.code).send({ error: result.error });
    return result;
  });

  app.post('/v1/employee/requests/:id/propose-alternative', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as {
      tool_id?: string;
      use_case_category?: string;
      business_justification?: string;
      data_classes?: string[];
      replay?: string;
    };
    if (!body.tool_id || !body.use_case_category) {
      return reply.code(400).send({ error: 'tool_id and use_case_category required' });
    }
    const result = await proposeAlternative(id, DEMO_EMPLOYEE.user_id, ORG, REGISTRY, {
      tool_id: body.tool_id,
      use_case_category: body.use_case_category,
      business_justification: body.business_justification,
      data_classes: body.data_classes,
      replay: body.replay,
    });
    if ('error' in result) return reply.code(result.code).send({ error: result.error });
    return result;
  });

  // SSE stream of boardroom turns for an employee request (re-run or poll existing session).
  app.get('/v1/employee/requests/:id/stream', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const record = getEmployeeRequest(id);
    if (!record) return reply.code(404).send({ error: 'request not found' });

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

    if (deriveDisplayStatus(record) !== 'submitted' && deriveDisplayStatus(record) !== 'negotiating') {
      send('result', serializeEmployeeRequest(record));
      reply.raw.end();
      return;
    }

    try {
      const session = createSession(record.packet);
      const replay = (req.query as { replay?: string }).replay;
      await runSession(session, ORG, {
        replayScenarioId: replay,
        requestId: id,
        onTurn: (env) => send('turn', env),
      });

      const updated = finalizeRequestFromSession(
        record,
        session.session_id,
        ORG,
        REGISTRY,
        session.transcript,
        session.outcome,
        {
          deny_code: session.deny_code,
          routing_decision: session.routing_decision,
          local_redaction: session.local_redaction,
          policy_id: session.policy?.policy_id,
          policy_version_hash: session.policy_version_hash,
        },
      );
      send('result', updated ? serializeEmployeeRequest(updated) : record);
    } catch (err) {
      send('error', { message: (err as Error).message });
    } finally {
      reply.raw.end();
    }
  });

  app.get('/v1/employee/tools', async (req) => {
    const actorId = (req.query as { actor_id?: string }).actor_id ?? DEMO_EMPLOYEE.user_id;
    const approved = listEmployeeRequests(actorId).filter((r) => isApprovedForGateway(r));
    return {
      tools: approved.map((r) => ({
        request_id: r.request_id,
        tool_id: r.tool_id,
        tool_display_name: r.tool_display_name,
        policy_id: r.policy_id,
        policy_version_hash: r.policy_version_hash,
        use_case_category: r.use_case_category,
        routing_decision: r.routing_decision,
      })),
    };
  });

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
        local_redaction: session.local_redaction ?? false,
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
    const hash = (req.query as { hash?: string }).hash;
    const stored = resolveStoredPolicy(id, hash);
    if (!stored) return reply.code(404).send({ error: 'policy not found' });
    return stored;
  });

  // --- Boardroom session snapshot (trust / governance views) -----------------
  app.get('/v1/boardroom/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const session = getSession(id);
    if (!session) return reply.code(404).send({ error: 'session not found' });
    return {
      session_id: session.session_id,
      state: session.state,
      outcome: session.outcome ?? null,
      deny_code: session.deny_code ?? null,
      routing_decision: session.routing_decision ?? null,
      local_redaction: session.local_redaction ?? false,
      policy_id: session.policy?.policy_id ?? null,
      policy_version_hash: session.policy_version_hash ?? null,
      transcript: session.transcript,
      policy: session.policy ?? null,
    };
  });

  // --- Governance oversight (all employee requests + org context) ----------
  app.get('/v1/governance/overview', async () => {
    const requests = listEmployeeRequests().map(serializeEmployeeRequest);
    const audit = readAudit(20);
    return {
      org: ORG,
      stats: {
        ...governanceOverviewStats(ORG),
        audit_events: audit.length,
      },
      requests,
      recent_audit: audit,
    };
  });

  app.get('/v1/governance/queues', async (req) => {
    const q = req.query as {
      queue?: string;
      role?: string;
      limit?: string;
      offset?: string;
    };
    return buildGovernanceQueue(ORG, {
      queue: (q.queue as 'all' | 'signoff' | 'appeals' | 'external' | 'in_review' | 'negotiating') ?? 'all',
      role: (q.role as 'all' | 'dpo' | 'procurement' | 'it') ?? 'all',
      limit: Number(q.limit ?? 50),
      offset: Number(q.offset ?? 0),
    });
  });

  app.get('/v1/governance/requests/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const detail = governanceRequestDetail(id, ORG);
    if (!detail) return reply.code(404).send({ error: 'request not found' });

    const session = detail.record.session_id ? getSession(detail.record.session_id) : undefined;
    const audit = readAudit(100).filter((e) => e.policy_id === detail.record.policy_id);
    const transcript =
      session?.transcript ??
      detail.record.transcript_snapshot ??
      [];

    return {
      ...detail,
      session: session
        ? {
            session_id: session.session_id,
            state: session.state,
            outcome: session.outcome ?? null,
            transcript: session.transcript,
          }
        : transcript.length
          ? {
              session_id: detail.record.session_id ?? detail.record.request_id,
              state: 'COMPILED',
              outcome: detail.record.agent_outcome ?? null,
              transcript,
            }
          : null,
      audit,
    };
  });

  app.post('/v1/governance/requests/:id/reviews/:reviewId/decide', async (req, reply) => {
    const { id, reviewId } = req.params as { id: string; reviewId: string };
    const body = req.body as { decision?: 'approve' | 'reject'; rationale?: string };
    const headers = req.headers;
    const reviewerId =
      (headers['x-reviewer-id'] as string | undefined) ?? 'katrin.mueller@nordpay.example';

    if (!body.decision || !body.rationale) {
      return reply.code(400).send({ error: 'decision and rationale required' });
    }

    const result = await decideReviewForRequest(id, reviewId, body.decision, body.rationale, reviewerId, ORG);
    if ('error' in result) return reply.code(result.code).send({ error: result.error });
    return result;
  });

  app.post('/v1/governance/requests/:id/activate', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const reviewerId =
      (req.headers['x-reviewer-id'] as string | undefined) ?? 'katrin.mueller@nordpay.example';
    const result = await activateRequestPolicy(id, reviewerId, ORG);
    if ('error' in result) return reply.code(result.code).send({ error: result.error });
    return result;
  });

  app.post('/v1/governance/appeals/:id/decide', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as {
      decision?: 'grant' | 'deny';
      rationale?: string;
      registry_patch?: { betriebsvereinbarung_status?: 'signed' | 'pending' };
    };
    const reviewerId =
      (req.headers['x-reviewer-id'] as string | undefined) ?? 'katrin.mueller@nordpay.example';
    if (!body.decision || !body.rationale) {
      return reply.code(400).send({ error: 'decision and rationale required' });
    }
    const result = await decideAppealForRequest(
      id,
      body.decision,
      body.rationale,
      reviewerId,
      ORG,
      REGISTRY,
      body.registry_patch,
    );
    if ('error' in result) return reply.code(result.code).send({ error: result.error });
    return result;
  });

  app.post('/v1/demo/reseed', async () => {
    const count = await forceReseedDemo(ORG, REGISTRY, {
      user_id: DEMO_EMPLOYEE.user_id,
      display_name: DEMO_EMPLOYEE.display_name,
      department: DEMO_EMPLOYEE.department,
      role: DEMO_EMPLOYEE.role,
    });
    return { reseeded: true, count };
  });

  // --- Governed inference through the gateway -------------------------------
  // body: { policy_id, prompt, request? }
  app.post('/v1/inference', async (req, reply) => {
    const body = req.body as {
      policy_id: string;
      policy_version_hash?: string;
      prompt: string;
      actor_id?: string;
      request?: RequestPacket;
    };
    let stored = resolveStoredPolicy(body.policy_id, body.policy_version_hash);
    if (!stored) return reply.code(404).send({ error: 'policy not found' });
    if (stored.activation_status !== 'active') {
      // The gateway enforces the version humans signed, not a newer draft
      // compile (e.g. from a glassbox replay) that superseded the latest pointer.
      const active = readActivePolicy(body.policy_id);
      if (!active) {
        return reply.code(403).send({
          error: 'policy not activated',
          deny_reason_code: 'POLICY_NOT_ACTIVATED',
        });
      }
      stored = active;
    }

    const request: RequestPacket =
      body.request ??
      ({
        tool_id: stored.policy.tool_id,
        use_case_category: stored.policy.use_case_category ?? 'code_completion',
        data_classes: [],
        entity_country: ORG.entity_country,
      } as RequestPacket);

    const result = await runInference(
      {
        policy: stored.policy,
        policy_version_hash: stored.policy_version_hash,
        request,
        prompt: body.prompt,
        actor_id: body.actor_id,
      },
      { org: ORG, registry: REGISTRY },
      { activation_status: stored.activation_status },
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

// Boot when run directly (path.resolve handles spaces; file:// string compare does not).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const port = Number(process.env.PORT ?? 8080);
  const app = buildServer();
  void seedDemoIfEmpty(ORG, REGISTRY, {
    user_id: DEMO_EMPLOYEE.user_id,
    display_name: DEMO_EMPLOYEE.display_name,
    department: DEMO_EMPLOYEE.department,
    role: DEMO_EMPLOYEE.role,
  }).then((r) => {
    if (r.seeded) app.log.info(`Demo seeded ${r.count} requests`);
  });
  app
    .listen({ port, host: '0.0.0.0' })
    .then(() =>
      app.log.info(
        `TrustFlow backend on :${port} (live_qwen=${hasApiKey()}, model=${hasApiKey() ? QWEN_MODEL : 'replay'})`,
      ),
    )
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
