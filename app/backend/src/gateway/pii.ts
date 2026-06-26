/**
 * PII detection (LAYER A — deterministic). Regex for IBAN + email; a small
 * hardcoded name gazetteer.
 *
 * NOTE: name detection here is ILLUSTRATIVE ONLY — a real deployment would use a
 * proper NER library (e.g. Presidio). The gazetteer is a demo stand-in so the
 * narrative "names get pseudonymized" is visible without shipping an NER model.
 */
import type { PiiAction, PiiActionRecord } from '@trustflow/shared';

// IBAN: country code + 2 check digits + up to 30 alphanumerics (spaces tolerated).
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Illustrative gazetteer — NOT a real NER. Demo only.
const NAME_GAZETTEER = ['Katrin Brenner', 'Max Mustermann', 'Erika Mustermann', 'Anna Schmidt'];

export interface PiiHit {
  entity_type: 'iban' | 'email' | 'person_name';
  matches: string[];
}

export interface PiiScanResult {
  hits: PiiHit[];
  /** Text after applying the policy actions (mask/pseudonymize/block markers). */
  redactedText: string;
  /** Audit-shaped PII action records. */
  actions: PiiActionRecord[];
  /** True if any entity's policy action is BLOCK and was triggered. */
  blocked: boolean;
}

function findGazetteerNames(text: string): string[] {
  const found: string[] = [];
  for (const name of NAME_GAZETTEER) {
    if (text.includes(name)) found.push(name);
  }
  return found;
}

function piiActionToAudit(action: PiiAction): PiiActionRecord['action'] {
  switch (action) {
    case 'BLOCK':
      return 'blocked';
    case 'MASK':
      return 'masked';
    case 'PSEUDONYMIZE':
      return 'pseudonymized';
    default:
      return 'allowed';
  }
}

/**
 * Scan text and apply the policy's per-entity pii_masking actions.
 * Returns the redacted text + audit records. If any matched entity is BLOCK,
 * `blocked` is true and the caller denies with PII_BLOCK.
 */
export function scanAndApply(
  text: string,
  piiMasking: Record<string, PiiAction>,
): PiiScanResult {
  const ibanMatches = text.match(IBAN_RE) ?? [];
  const emailMatches = text.match(EMAIL_RE) ?? [];
  const nameMatches = findGazetteerNames(text);

  const hits: PiiHit[] = [];
  if (ibanMatches.length) hits.push({ entity_type: 'iban', matches: ibanMatches });
  if (emailMatches.length) hits.push({ entity_type: 'email', matches: emailMatches });
  if (nameMatches.length) hits.push({ entity_type: 'person_name', matches: nameMatches });

  let redactedText = text;
  const actions: PiiActionRecord[] = [];
  let blocked = false;

  for (const hit of hits) {
    const action = piiMasking[hit.entity_type] ?? 'ALLOW';
    actions.push({
      entity_type: hit.entity_type,
      action: piiActionToAudit(action),
      count: hit.matches.length,
    });

    if (action === 'BLOCK') {
      blocked = true;
      continue; // text not forwarded; redaction marker applied below
    }
    if (action === 'ALLOW') continue;

    const marker =
      action === 'MASK' ? `[${hit.entity_type.toUpperCase()}_MASKED]` : `[${hit.entity_type.toUpperCase()}_PSEUDO]`;
    for (const m of hit.matches) {
      redactedText = redactedText.split(m).join(marker);
    }
  }

  if (blocked) {
    // Replace blocked entities with a marker too, for the side-by-side UI view.
    for (const hit of hits) {
      if ((piiMasking[hit.entity_type] ?? 'ALLOW') === 'BLOCK') {
        for (const m of hit.matches) {
          redactedText = redactedText.split(m).join(`[${hit.entity_type.toUpperCase()}_BLOCKED]`);
        }
      }
    }
  }

  return { hits, redactedText, actions, blocked };
}
