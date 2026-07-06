/**
 * Gateway tests (DoD #4): schema-valid audit events for
 *   - a clean prompt → allowed
 *   - an IBAN prompt → PII_BLOCK
 *   - S04 → redacted on the local safety gateway, completed on CLOUD_QWEN_MAX
 */
import { describe, expect, it } from 'vitest';
import { ORG, REGISTRY, getScenario } from '../src/fixtures/index.js';
import { loadGolden } from '../src/boardroom/golden.js';
import { compile } from '../src/compiler/compile.js';
import { runInference } from '../src/gateway/enforce.js';
import { validateAuditEvent } from '../src/gateway/audit.js';
import type { RequestPacket } from '@trustflow/shared';

function compileScenario(id: string) {
  const s = getScenario(id)!;
  const result = compile(loadGolden(id), s.request, ORG, { session_id: id });
  return { result, request: s.request };
}

describe('gateway audit events', () => {
  it('clean prompt on S01 policy → allowed + valid audit', () => {
    const { result, request } = compileScenario('S01');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request,
        prompt: 'Summarize this support thread about a delayed refund.',
      },
      { org: ORG, registry: REGISTRY },
    );
    expect(r.outcome).toBe('allowed');
    expect(validateAuditEvent(r.audit_event)).toEqual([]);
  });

  it('IBAN prompt → PII_BLOCK + valid audit', () => {
    const { result, request } = compileScenario('S01');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request,
        prompt: 'Refund to IBAN DE89370400440532013000 please.',
      },
      { org: ORG, registry: REGISTRY },
    );
    expect(r.outcome).toBe('denied');
    expect(r.deny_reason_code).toBe('PII_BLOCK');
    expect(validateAuditEvent(r.audit_event)).toEqual([]);
  });

  it('S04 payment-schema request → redacted locally, completed on CLOUD_QWEN_MAX + valid audit', () => {
    const { result, request } = compileScenario('S04');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request: request as RequestPacket,
        prompt: 'Generate a TypeScript type for this payment API schema.',
      },
      { org: ORG, registry: REGISTRY },
    );
    expect(r.local_redaction).toBe(true);
    expect(r.routing_decision).toBe('CLOUD_QWEN_MAX');
    expect(r.outcome).toBe('allowed');
    expect(r.response_body).toContain('CLOUD_QWEN_MAX response');
    expect(r.redaction_audit_event?.routing_decision).toBe('LOCAL_QWEN_72B');
    expect(r.redaction_audit_event?.outcome).toBe('redirected');
    expect(r.audit_event.parent_event_id).toBe(r.redaction_audit_event?.event_id);
    expect(validateAuditEvent(r.audit_event)).toEqual([]);
    expect(validateAuditEvent(r.redaction_audit_event!)).toEqual([]);
  });

  it('S04 email prompt → masked + allowed (not PII_BLOCK)', () => {
    const { result, request } = compileScenario('S04');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request: request as RequestPacket,
        prompt: 'Email the receipt to katrin.brenner@nordpay.example.',
      },
      { org: ORG, registry: REGISTRY },
      { activation_status: 'active' },
    );
    expect(r.outcome).not.toBe('denied');
    expect(r.deny_reason_code).not.toBe('PII_BLOCK');
    expect(r.redacted_prompt).toContain('EMAIL_MASKED');
    // Sensitive/payment traffic redacts on the local hop; pii_actions live there,
    // not on the cloud completion event (see enforce.ts dedup).
    const piiEvent = r.local_redaction ? r.redaction_audit_event : r.audit_event;
    expect(piiEvent?.pii_actions?.some((p) => p.entity_type === 'email' && p.action === 'masked')).toBe(
      true,
    );
  });

  it('draft policy activation_status → POLICY_NOT_ACTIVATED', () => {
    const { result, request } = compileScenario('S01');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request,
        prompt: 'Summarize this support thread.',
      },
      { org: ORG, registry: REGISTRY },
      { activation_status: 'draft' },
    );
    expect(r.outcome).toBe('denied');
    expect(r.deny_reason_code).toBe('POLICY_NOT_ACTIVATED');
  });

  it('S02 policy still blocks inference with BETRIEBSVEREINBARUNG_PENDING', () => {
    const { result, request } = compileScenario('S02');
    const r = runInference(
      {
        policy: result.policy,
        policy_version_hash: result.policy_version_hash,
        request,
        prompt: 'Refactor this helper function.',
      },
      { org: ORG, registry: REGISTRY },
    );
    expect(r.outcome).toBe('denied');
    expect(r.deny_reason_code).toBe('BETRIEBSVEREINBARUNG_PENDING');
    expect(validateAuditEvent(r.audit_event)).toEqual([]);
  });
});
