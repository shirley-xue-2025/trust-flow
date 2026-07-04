/**
 * Advocate — deterministic employee-facing explanation (Epic C7 fallback).
 */
import type { BoardroomEnvelope, EmployeeRequestRecord, ToolRegistry } from '@trustflow/shared';
import { DENY_LABELS } from '../fixtures/denyLabels.js';

export interface AdvocateExplanation {
  summary: string;
  bullets: string[];
  suggested_alternatives: { tool_id: string; display_name: string; reason: string }[];
  disclosure: string;
}

const DISCLOSURE =
  'This assistant explains the decision; it does not replace your DPO or Legal team.';

export function buildAdvocateExplanation(
  record: EmployeeRequestRecord,
  registry: ToolRegistry,
  transcript: BoardroomEnvelope[] = record.transcript_snapshot ?? [],
): AdvocateExplanation {
  const denyLabel = record.deny_code ? DENY_LABELS[record.deny_code] ?? record.deny_code : 'Policy gates not met';
  const bullets: string[] = [
    `Stakeholders reviewed your ${record.use_case_category.replace(/_/g, ' ')} request for ${record.tool_display_name}.`,
    `Primary blocker: ${denyLabel}.`,
  ];

  const procurementTurn = transcript.find((t) => t.agent === 'procurement');
  const complianceTurn = transcript.find((t) => t.agent === 'corporate_compliance');
  const worksCouncilTurn = transcript.find((t) => t.agent === 'works_council');

  if (procurementTurn?.natural_language) {
    bullets.push(`Procurement: ${truncate(procurementTurn.natural_language, 160)}`);
  }
  if (complianceTurn?.natural_language) {
    bullets.push(`Compliance: ${truncate(complianceTurn.natural_language, 160)}`);
  }
  if (worksCouncilTurn?.natural_language) {
    bullets.push(`Works council: ${truncate(worksCouncilTurn.natural_language, 160)}`);
  }

  const signed = registry.tools.filter((t) => t.vendor_dpa_status === 'signed' && t.tool_id !== record.tool_id);
  const suggested_alternatives = signed.slice(0, 3).map((t) => ({
    tool_id: t.tool_id,
    display_name: t.display_name,
    reason: 'Vendor DPA already signed — lower procurement friction',
  }));

  const summary = `Your request was not approved yet. ${denyLabel}. You can accept this outcome, appeal with new evidence, or propose an alternative tool or scope.`;

  return { summary, bullets, suggested_alternatives, disclosure: DISCLOSURE };
}

export function advocateChatReply(
  record: EmployeeRequestRecord,
  message: string,
  explanation: AdvocateExplanation,
): string {
  const q = message.toLowerCase();
  if (q.includes('why') || q.includes('denied') || q.includes('block')) {
    const blocker = explanation.bullets.find((b) => b.startsWith('Primary blocker'));
    const procurement = explanation.bullets.find((b) => b.startsWith('Procurement'));
    if (blocker && procurement) {
      return `${blocker.replace('Primary blocker: ', 'The main blocker is ')} ${procurement}`;
    }
    return blocker ?? `Stakeholders did not approve this request because: ${explanation.bullets[1] ?? denyLabelFromRecord(record)}`;
  }
  if (q.includes('alternative') || q.includes('copilot') || q.includes('other tool')) {
    if (explanation.suggested_alternatives.length === 0) {
      return 'No pre-approved alternatives matched your use case. Use “Propose alternative” to submit a linked request.';
    }
    return `Consider: ${explanation.suggested_alternatives.map((a) => a.display_name).join(', ')}. Use “Propose alternative” to start a new request with a safer tool.`;
  }
  if (q.includes('appeal')) {
    return 'An appeal sends your statement to the DPO queue. Choose procedural (process error), factual (new evidence), or alternative scope (narrower use case).';
  }
  if (q.includes('dpa') || q.includes('vendor')) {
    return explanation.bullets.find((b) => b.startsWith('Procurement')) ?? 'Procurement must execute the vendor DPA before this tool can be approved.';
  }
  if (q.includes('betrieb') || q.includes('works council')) {
    return explanation.bullets.find((b) => b.startsWith('Works council')) ?? 'Works council agreement may be required before rollout.';
  }
  return `${explanation.summary} Ask about “why”, “alternatives”, or “appeal” for more detail.`;
}

function denyLabelFromRecord(record: EmployeeRequestRecord): string {
  return record.deny_code ? DENY_LABELS[record.deny_code] ?? record.deny_code : 'policy gates were not met';
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
