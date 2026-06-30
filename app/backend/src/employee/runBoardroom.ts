/**
 * Runs boardroom negotiation for an employee request and updates the record.
 */
import type { OrgConfig, ToolRegistry } from '@trustflow/shared';
import { createSession, runSession } from '../boardroom/session.js';
import {
  getEmployeeRequest,
  nextStepsForRecord,
  statusFromOutcome,
  updateEmployeeRequest,
} from './requests.js';

export async function runEmployeeBoardroom(
  requestId: string,
  org: OrgConfig,
  registry: ToolRegistry,
  opts: { replayScenarioId?: string; onTurn?: () => void } = {},
): Promise<void> {
  const record = getEmployeeRequest(requestId);
  if (!record) throw new Error('request not found');

  updateEmployeeRequest(requestId, { status: 'negotiating' });

  const session = createSession(record.packet);
  (session as { replay?: string }).replay = opts.replayScenarioId;

  await runSession(session, org, {
    replayScenarioId: opts.replayScenarioId,
    onTurn: () => {
      opts.onTurn?.();
      updateEmployeeRequest(requestId, { session_id: session.session_id, transcript_length: session.transcript.length });
    },
  });

  const outcome = session.outcome ?? 'DENIED';
  const status = statusFromOutcome(outcome);
  const updated = updateEmployeeRequest(requestId, {
    session_id: session.session_id,
    status,
    outcome,
    deny_code: session.deny_code,
    routing_decision: session.routing_decision,
    policy_id: session.policy?.policy_id,
    policy_version_hash: session.policy_version_hash,
    transcript_length: session.transcript.length,
  });

  if (updated) {
    updateEmployeeRequest(requestId, {
      next_steps: nextStepsForRecord(updated, registry),
    });
  }
}
