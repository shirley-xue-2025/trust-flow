/**
 * TypeScript types mirrored from the two frozen JSON schemas:
 *   - docs/schemas/policy-artifact.schema.json
 *   - docs/schemas/gateway-audit-event.schema.json
 *
 * These are the canonical shapes shared by the gateway, the compiler, and the UI,
 * so the policy artifact can never drift between "what the agents produced",
 * "what the gateway enforces", and "what the UI shows".
 */

// ---------------------------------------------------------------------------
// Enums shared across schemas
// ---------------------------------------------------------------------------

export type RiskTier = 'prohibited' | 'high_risk' | 'limited_risk' | 'minimal';

export type PiiAction = 'BLOCK' | 'MASK' | 'PSEUDONYMIZE' | 'ALLOW';

export type RetentionClass = 'standard_6mo' | 'financial_sector' | 'high_risk_extended';

export type BetriebsvereinbarungStatus = 'not_required' | 'pending' | 'signed';

export type VendorDpaStatus = 'pending' | 'signed' | 'not_applicable';

export type RoutingDecision = 'CLOUD_QWEN_MAX' | 'LOCAL_QWEN_72B' | 'BLOCKED';

/** Canonical deny reason codes (ARCHITECTURE §3.3). */
export type DenyReasonCode =
  | 'TOOL_NOT_APPROVED'
  | 'BETRIEBSVEREINBARUNG_PENDING'
  | 'VENDOR_DPA_PENDING'
  | 'PII_BLOCK'
  | 'BUDGET_EXCEEDED'
  | 'HIGH_RISK_USE_DENIED'
  | 'PROHIBITED_PRACTICE'
  | 'POLICY_NOT_ACTIVATED';

// ---------------------------------------------------------------------------
// Policy artifact (policy-artifact.schema.json)
// ---------------------------------------------------------------------------

export interface AgentSignoff {
  agent: string;
  status: 'approve' | 'conditional' | 'reject';
  note?: string;
}

export interface PolicyProvenance {
  boardroom_session_id?: string;
  agent_signoffs?: AgentSignoff[];
}

export interface PolicyRouting {
  default: string;
  sensitive?: string;
  rules?: { if: string; route: string }[];
}

export interface PolicyBudget {
  pool_id?: string;
  max_tokens_per_day?: number;
  max_cost_eur_per_month?: number;
}

export interface PolicyAudit {
  retention_class: RetentionClass;
  required_fields: string[];
  raw_prompt_logging?: boolean;
  manager_dashboard_allowed?: boolean;
}

export interface PolicyGates {
  betriebsvereinbarung_status?: BetriebsvereinbarungStatus;
  vendor_dpa_status?: VendorDpaStatus;
  disclosure_required?: boolean;
}

export interface PolicyArtifact {
  policy_id: string;
  version: number;
  compiled_at: string;
  request_id?: string;
  provenance?: PolicyProvenance;
  risk_tier: RiskTier;
  tool_id: string;
  use_case_category?: string;
  pii_masking: Record<string, PiiAction>;
  routing: PolicyRouting;
  budget?: PolicyBudget;
  audit: PolicyAudit;
  gates: PolicyGates;
  deny_overrides?: string[];
}

// ---------------------------------------------------------------------------
// Gateway audit event (gateway-audit-event.schema.json)
// ---------------------------------------------------------------------------

export type AuditEventType =
  | 'inference_request'
  | 'inference_response'
  | 'policy_applied'
  | 'pii_redaction'
  | 'request_denied'
  | 'budget_cap_hit'
  | 'human_override'
  | 'policy_compiled'
  | 'human_sign_off'
  | 'appeal_decision'
  | 'policy_activated';

export type AuditOutcome = 'allowed' | 'denied' | 'redirected' | 'error';

export interface PiiActionRecord {
  entity_type: string;
  action: 'blocked' | 'masked' | 'pseudonymized' | 'allowed';
  count?: number;
}

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  estimated_cost_eur?: number;
}

export interface GatewayAuditEvent {
  event_id: string;
  parent_event_id?: string;
  timestamp: string;
  event_type: AuditEventType;
  system_id: string;
  policy_id: string;
  policy_version_hash: string;
  actor_id: string;
  department_id?: string;
  tool_id: string;
  risk_tier?: RiskTier;
  model_provider: string;
  model_id: string;
  prompt_template_id?: string;
  input_fingerprint?: string;
  output_fingerprint?: string;
  pii_actions?: PiiActionRecord[];
  routing_decision: string;
  token_usage?: TokenUsage;
  budget_pool_id?: string;
  outcome: AuditOutcome;
  deny_reason_code?: string;
  human_reviewer_id?: string;
  human_override?: {
    reviewer_id?: string;
    timestamp?: string;
    action?: 'approved' | 'rejected' | 'modified';
  };
  disclosure_shown?: boolean;
  retention_class?: RetentionClass;
  legal_basis?: string;
}

// ---------------------------------------------------------------------------
// Boardroom message envelope (boardroom_protocol.md)
// ---------------------------------------------------------------------------

export type AgentId =
  | 'workflow_runner'
  | 'corporate_compliance'
  | 'it_infra'
  | 'procurement'
  | 'works_council';

export type Stance =
  | 'approve'
  | 'conditional_approve'
  | 'conditional_reject'
  | 'reject'
  | 'pass';

export interface AgentClaim {
  type: string;
  ref?: string;
  text: string;
}

export interface AgentDemand {
  field: string;
  value: unknown;
  hard?: boolean;
}

export interface AgentConcession {
  field: string;
  value: unknown;
}

export interface BoardroomEnvelope {
  session_id: string;
  round: number;
  agent: AgentId;
  stance: Stance;
  claims?: AgentClaim[];
  demands?: AgentDemand[];
  concessions?: AgentConcession[];
  evidence_ids?: string[];
  natural_language: string;
}

