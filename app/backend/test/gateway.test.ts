/**
 * Gateway tests (DoD #4): schema-valid audit events for
 *   - a clean prompt → allowed
 *   - an IBAN prompt → PII_BLOCK
 *   - S04 → routed LOCAL_QWEN_72B
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

  it('S04 payment-schema request → routed LOCAL_QWEN_72B + valid audit', () => {
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
    expect(r.routing_decision).toBe('LOCAL_QWEN_72B');
    expect(r.outcome).toBe('redirected');
    expect(r.response_body).toContain('LOCAL_QWEN_72B mock');
    expect(validateAuditEvent(r.audit_event)).toEqual([]);
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
    expect(r.audit_event.pii_actions?.some((p) => p.entity_type === 'email' && p.action === 'masked')).toBe(
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
