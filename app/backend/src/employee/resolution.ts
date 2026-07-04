/**
 * Employee resolution paths — accept deny, appeal, propose alternative (Epic D).
 */
import { randomUUID } from 'node:crypto';
import type { AppealType, OrgConfig, ToolRegistry } from '@trustflow/shared';
import { buildAdvocateExplanation, advocateChatReply } from './advocate.js';
import {
  createEmployeeRequest,
  getEmployeeRequest,
  serializeEmployeeRequest,
  toolDisplayName,
  updateEmployeeRequest,
} from './requests.js';
import { createAppeal } from '../store/appeals.js';
import { runEmployeeBoardroom } from './runBoardroom.js';

export function acceptDeny(requestId: string): ReturnType<typeof serializeEmployeeRequest> | null {
  const record = getEmployeeRequest(requestId);
  if (!record) return null;
  const updated = updateEmployeeRequest(requestId, {
    employee_resolution: 'accepted',
    human_decision: 'not_required',
  });
  return updated ? serializeEmployeeRequest(updated) : null;
}

export function submitAppeal(
  requestId: string,
  actorId: string,
  appealType: AppealType,
  statement: string,
): { record: ReturnType<typeof serializeEmployeeRequest>; appeal_id: string } | { error: string; code: number } {
  if (statement.trim().length < 20) {
    return { error: 'appeal statement must be at least 20 characters', code: 400 };
  }
  if (appealType === 'wrong_tool') {
    return {
      error: 'Use “Propose alternative” to link a new request for a different tool',
      code: 400,
    };
  }

  const record = getEmployeeRequest(requestId);
  if (!record) return { error: 'request not found', code: 404 };
  if (record.employee_resolution !== 'pending' && record.employee_resolution !== 'appealed') {
    return { error: 'request is not in a deniable employee state', code: 409 };
  }

  const appeal = createAppeal({
    request_id: requestId,
    actor_id: actorId,
    appeal_type: appealType,
    statement: statement.trim(),
  });

  const updated = updateEmployeeRequest(requestId, {
    employee_resolution: 'appealed',
    human_decision: 'pending',
  });

  return {
    record: serializeEmployeeRequest(updated!),
    appeal_id: appeal.appeal_id,
  };
}

export async function proposeAlternative(
  parentRequestId: string,
  actorId: string,
  org: OrgConfig,
  registry: ToolRegistry,
  body: {
    tool_id: string;
    use_case_category: string;
    business_justification?: string;
    data_classes?: string[];
    replay?: string;
  },
): Promise<{ parent: ReturnType<typeof serializeEmployeeRequest>; child: ReturnType<typeof serializeEmployeeRequest> } | { error: string; code: number }> {
  const parent = getEmployeeRequest(parentRequestId);
  if (!parent) return { error: 'parent request not found', code: 404 };
  if (parent.actor_id !== actorId) return { error: 'forbidden', code: 403 };

  const child = createEmployeeRequest({
    actor_id: parent.actor_id,
    actor_name: parent.actor_name,
    department: parent.department,
    role: parent.role,
    tool_id: body.tool_id,
    tool_display_name: toolDisplayName(registry, body.tool_id),
    use_case_category: body.use_case_category,
    business_justification:
      body.business_justification ??
      `Alternative to denied request ${parentRequestId}: ${parent.tool_display_name}`,
    parent_request_id: parentRequestId,
    packet: {
      request_id: randomUUID(),
      tool_id: body.tool_id,
      use_case_category: body.use_case_category,
      department: parent.department,
      data_classes: body.data_classes ?? parent.packet.data_classes ?? [],
      entity_country: org.entity_country,
      betriebsvereinbarung_status: parent.packet.betriebsvereinbarung_status,
      vendor_dpa_status:
        registry.tools.find((t) => t.tool_id === body.tool_id)?.vendor_dpa_status ?? 'pending',
    },
  });

  updateEmployeeRequest(parentRequestId, { employee_resolution: 'alternative_submitted' });

  await runEmployeeBoardroom(child.request_id, org, registry, { replayScenarioId: body.replay });

  return {
    parent: serializeEmployeeRequest(getEmployeeRequest(parentRequestId)!),
    child: serializeEmployeeRequest(getEmployeeRequest(child.request_id)!),
  };
}

export function getAdvocatePayload(
  requestId: string,
  registry: ToolRegistry,
  message?: string,
) {
  const record = getEmployeeRequest(requestId);
  if (!record) return null;
  const explanation = buildAdvocateExplanation(record, registry);
  return {
    explanation,
    reply: message ? advocateChatReply(record, message, explanation) : undefined,
  };
}