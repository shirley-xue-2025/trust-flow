/**
 * Zod schema for the boardroom message envelope (boardroom_protocol.md).
 *
 * Every agent turn — whether it came from a live qwen-max call or a golden
 * replay transcript — is validated against this shape before the deterministic
 * compiler is allowed to read it. The compiler only ever reads `demands` +
 * `concessions`; `natural_language` is for the UI.
 */
import { z } from 'zod';
import type { BoardroomEnvelope } from '@trustflow/shared';

export const AGENT_IDS = [
  'workflow_runner',
  'corporate_compliance',
  'it_infra',
  'procurement',
  'works_council',
] as const;

export const STANCES = [
  'approve',
  'conditional_approve',
  'conditional_reject',
  'reject',
  'pass',
] as const;

export const claimSchema = z.object({
  type: z.string(),
  ref: z.string().optional(),
  text: z.string(),
});

export const demandSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  hard: z.boolean().optional(),
});

export const concessionSchema = z.object({
  field: z.string(),
  value: z.unknown(),
});

export const envelopeSchema = z.object({
  session_id: z.string(),
  round: z.number().int().min(0),
  agent: z.enum(AGENT_IDS),
  stance: z.enum(STANCES),
  claims: z.array(claimSchema).optional(),
  demands: z.array(demandSchema).optional(),
  concessions: z.array(concessionSchema).optional(),
  evidence_ids: z.array(z.string()).optional(),
  natural_language: z.string(),
});

export type EnvelopeInput = z.infer<typeof envelopeSchema>;

/**
 * Validate an arbitrary value as a boardroom envelope. The qwen client may not
 * know the session_id / round when it builds the prompt, so callers can supply
 * those and we patch them in before validation.
 */
export function parseEnvelope(
  raw: unknown,
  patch?: { session_id?: string; round?: number; agent?: string },
): BoardroomEnvelope {
  const merged =
    typeof raw === 'object' && raw !== null
      ? { ...(raw as Record<string, unknown>), ...stripUndefined(patch) }
      : raw;
  return envelopeSchema.parse(merged) as BoardroomEnvelope;
}

function stripUndefined<T extends Record<string, unknown>>(obj?: T): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
