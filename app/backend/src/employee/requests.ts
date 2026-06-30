/**
 * Employee request store — persists human-submitted tool access requests and
 * links them to boardroom sessions. JSON file under TRUSTFLOW_DATA_DIR.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type {
  EmployeeRequestRecord,
  EmployeeRequestStatus,
  RequestPacket,
  SessionOutcome,
  ToolRegistry,
} from '@trustflow/shared';
import { dataDir } from '../store/index.js';

const STORE_FILE = () => join(dataDir(), 'employee_requests.json');

function ensureStore(): EmployeeRequestRecord[] {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = STORE_FILE();
  if (!existsSync(path)) {
    writeFileSync(path, '[]');
    return [];
  }
  return JSON.parse(readFileSync(path, 'utf8')) as EmployeeRequestRecord[];
}

function saveAll(records: EmployeeRequestRecord[]): void {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_FILE(), JSON.stringify(records, null, 2));
}

export function listEmployeeRequests(actorId?: string): EmployeeRequestRecord[] {
  const all = ensureStore();
  const filtered = actorId ? all.filter((r) => r.actor_id === actorId) : all;
  return filtered.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export function getEmployeeRequest(id: string): EmployeeRequestRecord | null {
  return ensureStore().find((r) => r.request_id === id) ?? null;
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
    submitted_at: now,
    updated_at: now,
  };
  record.packet.request_id = record.request_id;

  const all = ensureStore();
  all.push(record);
  saveAll(all);
  return record;
}

export function updateEmployeeRequest(
  id: string,
  patch: Partial<EmployeeRequestRecord>,
): EmployeeRequestRecord | null {
  const all = ensureStore();
  const idx = all.findIndex((r) => r.request_id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updated_at: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

export function statusFromOutcome(outcome: SessionOutcome): EmployeeRequestStatus {
  switch (outcome) {
    case 'APPROVED':
      return 'approved';
    case 'DENIED':
      return 'denied';
    case 'PENDING_EXTERNAL':
      return 'pending_external';
    case 'PENDING_HUMAN':
      return 'pending_human';
    default:
      return 'negotiating';
  }
}

export function nextStepsForRecord(
  record: EmployeeRequestRecord,
  registry: ToolRegistry,
): string[] {
  const steps: string[] = [];
  if (record.status === 'negotiating' || record.status === 'submitted') {
    steps.push('Agent boardroom is reviewing your request.');
    steps.push('Legal, IT, Procurement, and Works Council agents negotiate policy.');
  }
  if (record.status === 'pending_external') {
    if (record.deny_code === 'BETRIEBSVEREINBARUNG_PENDING') {
      steps.push('Betriebsvereinbarung annex must be signed by the works council.');
    }
    if (record.deny_code === 'VENDOR_DPA_PENDING') {
      steps.push('Procurement must execute the vendor DPA before rollout.');
    }
    steps.push('You will be notified when external gates clear.');
  }
  if (record.status === 'pending_human') {
    steps.push('DPO or IT must resolve a negotiation deadlock.');
  }
  if (record.status === 'denied') {
    steps.push('This use case cannot be approved under current policy.');
    if (record.deny_code === 'HIGH_RISK_USE_DENIED') {
      steps.push('Annex III high-risk use requires human oversight workflow.');
    }
    const alt = registry.tools.find((t) => t.vendor_dpa_status === 'signed');
    if (alt) steps.push(`Consider an approved alternative: ${alt.display_name}.`);
  }
  if (record.status === 'approved') {
    steps.push('Your request is approved — use the tool through the governed gateway.');
    if (record.routing_decision === 'LOCAL_QWEN_72B') {
      steps.push('Sensitive prompts route to the EU-local model automatically.');
    }
  }
  return steps;
}

export function toolDisplayName(registry: ToolRegistry, toolId: string): string {
  return registry.tools.find((t) => t.tool_id === toolId)?.display_name ?? toolId;
}
