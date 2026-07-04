import type {
  EmployeeProfile,
  EmployeeRequestRecord,
  GatewayAuditEvent,
  RequestPacket,
  ToolRecord,
} from '@trustflow/shared';
import type { InferenceResponse } from '../api.js';

const BASE = '/v1/employee';

export async function getEmployeeProfile(): Promise<EmployeeProfile> {
  return (await fetch(`${BASE}/profile`)).json();
}

export async function listEmployeeRequests(actorId?: string): Promise<EmployeeRequestRecord[]> {
  const qs = actorId ? `?actor_id=${encodeURIComponent(actorId)}` : '';
  const res = await fetch(`${BASE}/requests${qs}`);
  return (await res.json()).requests;
}

export async function getEmployeeRequest(id: string): Promise<EmployeeRequestRecord> {
  const res = await fetch(`${BASE}/requests/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'request not found');
  return res.json();
}

export interface SubmitRequestBody {
  tool_id: string;
  use_case_category: string;
  department?: string;
  data_classes?: string[];
  annex_iii_risk?: boolean;
  business_justification?: string;
  betriebsvereinbarung_status?: RequestPacket['betriebsvereinbarung_status'];
  vendor_dpa_status?: RequestPacket['vendor_dpa_status'];
  replay?: string;
}

export async function submitEmployeeRequest(
  body: SubmitRequestBody,
): Promise<{ request_id: string; status: string }> {
  const res = await fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'submit failed');
  return res.json();
}

export interface ApprovedTool {
  request_id: string;
  tool_id: string;
  tool_display_name: string;
  policy_id?: string;
  policy_version_hash?: string;
  use_case_category: string;
  routing_decision?: string;
}

export async function getApprovedTools(actorId?: string): Promise<ApprovedTool[]> {
  const qs = actorId ? `?actor_id=${encodeURIComponent(actorId)}` : '';
  const res = await fetch(`${BASE}/tools${qs}`);
  return (await res.json()).tools;
}

export async function getToolsCatalog(): Promise<ToolRecord[]> {
  return (await fetch('/v1/tools')).json().then((r: { tools: ToolRecord[] }) => r.tools);
}

export async function runEmployeeInference(body: {
  policy_id: string;
  prompt: string;
  request?: RequestPacket;
  actor_id?: string;
}): Promise<InferenceResponse> {
  const res = await fetch('/v1/inference', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'inference failed');
  return res.json();
}

export type { InferenceResponse, GatewayAuditEvent };
