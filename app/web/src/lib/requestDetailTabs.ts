import type { EmployeeRequestRecord } from '@trustflow/shared';

/** Default tab when opening request detail — negotiation first when transcript exists. */
export function defaultRequestDetailTab(
  record: EmployeeRequestRecord,
  transcriptLength: number,
): string {
  if (
    record.status === 'denied_pending_employee' ||
    record.status === 'agent_recommended_deny'
  ) {
    return 'overview';
  }
  if (transcriptLength > 0) return 'negotiation';
  if (record.status === 'negotiating' || record.status === 'submitted') return 'negotiation';
  return 'overview';
}
