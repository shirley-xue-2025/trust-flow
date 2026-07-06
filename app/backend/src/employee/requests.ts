/**
 * Employee request store — persists human-submitted tool access requests and
 * links them to boardroom sessions. JSON file under TRUSTFLOW_DATA_DIR.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type {
  EmployeeRequestRecord,
  RequestPacket,
  SessionOutcome,
  ToolRegistry,
} from '@trustflow/shared';
import { dataDir } from '../store/index.js';
import {
  defaultHitlFields,
  deriveDisplayStatus,
  migrateLegacyRecord,
  syncRecord,
} from './requestState.js';

const STORE_FILE = () => join(dataDir(), 'employee_requests.json');

function ensureStore(): EmployeeRequestRecord[] {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = STORE_FILE();
  if (!existsSync(path)) {
    writeFileSync(path, '[]');
    return [];
  }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as EmployeeRequestRecord[];
  return raw.map(migrateLegacyRecord);
}

function saveAll(records: EmployeeRequestRecord[]): void {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const synced = records.map(syncRecord);
  writeFileSync(STORE_FILE(), JSON.stringify(synced, null, 2));
}

export function serializeEmployeeRequest(record: EmployeeRequestRecord): EmployeeRequestRecord {
  return syncRecord(record);
}

export function listEmployeeRequests(actorId?: string): EmployeeRequestRecord[] {
  const all = ensureStore();
  const filtered = actorId ? all.filter((r) => r.actor_id === actorId) : all;
  return filtered.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).map(syncRecord);
}

export function getEmployeeRequest(id: string): EmployeeRequestRecord | null {
  const record = ensureStore().find((r) => r.request_id === id);
  return record ? syncRecord(record) : null;
}

export function createEmployeeRequest(input: {
  actor_id: string;
  actor_name: string;
  department: string;
  role: string;
  tool_id: string;
  tool_display_name: string;
  use_case_category: string;
  business_justification?: string;
  packet: RequestPacket;
  parent_request_id?: string;
}): EmployeeRequestRecord {
  const now = new Date().toISOString();
  const record: EmployeeRequestRecord = {
    request_id: input.packet.request_id ?? randomUUID(),
    actor_id: input.actor_id,
    actor_name: input.actor_name,
    department: input.department,
    role: input.role,
    tool_id: input.tool_id,
    tool_display_name: input.tool_display_name,
    use_case_category: input.use_case_category,
    business_justification: input.business_justification,
    packet: { ...input.packet, request_id: input.packet.request_id },
    status: 'submitted',
    ...defaultHitlFields(),
    parent_request_id: input.parent_request_id,
    submitted_at: now,
    updated_at: now,
  };
  record.packet.request_id = record.request_id;

  const all = ensureStore();
  all.push(syncRecord(record));
  if (input.parent_request_id) {
    const parentIdx = all.findIndex((r) => r.request_id === input.parent_request_id);
    if (parentIdx >= 0) {
      const children = new Set(all[parentIdx].child_request_ids ?? []);
      children.add(record.request_id);
      all[parentIdx] = syncRecord({
        ...all[parentIdx],
        child_request_ids: [...children],
      });
    }
  }
  saveAll(all);
  return syncRecord(record);
}

export function updateEmployeeRequest(
  id: string,
  patch: Partial<EmployeeRequestRecord>,
): EmployeeRequestRecord | null {
  const all = ensureStore();
  const idx = all.findIndex((r) => r.request_id === id);
  if (idx < 0) return null;
  all[idx] = syncRecord({ ...all[idx], ...patch, updated_at: new Date().toISOString() });
  saveAll(all);
  return all[idx];
}

/** @deprecated use boardroomCompletePatch + syncRecord */
export function statusFromOutcome(outcome: SessionOutcome): EmployeeRequestRecord['status'] {
  switch (outcome) {
    case 'APPROVED':
      return 'pending_signoff';
    case 'DENIED':
      return 'denied_pending_employee';
    case 'PENDING_EXTERNAL':
      return 'pending_external';
    case 'PENDING_HUMAN':
      return 'pending_human';
    default:
      return 'negotiating';
  }
}

export function isApprovedForGateway(record: EmployeeRequestRecord): boolean {
  return deriveDisplayStatus(record) === 'approved' && record.policy_activation === 'active';
}

export function nextStepsForRecord(
  record: EmployeeRequestRecord,
  registry: ToolRegistry,
): string[] {
  const status = deriveDisplayStatus(record);
  const steps: string[] = [];

  if (status === 'submitted' || status === 'negotiating') {
    steps.push('Stakeholder review is in progress.');
    steps.push('Legal, IT, Procurement, and Works Council agents negotiate policy.');
  }
  if (status === 'pending_signoff' || status === 'agent_recommended_approve') {
    steps.push('Stakeholders reached a recommendation. Waiting for human sign-off before you can use this tool.');
  }
  if (status === 'pending_external') {
    if (record.deny_code === 'BETRIEBSVEREINBARUNG_PENDING') {
      steps.push('Betriebsvereinbarung annex must be signed by the works council.');
    }
    if (record.deny_code === 'VENDOR_DPA_PENDING') {
      steps.push('Procurement must execute the vendor DPA before rollout.');
    }
    steps.push('You will be notified when external gates clear.');
  }
  if (status === 'pending_human' || status === 'appeal_pending') {
    steps.push('DPO or IT must resolve a negotiation deadlock or appeal.');
  }
  if (status === 'denied_pending_employee' || status === 'agent_recommended_deny') {
    steps.push('This use case was not approved. Review the explanation and choose your next step.');
    if (record.deny_code === 'HIGH_RISK_USE_DENIED') {
      steps.push('Annex III high-risk use requires human oversight workflow.');
    }
    const alt = registry.tools.find((t) => t.vendor_dpa_status === 'signed');
    if (alt) steps.push(`Consider an approved alternative: ${alt.display_name}.`);
  }
  if (status === 'denied_closed' || status === 'denied') {
    steps.push('This case is closed.');
  }
  if (status === 'approved') {
    steps.push('Approved — use the tool in your IDE; gateway activity is recorded on this request.');
    if (record.local_redaction) {
      steps.push('Sensitive prompts are redacted on the EU-local safety gateway before completing on the cloud model.');
    }
    steps.push('Open the Gateway activity tab to review PII actions and routing decisions.');
  }
  return steps;
}

export function toolDisplayName(registry: ToolRegistry, toolId: string): string {
  return registry.tools.find((t) => t.tool_id === toolId)?.display_name ?? toolId;
}
