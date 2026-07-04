/**
 * Unit tests for HITL request state derivation and boardroom completion patches.
 */
import { describe, expect, it } from 'vitest';
import type { EmployeeRequestRecord } from '@trustflow/shared';
import { ORG } from '../src/fixtures/index.js';
import {
  boardroomCompletePatch,
  defaultHitlFields,
  deriveDisplayStatus,
  migrateLegacyRecord,
} from '../src/employee/requestState.js';

function baseRecord(overrides: Partial<EmployeeRequestRecord> = {}): EmployeeRequestRecord {
  return {
    request_id: 'req-1',
    actor_id: 'emp-1',
    actor_name: 'Alex',
    department: 'payments',
    role: 'dev',
    tool_id: 'claude-code',
    tool_display_name: 'Claude Code',
    use_case_category: 'code_completion',
    packet: {
      request_id: 'req-1',
      tool_id: 'claude-code',
      use_case_category: 'code_completion',
      betriebsvereinbarung_status: 'signed',
      vendor_dpa_status: 'signed',
    },
    status: 'submitted',
    submitted_at: '2026-07-04T00:00:00Z',
    updated_at: '2026-07-04T00:00:00Z',
    ...defaultHitlFields(),
    ...overrides,
  };
}

describe('deriveDisplayStatus', () => {
  it('maps negotiating phase', () => {
    expect(deriveDisplayStatus(baseRecord({ negotiation_phase: 'negotiating' }))).toBe('negotiating');
  });

  it('maps APPROVED with draft policy to pending_signoff', () => {
    const r = baseRecord({
      negotiation_phase: 'complete',
      agent_outcome: 'APPROVED',
      human_decision: 'pending',
      policy_activation: 'draft',
      policy_id: 'pol-1',
    });
    expect(deriveDisplayStatus(r)).toBe('pending_signoff');
  });

  it('maps fully activated approve path to approved', () => {
    const r = baseRecord({
      negotiation_phase: 'complete',
      agent_outcome: 'APPROVED',
      human_decision: 'complete',
      policy_activation: 'active',
      policy_id: 'pol-1',
    });
    expect(deriveDisplayStatus(r)).toBe('approved');
  });

  it('maps DENIED with pending employee resolution', () => {
    const r = baseRecord({
      negotiation_phase: 'complete',
      agent_outcome: 'DENIED',
      employee_resolution: 'pending',
    });
    expect(deriveDisplayStatus(r)).toBe('denied_pending_employee');
  });
});

describe('boardroomCompletePatch', () => {
  it('does not set approved on APPROVED outcome', () => {
    const patch = boardroomCompletePatch(
      baseRecord(),
      'APPROVED',
      ORG,
      { session_id: 's1', policy_id: 'pol-1', policy_version_hash: 'abc' },
      [],
    );
    expect(patch.policy_activation).toBe('draft');
    expect(patch.human_decision).toBe('pending');
    expect(patch.employee_resolution).toBe('not_applicable');
  });

  it('sets employee_resolution pending on DENIED', () => {
    const patch = boardroomCompletePatch(
      baseRecord(),
      'DENIED',
      ORG,
      { session_id: 's1' },
      [],
    );
    expect(patch.employee_resolution).toBe('pending');
    expect(patch.policy_activation).toBe('none');
  });
});

describe('migrateLegacyRecord', () => {
  it('migrates legacy approved to active human-complete state', () => {
    const legacy = {
      ...baseRecord(),
      negotiation_phase: undefined as unknown as EmployeeRequestRecord['negotiation_phase'],
      status: 'approved' as const,
      policy_id: 'pol-1',
      outcome: 'APPROVED' as const,
    };
    const migrated = migrateLegacyRecord(legacy);
    expect(migrated.human_decision).toBe('complete');
    expect(migrated.policy_activation).toBe('active');
    expect(deriveDisplayStatus(migrated)).toBe('approved');
  });
});