// ---------------------------------------------------------------------------
// Request packet & org config (input shapes — not schema-frozen)
// ---------------------------------------------------------------------------

export interface RequestPacket {
  request_id?: string;
  tool_id: string;
  use_case_category: string;
  department?: string;
  data_classes?: string[];
  annex_iii_risk?: boolean;
  entity_country?: string;
  betriebsvereinbarung_status?: BetriebsvereinbarungStatus;
  vendor_dpa_status?: VendorDpaStatus;
}

export interface OrgDepartment {
  id: string;
  budget_pool_id: string;
  max_tokens_per_day: number;
}

export interface OrgConfig {
  org_id: string;
  display_name: string;
  entity_country: string;
  has_works_council: boolean;
  betriebsvereinbarung_status: BetriebsvereinbarungStatus;
  policy_floor: {
    audit: {
      raw_prompt_logging: boolean;
      manager_dashboard_allowed: boolean;
    };
    deny_prohibited_practices: boolean;
    min_retention_class: RetentionClass;
  };
  departments: OrgDepartment[];
  routing_targets: Record<string, string>;
}

export interface ToolRecord {
  tool_id: string;
  display_name: string;
  vendor: string;
  data_residency_options: string[];
  audit_log_capability: boolean;
  default_endpoints: string[];
  vendor_dpa_status: VendorDpaStatus;
  notes?: string;
}

export interface ToolRegistry {
  tools: ToolRecord[];
}

export interface EvalScenario {
  scenario_id: string;
  name: string;
  request: RequestPacket;
  expected_session_outcome: SessionOutcome;
  expected_gateway_outcome?: AuditOutcome;
  expected_deny_code?: DenyReasonCode;
  expected_routing?: RoutingDecision;
}

// ---------------------------------------------------------------------------
// Session state machine (boardroom_protocol.md)
// ---------------------------------------------------------------------------

export type SessionState =
  | 'OPEN'
  | 'NEGOTIATING'
  | 'APPROVED'
  | 'DENIED'
  | 'PENDING_HUMAN'
  | 'PENDING_EXTERNAL'
  | 'COMPILED';

export type SessionOutcome = 'APPROVED' | 'DENIED' | 'PENDING_HUMAN' | 'PENDING_EXTERNAL';

// ---------------------------------------------------------------------------
// Employee portal (human requester — not boardroom agents)
// ---------------------------------------------------------------------------

export interface EmployeeProfile {
  user_id: string;
  display_name: string;
  email: string;
  department: string;
  role: string;
}

export type EmployeeRequestStatus =
  | 'submitted'
  | 'negotiating'
  | 'agent_recommended_approve'
  | 'pending_signoff'
  | 'approved'
  | 'agent_recommended_deny'
  | 'denied_pending_employee'
  | 'appeal_pending'
  | 'denied_closed'
  | 'pending_external'
  | 'pending_human'
  /** @deprecated migrated to denied_closed or denied_pending_employee */
  | 'denied';

export type NegotiationPhase = 'submitted' | 'negotiating' | 'complete';

export type HumanDecisionPhase =
  | 'not_required'
  | 'pending'
  | 'complete'
  | 'rejected';

export type EmployeeResolution =
  | 'not_applicable'
  | 'pending'
  | 'accepted'
  | 'appealed'
  | 'alternative_submitted';

export type PolicyActivationPhase = 'none' | 'draft' | 'active';

export type ReviewerRole = 'dpo' | 'procurement' | 'it';

export type HumanReviewStatus = 'pending' | 'approved' | 'rejected';

export interface HumanReviewRecord {
  review_id: string;
  request_id: string;
  reviewer_role: ReviewerRole;
  reviewer_id: string;
  reviewer_display_name: string;
  status: HumanReviewStatus;
  rationale?: string;
  rationale_hash?: string;
  created_at: string;
  decided_at?: string;
  required: boolean;
}

export type AppealType = 'procedural' | 'factual' | 'alternative_scope' | 'wrong_tool';

export type AppealStatus = 'pending' | 'granted' | 'denied';

export interface AppealRecord {
  appeal_id: string;
  request_id: string;
  actor_id: string;
  appeal_type: AppealType;
  statement: string;
  status: AppealStatus;
  chair_reviewer_id?: string;
  decision_rationale?: string;
  submitted_at: string;
  decided_at?: string;
  grant_routing?: 'human_reviews' | 'reopen_boardroom';
}

export type PolicyActivationStatus = 'draft' | 'active' | 'revoked';

export interface EmployeeRequestRecord {
  request_id: string;
  actor_id: string;
  actor_name: string;
  department: string;
  role: string;
  tool_id: string;
  tool_display_name: string;
  use_case_category: string;
  business_justification?: string;
  packet: RequestPacket;
  session_id?: string;
  /** Synced from derived display status for API compat */
  status: EmployeeRequestStatus;
  /** Computed server-side on read */
  display_status?: EmployeeRequestStatus;
  negotiation_phase: NegotiationPhase;
  agent_outcome?: SessionOutcome;
  human_decision: HumanDecisionPhase;
  employee_resolution: EmployeeResolution;
  policy_activation: PolicyActivationPhase;
  parent_request_id?: string;
  child_request_ids?: string[];
  outcome?: SessionOutcome;
  deny_code?: string;
  routing_decision?: string;
  policy_id?: string;
  policy_version_hash?: string;
  transcript_length?: number;
  advocate_thread_id?: string;
  /** Persisted boardroom transcript for demo reliability across server restarts */
  transcript_snapshot?: BoardroomEnvelope[];
  submitted_at: string;
  updated_at: string;
  next_steps?: string[];
}
