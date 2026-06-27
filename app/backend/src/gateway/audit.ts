/**
 * Audit event writer (LAYER A). Builds a gateway-audit-event, ajv-validates it
 * against the frozen schema, and appends it as one JSONL line to the audit log.
 *
 * A malformed audit event is a bug, not a soft failure: we throw rather than
 * write an invalid record, because the audit trail is the Art. 26 deliverable.
 */
import { randomUUID } from 'node:crypto';
import _Ajv2020 from 'ajv/dist/2020.js';
import _addFormats from 'ajv-formats';
// ajv ships CJS; under NodeNext the constructor/fn hide behind `.default`.
/* eslint-disable @typescript-eslint/no-explicit-any */
const Ajv2020: any = (_Ajv2020 as any).default ?? _Ajv2020;
const addFormats: any = (_addFormats as any).default ?? _addFormats;
/* eslint-enable @typescript-eslint/no-explicit-any */
import auditSchema from '@trustflow/shared/schemas/gateway-audit-event.schema.json' with { type: 'json' };
import type { GatewayAuditEvent } from '@trustflow/shared';
import { appendAudit } from '../store/index.js';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateAudit = ajv.compile(auditSchema);

export const SYSTEM_ID = process.env.TRUSTFLOW_SYSTEM_ID ?? 'trustflow-demo-de';

/** Validate an audit event against the schema. Returns errors (empty = valid). */
export function validateAuditEvent(event: GatewayAuditEvent): string[] {
  const ok = validateAudit(event) as boolean;
  if (ok) return [];
  return (validateAudit.errors ?? []).map((e: { instancePath: string; message?: string }) => `${e.instancePath} ${e.message}`);
}

/**
 * Finalize an event (fill event_id/timestamp/system_id), validate, append.
 * Throws if the event does not satisfy the schema.
 */
export function emitAuditEvent(
  partial: Omit<GatewayAuditEvent, 'event_id' | 'timestamp' | 'system_id'> &
    Partial<Pick<GatewayAuditEvent, 'event_id' | 'timestamp' | 'system_id'>>,
): GatewayAuditEvent {
  const event: GatewayAuditEvent = {
    event_id: partial.event_id ?? randomUUID(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    system_id: partial.system_id ?? SYSTEM_ID,
    ...partial,
  } as GatewayAuditEvent;

  const errors = validateAuditEvent(event);
  if (errors.length) {
    throw new Error(`audit event failed schema validation: ${errors.join('; ')}`);
  }
  appendAudit(event);
  return event;
}
