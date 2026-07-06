/**
 * Compile — the DETERMINISTIC GATE (NO LLM).
 *
 * Takes a validated boardroom transcript and turns it into:
 *   1. a deterministic SESSION OUTCOME (APPROVED | DENIED | PENDING_EXTERNAL | PENDING_HUMAN)
 *   2. a schema-valid, hashed PolicyArtifact (rules.json)
 *
 * Outcome precedence (from the veto/sign-off matrix in boardroom_protocol.md):
 *   - prohibited practice / high-risk Annex III without oversight → DENIED
 *   - vendor DPA pending (procurement veto)                       → DENIED
 *   - DE entity + Betriebsvereinbarung pending                    → PENDING_EXTERNAL
 *   - otherwise                                                   → APPROVED
 *
 * The artifact is ALWAYS compiled (even for DENIED/PENDING) so the UI can show
 * "what would be enforced once gates clear" — the deny_overrides on it keep the
 * gateway blocking until the external process completes.
 */
import _Ajv2020 from 'ajv/dist/2020.js';
import _addFormats from 'ajv-formats';
// ajv ships CJS; under NodeNext the constructor/fn hide behind `.default`.
/* eslint-disable @typescript-eslint/no-explicit-any */
const Ajv2020: any = (_Ajv2020 as any).default ?? _Ajv2020;
const addFormats: any = (_addFormats as any).default ?? _addFormats;
/* eslint-enable @typescript-eslint/no-explicit-any */
import policySchema from '@trustflow/shared/schemas/policy-artifact.schema.json' with { type: 'json' };
import { policyVersionHash } from '@trustflow/shared';
import type {
  BoardroomEnvelope,
  DenyReasonCode,
  OrgConfig,
  PolicyArtifact,
  RequestPacket,
  SessionOutcome,
} from '@trustflow/shared';
import { mergeTranscript } from './merge.js';
import { checkFloor, type FloorViolation } from './floor.js';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validatePolicy = ajv.compile(policySchema);

export interface CompileResult {
  outcome: SessionOutcome;
  policy: PolicyArtifact;
  policy_version_hash: string;
  deny_code?: DenyReasonCode;
  /** The route that will actually complete the request. */
  routing_decision: PolicyArtifact['routing']['default'];
  /** True when sensitive/payment traffic is redacted on the sovereign local
   * node before relaying to `routing_decision` for completion (the local node
   * is a safety gateway, not an alternate answer engine — see gateway/routing.ts). */
  local_redaction: boolean;
  floorViolations: FloorViolation[];
  schemaValid: boolean;
  schemaErrors?: string[];
}

/**
 * Resolve the routing decision the artifact yields for THIS request. Payment-
 * schema / sensitive data is redacted on the sovereign local node when the
 * policy sets routing.sensitive to LOCAL_QWEN_72B, then relayed to the
 * policy's default (completion) route — unless the default route IS the local
 * node, in which case there's nowhere to relay to and it's genuinely terminal.
 */
function resolveRouting(
  policy: PolicyArtifact,
  request: RequestPacket,
): { decision: string; local_redaction: boolean } {
  const sensitive =
    (request.data_classes ?? []).some((c) => c.includes('payment')) ||
    (request.data_classes ?? []).includes('payment_api_schemas');
  const sensitiveTarget = sensitive ? policy.routing.sensitive : undefined;
  const local_redaction = sensitiveTarget === 'LOCAL_QWEN_72B' && policy.routing.default !== 'LOCAL_QWEN_72B';
  const decision = local_redaction ? policy.routing.default : (sensitiveTarget ?? policy.routing.default);
  return { decision, local_redaction };
}

export function compile(
  transcript: BoardroomEnvelope[],
  request: RequestPacket,
  org: OrgConfig,
  opts: { session_id?: string } = {},
): CompileResult {
  const merged = mergeTranscript(transcript, request, org);
  const policy = merged.draft;

  policy.compiled_at = new Date().toISOString();
  policy.provenance = {
    boardroom_session_id: opts.session_id,
    agent_signoffs: merged.signoffs,
  };

  // --- Floor check (reject-if-weaker) ---------------------------------------
  const floorViolations = checkFloor(policy, org);

  // --- Deterministic outcome derivation -------------------------------------
  let outcome: SessionOutcome;
  let deny_code: DenyReasonCode | undefined;

  if (merged.vetoes.includes('PROHIBITED_PRACTICE') || floorViolations.length > 0) {
    outcome = 'DENIED';
    deny_code = 'PROHIBITED_PRACTICE';
  } else if (merged.vetoes.includes('HIGH_RISK_USE_DENIED')) {
    outcome = 'DENIED';
    deny_code = 'HIGH_RISK_USE_DENIED';
  } else if (merged.vetoes.includes('VENDOR_DPA_PENDING')) {
    outcome = 'DENIED';
    deny_code = 'VENDOR_DPA_PENDING';
  } else if (merged.denyOverrides.includes('BETRIEBSVEREINBARUNG_PENDING')) {
    // DE works-council gate is an EXTERNAL process, not an outright denial.
    outcome = 'PENDING_EXTERNAL';
    deny_code = 'BETRIEBSVEREINBARUNG_PENDING';
  } else {
    outcome = 'APPROVED';
  }

  // --- Schema validation + hash ---------------------------------------------
  // Strip undefined for clean canonicalization/validation.
  const clean = JSON.parse(JSON.stringify(policy)) as PolicyArtifact;
  const schemaValid = validatePolicy(clean) as boolean;
  const schemaErrors = schemaValid
    ? undefined
    : (validatePolicy.errors ?? []).map((e: { instancePath: string; message?: string }) => `${e.instancePath} ${e.message}`);

  const hash = policyVersionHash(clean);
  const routing = resolveRouting(clean, request);

  return {
    outcome,
    policy: clean,
    policy_version_hash: hash,
    deny_code,
    routing_decision: routing.decision,
    local_redaction: routing.local_redaction,
    floorViolations,
    schemaValid,
    schemaErrors,
  };
}
