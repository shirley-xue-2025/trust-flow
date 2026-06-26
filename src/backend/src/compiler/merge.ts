/**
 * Deterministic merge — demands/concessions → PolicyArtifact (NO LLM).
 *
 * Implements the pseudocode in boardroom_protocol.md "Policy proposal merge
 * algorithm". The boardroom NEVER writes rules.json directly; it emits a stream
 * of envelopes whose `demands` and `concessions` are merged here by pure code.
 *
 *   proposal = empty PolicyArtifact
 *   for agent in signoffs_ordered:
 *     apply concessions where stance in (approve, conditional_approve)
 *     collect hard demands
 *   if any hard demand conflicts with org.policy_floor: REJECT
 *   if risk_tier == prohibited: REJECT
 *   if gates.betriebsvereinbarung_status == pending and entity == DE:
 *       add deny_overrides BETRIEBSVEREINBARUNG_PENDING
 *   emit proposal
 */
import type {
  AgentSignoff,
  BoardroomEnvelope,
  DenyReasonCode,
  OrgConfig,
  PolicyArtifact,
  RequestPacket,
  Stance,
} from '@trustflow/shared';

const APPROVING_STANCES: Stance[] = ['approve', 'conditional_approve'];

export interface MergeResult {
  /** The assembled (not-yet-floor-checked, not-yet-hashed) policy artifact. */
  draft: PolicyArtifact;
  /** Hard demands collected across all agents (field → value). */
  hardDemands: Map<string, unknown>;
  /** Per-agent sign-off derived from final stance. */
  signoffs: AgentSignoff[];
  /** Deny codes accumulated from gates (e.g. BETRIEBSVEREINBARUNG_PENDING). */
  denyOverrides: DenyReasonCode[];
  /** Veto codes raised by agents with veto power (decides DENIED vs PENDING). */
  vetoes: DenyReasonCode[];
}

/** Stance → sign-off status for provenance. */
function signoffStatus(stance: Stance): AgentSignoff['status'] {
  if (stance === 'approve') return 'approve';
  if (stance === 'reject' || stance === 'conditional_reject') return 'reject';
  return 'conditional';
}

/** Set a dotted field path on the draft artifact (deterministic, typed-ish). */
function applyField(draft: PolicyArtifact, field: string, value: unknown): void {
  const parts = field.split('.');
  if (parts[0] === 'pii_masking' && parts[1]) {
    draft.pii_masking[parts[1]] = value as PolicyArtifact['pii_masking'][string];
    return;
  }
  if (parts[0] === 'routing') {
    if (parts[1] === 'default') draft.routing.default = String(value);
    else if (parts[1] === 'sensitive') draft.routing.sensitive = String(value);
    return;
  }
  if (parts[0] === 'audit') {
    if (parts[1] === 'raw_prompt_logging') draft.audit.raw_prompt_logging = Boolean(value);
    else if (parts[1] === 'manager_dashboard_allowed')
      draft.audit.manager_dashboard_allowed = Boolean(value);
    else if (parts[1] === 'retention_class')
      draft.audit.retention_class = value as PolicyArtifact['audit']['retention_class'];
    return;
  }
  if (parts[0] === 'budget') {
    draft.budget ??= {};
    if (parts[1] === 'max_tokens_per_day') draft.budget.max_tokens_per_day = Number(value);
    else if (parts[1] === 'pool_id') draft.budget.pool_id = String(value);
    return;
  }
  if (parts[0] === 'gates') {
    // Gate STATUSES are ground truth from the request/org reality, NOT something
    // an optimistic agent can flip by asserting "DPA is signed". Agents narrate;
    // the compiler trusts the request packet. Only disclosure_required is
    // agent-settable. This is what keeps the procurement / works-council vetoes
    // honest (S02, S05).
    if (parts[1] === 'disclosure_required') draft.gates.disclosure_required = Boolean(value);
    return;
  }
  if (field === 'risk_tier') draft.risk_tier = value as PolicyArtifact['risk_tier'];
  else if (field === 'tool_id') draft.tool_id = String(value);
  else if (field === 'use_case_category') draft.use_case_category = String(value);
}

