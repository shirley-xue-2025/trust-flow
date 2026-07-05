import type { BoardroomEnvelope, GatewayAuditEvent, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import type { BoardroomResult } from '../api.js';
import type { InferenceResponse } from '../api.js';

export type NodeLeg = 'data' | 'ai' | 'mechanics' | 'result';
export type CanvasTier = 'input' | 'stage' | 'enforcement';

export interface ProcessNodeDef {
  id: string;
  title: string;
  leg: NodeLeg;
  tier: CanvasTier;
  x: number;
  y: number;
  width: number;
  height: number;
  featured?: boolean;
}

export const BOARDROOM_NODE_ID = 'boardroom';

/** Visual arena behind the boardroom — not clickable. */
export const BOARDROOM_STAGE_RECT = {
  x: 20,
  y: 108,
  width: 1060,
  height: 248,
};

export const CANVAS_TIERS: { id: CanvasTier; label: string; hint: string; y: number }[] = [
  { id: 'input', label: 'Inputs', hint: 'Employee packet + org grounding reads', y: 18 },
  { id: 'stage', label: 'Agent boardroom', hint: 'Track 3 · five specialists negotiate', y: 118 },
  { id: 'enforcement', label: 'Deterministic enforcement', hint: 'Compiler signs · gateway enforces · audit retains', y: 368 },
];

/**
 * Three-tier layout: narrow inputs feed a wide boardroom stage; mechanics run on a subordinate rail.
 * The boardroom owns ~45% of canvas height and ~78% of width.
 */
export const GLASSBOX_NODES: ProcessNodeDef[] = [
  { id: 'request', title: 'Employee request', leg: 'data', tier: 'input', x: 48, y: 44, width: 200, height: 72 },
  { id: 'org-gates', title: 'Org gates read', leg: 'data', tier: 'input', x: 280, y: 44, width: 200, height: 72 },
  {
    id: BOARDROOM_NODE_ID,
    title: 'Agent boardroom',
    leg: 'ai',
    tier: 'stage',
    x: 100,
    y: 148,
    width: 900,
    height: 188,
    featured: true,
  },
  { id: 'compiler', title: 'Policy compiler', leg: 'mechanics', tier: 'enforcement', x: 48, y: 404, width: 152, height: 68 },
  { id: 'policy', title: 'Compiled policy', leg: 'mechanics', tier: 'enforcement', x: 224, y: 404, width: 152, height: 68 },
  { id: 'gateway', title: 'Gateway enforce', leg: 'mechanics', tier: 'enforcement', x: 400, y: 404, width: 152, height: 68 },
  { id: 'audit', title: 'Audit trail', leg: 'mechanics', tier: 'enforcement', x: 576, y: 404, width: 140, height: 68 },
  { id: 'result', title: 'Result', leg: 'result', tier: 'enforcement', x: 740, y: 404, width: 152, height: 68 },
];

export interface ProcessEdge {
  from: string;
  to: string;
}

export function isHeroEdge(edge: ProcessEdge): boolean {
  return edge.to === BOARDROOM_NODE_ID || edge.from === BOARDROOM_NODE_ID;
}

export const GLASSBOX_EDGES: ProcessEdge[] = [
  { from: 'request', to: 'org-gates' },
  { from: 'org-gates', to: 'boardroom' },
  { from: 'boardroom', to: 'compiler' },
  { from: 'compiler', to: 'policy' },
  { from: 'policy', to: 'gateway' },
  { from: 'gateway', to: 'audit' },
  { from: 'audit', to: 'result' },
];

export function nodeById(id: string): ProcessNodeDef {
  const n = GLASSBOX_NODES.find((node) => node.id === id);
  if (!n) throw new Error(`Unknown node: ${id}`);
  return n;
}

/** Route edges by tier — horizontal within a row, vertical into/out of the stage. */
export function computeEdgePath(from: ProcessNodeDef, to: ProcessNodeDef): string {
  const sameRow = Math.abs(from.y - to.y) < 50;

  if (sameRow) {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  }

  if (from.tier === 'input' && to.tier === 'stage') {
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height;
    const x2 = to.x + to.width * 0.22;
    const y2 = to.y;
    const my = y1 + (y2 - y1) * 0.55;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }

  if (from.tier === 'stage' && to.tier === 'enforcement') {
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height;
    const x2 = to.x + to.width / 2;
    const y2 = to.y;
    const my = y1 + (y2 - y1) * 0.45;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }

  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

export interface GlassboxSummaryContext {
  request?: RequestPacket;
  replay?: string;
  turns: BoardroomEnvelope[];
  running: boolean;
  result: BoardroomResult | null;
  policy?: PolicyArtifact;
  policyHash?: string;
  inference: InferenceResponse | null;
  auditEvents: GatewayAuditEvent[];
}

export function nodeSummary(id: string, ctx: GlassboxSummaryContext): string {
  const { request, replay, turns, running, result, policy, policyHash, inference, auditEvents } = ctx;

  switch (id) {
    case 'request':
      if (!request) return 'Pick a scenario or configure';
      return `${request.tool_id} · ${request.use_case_category.replace(/_/g, ' ')}`;
    case 'org-gates': {
      if (!request) return 'DPA · Betriebsrat · entity';
      const br = request.betriebsvereinbarung_status ?? 'from packet';
      const dpa = request.vendor_dpa_status ?? 'from packet';
      const classes = request.data_classes?.length ? `${request.data_classes.length} data class` : 'no sensitive class';
      return `DPA ${dpa} · BR ${br} · ${classes}`;
    }
    case 'boardroom':
      if (running) return `Live · ${turns.length} turns streaming`;
      if (turns.length === 0) return replay ? `Replay ${replay} — click Run` : 'Five agents · click Run';
      return `${turns.length} rounds · ${result?.outcome ?? '…'}`;
    case 'compiler':
      if (!result) return 'Awaiting boardroom';
      return `${result.outcome} · signed hash`;
    case 'policy':
      if (!policy) return 'No rules.json yet';
      return `v${policy.version} · ${(policy.deny_overrides ?? []).length} overrides`;
    case 'gateway':
      if (!policy) return 'Needs compiled policy';
      if (!inference) return 'Send a prompt to test';
      return `${inference.outcome} · route ${inference.routing_decision}`;
    case 'audit':
      return auditEvents.length ? `${auditEvents.length} events · retention` : 'Empty until inference';
    case 'result': {
      const outcome = inference?.outcome ?? result?.outcome;
      if (!outcome) return 'Run pipeline';
      const route = inference?.routing_decision ?? result?.routing_decision;
      const hash = policyHash?.slice(0, 10);
      return `${outcome}${route ? ` · ${route}` : ''}${hash ? ` · ${hash}…` : ''}`;
    }
    default:
      return '';
  }
}

export function resultGrounding(ctx: GlassboxSummaryContext): {
  decision: string;
  routing: string;
  grounding: string;
  numbersFrom: string;
  detail: string;
} {
  const outcome = (ctx.inference?.outcome ?? ctx.result?.outcome ?? 'pending') as string;
  const routing = ctx.inference?.routing_decision ?? ctx.result?.routing_decision ?? '—';
  const hasHash = Boolean(ctx.policyHash);
  const hasAudit = ctx.auditEvents.length > 0;
  const pii = ctx.inference?.audit_event?.pii_actions?.[0];

  let detail = 'Agents propose; deterministic compiler signs; gateway enforces without LLM.';
  if (pii?.action === 'masked') {
    detail = `Email masked at gateway — business continues on ${routing}.`;
  } else if (ctx.inference?.outcome === 'denied') {
    detail = `Blocked: ${ctx.inference.deny_reason_code ?? 'policy deny'}.`;
  } else if (ctx.result?.outcome === 'DENIED') {
    detail = `Boardroom denied: ${ctx.result.deny_code ?? 'policy gates'}.`;
  }

  return {
    decision: outcome.toUpperCase(),
    routing,
    grounding: hasHash && hasAudit ? '✓ hash signed · audit emitted' : hasHash ? '✓ compiler hash signed' : 'pending compile',
    numbersFrom: 'deterministic gateway',
    detail,
  };
}

export const LEG_META: Record<NodeLeg, { label: string; color: string; dot: string }> = {
  data: { label: 'Connected systems inform', color: '#2563eb', dot: '●' },
  ai: { label: 'AI reasons & proposes', color: '#16a34a', dot: '●' },
  mechanics: { label: 'Mechanics validate & execute', color: '#9333ea', dot: '●' },
  result: { label: 'Output', color: '#111827', dot: '●' },
};

export function graphBounds(nodes: ProcessNodeDef[], pad = 40) {
  const xs = nodes.flatMap((n) => [n.x, n.x + n.width]);
  const ys = nodes.flatMap((n) => [n.y, n.y + n.height]);
  const stageXs = [BOARDROOM_STAGE_RECT.x, BOARDROOM_STAGE_RECT.x + BOARDROOM_STAGE_RECT.width];
  const stageYs = [BOARDROOM_STAGE_RECT.y, BOARDROOM_STAGE_RECT.y + BOARDROOM_STAGE_RECT.height];
  const allX = [...xs, ...stageXs];
  const allY = [...ys, ...stageYs];
  return {
    minX: Math.min(...allX) - pad,
    minY: Math.min(...allY) - pad,
    maxX: Math.max(...allX) + pad,
    maxY: Math.max(...allY) + pad,
    width: Math.max(...allX) - Math.min(...allX) + pad * 2,
    height: Math.max(...allY) - Math.min(...allY) + pad * 2,
  };
}
