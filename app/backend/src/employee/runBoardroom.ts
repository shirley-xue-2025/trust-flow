/**
 * Runs boardroom negotiation for an employee request and updates the record.
 */
import type { BoardroomEnvelope, EmployeeRequestRecord, OrgConfig, ToolRegistry } from '@trustflow/shared';
import { createSession, getSession, runSession } from '../boardroom/session.js';
import { spawnHumanReviews } from '../store/humanReviews.js';
import { boardroomCompletePatch, syncRecord } from './requestState.js';
import {
  getEmployeeRequest,
  nextStepsForRecord,
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

  updateEmployeeRequest(requestId, { negotiation_phase: 'negotiating', status: 'negotiating' });

  const session = createSession(record.packet);
  (session as { replay?: string }).replay = opts.replayScenarioId;

  await runSession(session, org, {
    replayScenarioId: opts.replayScenarioId,
    requestId,
    onTurn: () => {
      opts.onTurn?.();
      updateEmployeeRequest(requestId, {
        session_id: session.session_id,
        transcript_length: session.transcript.length,
      });
    },
  });

  const outcome = session.outcome ?? 'DENIED';
  const transcript = session.transcript;
  const patch = boardroomCompletePatch(
    record,
    outcome,
    org,
    {
      session_id: session.session_id,
      deny_code: session.deny_code,
      routing_decision: session.routing_decision,
      policy_id: session.policy?.policy_id,
      policy_version_hash: session.policy_version_hash,
      transcript_length: transcript.length,
    },
    transcript,
  );

  const updated = updateEmployeeRequest(requestId, {
    ...patch,
    transcript_snapshot: transcript,
  });
  if (!updated) return;

  if ((outcome === 'APPROVED' && patch.human_decision === 'pending') || outcome === 'PENDING_HUMAN') {
    spawnHumanReviews(requestId, updated.packet, transcript);
  }

  updateEmployeeRequest(requestId, {
    next_steps: nextStepsForRecord(syncRecord({ ...updated, ...patch }), registry),
  });
}

export function finalizeRequestFromSession(
  record: EmployeeRequestRecord,
  sessionId: string,
  org: OrgConfig,
  registry: ToolRegistry,
  transcript: BoardroomEnvelope[],
  outcome: NonNullable<ReturnType<typeof getSession>>['outcome'],
  sessionFields: {
    deny_code?: string;
    routing_decision?: string;
    policy_id?: string;
    policy_version_hash?: string;
  },
): ReturnType<typeof updateEmployeeRequest> {
  const resolvedOutcome = outcome ?? 'DENIED';
  const patch = boardroomCompletePatch(
    record,
    resolvedOutcome,
    org,
    {
      session_id: sessionId,
      ...sessionFields,
      transcript_length: transcript.length,
    },
    transcript,
  );
  const updated = updateEmployeeRequest(record.request_id, {
    ...patch,
    transcript_snapshot: transcript,
  });
  if (updated && resolvedOutcome === 'APPROVED' && patch.human_decision === 'pending') {
    spawnHumanReviews(record.request_id, updated.packet, transcript);
  }
  if (updated) {
    updateEmployeeRequest(record.request_id, {
      next_steps: nextStepsForRecord(syncRecord({ ...updated, ...patch }), registry),
    });
  }
  return updated;
}
