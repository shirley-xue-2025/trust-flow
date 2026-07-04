/**
 * Human parallel-review store (Layer C).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { BoardroomEnvelope, HumanReviewRecord, HumanReviewStatus, RequestPacket, ReviewerRole } from '@trustflow/shared';
import { dataDir } from '../store/index.js';
import { DEMO_REVIEWERS, procurementReviewRequired, requiredReviewerRoles } from '../employee/requestState.js';

const STORE_FILE = () => join(dataDir(), 'human_reviews.json');

function ensureStore(): HumanReviewRecord[] {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = STORE_FILE();
  if (!existsSync(path)) {
    writeFileSync(path, '[]');
    return [];
  }
  return JSON.parse(readFileSync(path, 'utf8')) as HumanReviewRecord[];
}

function saveAll(records: HumanReviewRecord[]): void {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_FILE(), JSON.stringify(records, null, 2));
}

export function listHumanReviews(requestId?: string): HumanReviewRecord[] {
  const all = ensureStore();
  return requestId ? all.filter((r) => r.request_id === requestId) : all;
}

export function getHumanReview(reviewId: string): HumanReviewRecord | null {
  return ensureStore().find((r) => r.review_id === reviewId) ?? null;
}

export function spawnHumanReviews(
  requestId: string,
  packet: RequestPacket,
  transcript: BoardroomEnvelope[],
): HumanReviewRecord[] {
  const roles = requiredReviewerRoles(packet, transcript);
  const existing = listHumanReviews(requestId);
  const created: HumanReviewRecord[] = [];
  const all = ensureStore();
  const now = new Date().toISOString();

  for (const role of roles) {
    if (existing.some((r) => r.reviewer_role === role)) continue;
    const demo = DEMO_REVIEWERS[role];
    const row: HumanReviewRecord = {
      review_id: randomUUID(),
      request_id: requestId,
      reviewer_role: role,
      reviewer_id: demo.reviewer_id,
      reviewer_display_name: demo.reviewer_display_name,
      status: 'pending',
      created_at: now,
      required: true,
    };
    all.push(row);
    created.push(row);
  }

  if (created.length) saveAll(all);
  return created;
}

export function decideHumanReview(
  reviewId: string,
  decision: 'approve' | 'reject',
  rationale: string,
  rationaleHash: string,
): HumanReviewRecord | null {
  const all = ensureStore();
  const idx = all.findIndex((r) => r.review_id === reviewId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: decision === 'approve' ? 'approved' : 'rejected',
    rationale,
    rationale_hash: rationaleHash,
    decided_at: now,
  };
  saveAll(all);
  return all[idx];
}

export function reviewsSummary(
  reviews: HumanReviewRecord[],
): Partial<Record<ReviewerRole, HumanReviewStatus>> {
  const summary: Partial<Record<ReviewerRole, HumanReviewStatus>> = {};
  for (const r of reviews) summary[r.reviewer_role] = r.status;
  return summary;
}

export { procurementReviewRequired, requiredReviewerRoles };
