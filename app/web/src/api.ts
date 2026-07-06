/**
 * Backend API client — fetch for REST, EventSource for the boardroom SSE stream.
 * Same envelope/policy types as the backend (imported from @trustflow/shared),
 * so the UI can never drift from what the gateway enforces.
 */
import type {
  BoardroomEnvelope,
  EvalScenario,
  GatewayAuditEvent,
  OrgConfig,
  PolicyArtifact,
  RequestPacket,
  SessionOutcome,
} from '@trustflow/shared';

const BASE = '/v1';

export async function getOrg(): Promise<OrgConfig> {
  return (await fetch(`${BASE}/org`)).json();
}

export async function getScenarios(): Promise<EvalScenario[]> {
  return (await fetch(`${BASE}/scenarios`)).json();
}

export async function startSession(
  request: RequestPacket,
  replay?: string,
): Promise<{ session_id: string; state: string; replay: string | null }> {
  const qs = replay ? `?replay=${encodeURIComponent(replay)}` : '';
  const res = await fetch(`${BASE}/boardroom/session${qs}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'session failed');
  return res.json();
}

export interface BoardroomResult {
  outcome: SessionOutcome;
  state: string;
  deny_code: string | null;
  routing_decision: string | null;
  local_redaction?: boolean;
  policy: PolicyArtifact;
  policy_version_hash: string;
}

/** Open the SSE stream; calls onTurn per agent envelope, onResult at the end. */
export function streamSession(
  sessionId: string,
  handlers: {
    onTurn: (env: BoardroomEnvelope) => void;
    onResult: (r: BoardroomResult) => void;
    onError?: (msg: string) => void;
  },
): EventSource {
  const es = new EventSource(`${BASE}/boardroom/${sessionId}/stream`);
  es.addEventListener('turn', (e) => handlers.onTurn(JSON.parse((e as MessageEvent).data)));
  es.addEventListener('result', (e) => {
    handlers.onResult(JSON.parse((e as MessageEvent).data));
    es.close();
  });
  es.addEventListener('error', (e) => {
    const msg = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data).message : 'stream error';
    handlers.onError?.(msg);
    es.close();
  });
  return es;
}

export interface InferenceResponse {
  outcome: string;
  deny_reason_code?: string;
  routing_decision: string;
  local_redaction?: boolean;
  redaction_audit_event?: GatewayAuditEvent;
  redacted_prompt?: string;
  response_body?: string;
  audit_event: GatewayAuditEvent;
}

export async function runInference(body: {
  policy_id: string;
  prompt: string;
  request?: RequestPacket;
}): Promise<InferenceResponse> {
  const res = await fetch(`${BASE}/inference`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'inference failed');
  return res.json();
}

export async function getAudit(limit = 50): Promise<GatewayAuditEvent[]> {
  const res = await fetch(`${BASE}/audit?limit=${limit}`);
  return (await res.json()).events;
}