/** Build the empty seed artifact from the request + org config. */
function seedDraft(request: RequestPacket, org: OrgConfig): PolicyArtifact {
  const dept = org.departments.find((d) => d.id === request.department);
  return {
    policy_id: `pol_${request.tool_id}_${request.use_case_category}`,
    version: 1,
    compiled_at: '', // filled by compile.ts
    request_id: request.request_id,
    risk_tier: request.annex_iii_risk ? 'high_risk' : 'limited_risk',
    tool_id: request.tool_id,
    use_case_category: request.use_case_category,
    pii_masking: { iban: 'BLOCK', email: 'MASK', person_name: 'PSEUDONYMIZE' },
    routing: { default: 'CLOUD_QWEN_MAX' },
    budget: dept
      ? { pool_id: dept.budget_pool_id, max_tokens_per_day: dept.max_tokens_per_day }
      : undefined,
    audit: {
      retention_class: org.policy_floor.min_retention_class,
      required_fields: ['event_id', 'timestamp', 'model_id', 'input_fingerprint', 'outcome'],
      raw_prompt_logging: org.policy_floor.audit.raw_prompt_logging,
      manager_dashboard_allowed: org.policy_floor.audit.manager_dashboard_allowed,
    },
    gates: {
      betriebsvereinbarung_status:
        org.entity_country === 'DE'
          ? request.betriebsvereinbarung_status ?? org.betriebsvereinbarung_status
          : 'not_required',
      vendor_dpa_status: request.vendor_dpa_status ?? 'pending',
      disclosure_required: true,
    },
    deny_overrides: [],
  };
}

/**
 * Merge a full transcript of envelopes into a draft artifact, collecting hard
 * demands, sign-offs, veto codes, and gate-driven deny overrides.
 */
export function mergeTranscript(
  transcript: BoardroomEnvelope[],
  request: RequestPacket,
  org: OrgConfig,
): MergeResult {
  const draft = seedDraft(request, org);
  const hardDemands = new Map<string, unknown>();
  const denyOverrides: DenyReasonCode[] = [];
  const vetoes: DenyReasonCode[] = [];

  // Final stance per agent (last envelope wins).
  const finalStance = new Map<string, Stance>();

  for (const env of transcript) {
    finalStance.set(env.agent, env.stance);

    // 1. Apply concessions from approving agents.
    if (APPROVING_STANCES.includes(env.stance)) {
      for (const c of env.concessions ?? []) applyField(draft, c.field, c.value);
    }

    // 2. Collect + apply demands. Hard demands are tracked for floor conflict.
    for (const d of env.demands ?? []) {
      applyField(draft, d.field, d.value);
      if (d.hard) hardDemands.set(d.field, d.value);
    }
  }

  // 3. Veto matrix — decide which hard blocks are present (boardroom_protocol.md).
  const entityDe = (request.entity_country ?? org.entity_country) === 'DE';
  const brStatus = draft.gates.betriebsvereinbarung_status;
  const dpaStatus = draft.gates.vendor_dpa_status;

  // Procurement veto: DPA not signed.
  if (dpaStatus === 'pending') vetoes.push('VENDOR_DPA_PENDING');

  // Compliance veto: high-risk / Annex III without oversight, or prohibited.
  if (draft.risk_tier === 'high_risk') vetoes.push('HIGH_RISK_USE_DENIED');
  if (draft.risk_tier === 'prohibited') vetoes.push('PROHIBITED_PRACTICE');

  // Works council: DE + BR pending → external gate (not an outright denial).
  if (entityDe && brStatus === 'pending') {
    denyOverrides.push('BETRIEBSVEREINBARUNG_PENDING');
  }

  draft.deny_overrides = [...denyOverrides];

  const signoffs: AgentSignoff[] = [...finalStance.entries()].map(([agent, stance]) => ({
    agent,
    status: signoffStatus(stance),
  }));

  return { draft, hardDemands, signoffs, denyOverrides, vetoes };
}
