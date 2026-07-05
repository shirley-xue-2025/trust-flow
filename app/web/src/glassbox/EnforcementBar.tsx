import type { RequestPacket } from '@trustflow/shared';
import { nodeSummary, type GlassboxSummaryContext } from './processGraph.js';

export type EnforcementId = 'compiler' | 'policy' | 'gateway' | 'audit' | 'result';

const SEGMENTS: { id: EnforcementId; title: string }[] = [
  { id: 'compiler', title: 'Compiler' },
  { id: 'policy', title: 'Policy' },
  { id: 'gateway', title: 'Gateway' },
  { id: 'audit', title: 'Audit' },
  { id: 'result', title: 'Result' },
];

export function EnforcementBar({
  ctx,
  selected,
  onSelect,
}: {
  ctx: GlassboxSummaryContext;
  selected: string | null;
  onSelect: (id: EnforcementId) => void;
}) {
  const live = Boolean(ctx.result);

  return (
    <div className={`glassbox-enforcement${live ? ' glassbox-enforcement--live' : ''}`}>
      <span className="glassbox-enforcement__label">Deterministic enforcement</span>
      <div className="glassbox-enforcement__track" role="list">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="listitem"
            className={[
              'glassbox-enforcement__chip',
              selected === seg.id ? 'glassbox-enforcement__chip--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(seg.id)}
          >
            <span className="glassbox-enforcement__chip-title">{seg.title}</span>
            <span className="glassbox-enforcement__chip-summary">{nodeSummary(seg.id, ctx)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InputContextBar({
  request,
  activeRequest,
  activeGates,
  onSelectRequest,
  onSelectGates,
}: {
  request?: RequestPacket;
  activeRequest?: boolean;
  activeGates?: boolean;
  onSelectRequest: () => void;
  onSelectGates: () => void;
}) {
  return (
    <div className="glassbox-inputs">
      <span className="glassbox-inputs__label">Inputs</span>
      <button
        type="button"
        className={['glassbox-inputs__chip', activeRequest ? 'glassbox-inputs__chip--active' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={onSelectRequest}
      >
        <span className="glassbox-inputs__chip-title">Employee request</span>
        <span className="glassbox-inputs__chip-summary">
          {request
            ? `${request.tool_id} · ${request.use_case_category.replace(/_/g, ' ')}`
            : 'Pick a scenario'}
        </span>
      </button>
      <button
        type="button"
        className={['glassbox-inputs__chip', activeGates ? 'glassbox-inputs__chip--active' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={onSelectGates}
      >
        <span className="glassbox-inputs__chip-title">Org gates read</span>
        <span className="glassbox-inputs__chip-summary">
          {request
            ? `DPA ${request.vendor_dpa_status ?? '—'} · Works council ${request.betriebsvereinbarung_status ?? '—'}`
            : 'DPA · Works council · entity'}
        </span>
      </button>
    </div>
  );
}
