import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EvalScenario, GatewayAuditEvent, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { getAudit, getScenarios, type InferenceResponse } from '../api.js';
import { useBoardroomRun } from '../hooks/useBoardroomRun.js';
import { BoardroomNodeFace } from './BoardroomNodeFace.js';
import NodeInspector from './NodeInspector.js';
import {
  BOARDROOM_NODE_ID,
  BOARDROOM_STAGE_RECT,
  CANVAS_TIERS,
  GLASSBOX_EDGES,
  GLASSBOX_NODES,
  LEG_META,
  computeEdgePath,
  graphBounds,
  isHeroEdge,
  nodeById,
  nodeSummary,
  type NodeLeg,
} from './processGraph.js';

export interface GlassboxState {
  request?: RequestPacket;
  replay?: string;
  policy?: PolicyArtifact;
  policyHash?: string;
}

export default function GlassBoxCanvas() {
  const [request, setRequest] = useState<RequestPacket | undefined>();
  const [replay, setReplay] = useState<string | undefined>();
  const [policy, setPolicy] = useState<PolicyArtifact | undefined>();
  const [policyHash, setPolicyHash] = useState<string | undefined>();
  const [scenarios, setScenarios] = useState<EvalScenario[]>([]);
  const [selectedId, setSelectedId] = useState(BOARDROOM_NODE_ID);
  const [inference, setInference] = useState<InferenceResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<GatewayAuditEvent[]>([]);
  const [scale, setScale] = useState(0.85);
  const [autoRun, setAutoRun] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const didCenterRef = useRef(false);

  const onCompiled = useCallback((p: PolicyArtifact, hash: string) => {
    setPolicy(p);
    setPolicyHash(hash);
    setSelectedId(BOARDROOM_NODE_ID);
  }, []);

  const { turns, result, running, error, run, reset } = useBoardroomRun(
    request,
    replay,
    onCompiled,
    autoRun,
  );

  useEffect(() => {
    getScenarios()
      .then((list) => {
        setScenarios(list);
        const s04 = list.find((s) => s.scenario_id === 'S04');
        if (s04 && !request) handleRequestChange(s04.request, s04.scenario_id);
      })
      .catch(() => setScenarios([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAudit = useCallback(() => {
    getAudit(100)
      .then((events) => setAuditEvents(events))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshAudit();
    const t = setInterval(refreshAudit, 4000);
    return () => clearInterval(t);
  }, [refreshAudit, inference]);

  const handleRequestChange = (r: RequestPacket, rpl?: string) => {
    reset();
    setRequest(r);
    setReplay(rpl);
    setPolicy(undefined);
    setPolicyHash(undefined);
    setInference(null);
    setAutoRun(true);
    setSelectedId(BOARDROOM_NODE_ID);
    didCenterRef.current = false;
  };

  const handleRun = () => {
    setAutoRun(false);
    run();
    setSelectedId(BOARDROOM_NODE_ID);
  };

  const summaryCtx = useMemo(
    () => ({
      request,
      replay,
      turns,
      running,
      result,
      policy,
      policyHash,
      inference,
      auditEvents,
    }),
    [request, replay, turns, running, result, policy, policyHash, inference, auditEvents],
  );

  const bounds = graphBounds(GLASSBOX_NODES);
  const enforcementLive = Boolean(result);

  const fit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pad = 16;
    const sx = (el.clientWidth - pad * 2) / bounds.width;
    const sy = (el.clientHeight - pad * 2) / bounds.height;
    setScale(Math.min(1, Math.max(0.5, Math.min(sx, sy))));
  }, [bounds.width, bounds.height]);

  const centerOnBoardroom = useCallback((nextScale: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const boardroom = nodeById(BOARDROOM_NODE_ID);
    const cx = (boardroom.x + boardroom.width / 2) * nextScale;
    const cy = (boardroom.y + boardroom.height / 2) * nextScale;
    el.scrollLeft = Math.max(0, cx - el.clientWidth / 2);
    el.scrollTop = Math.max(0, cy - el.clientHeight / 2);
  }, []);

  useEffect(() => {
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  useEffect(() => {
    if (didCenterRef.current) return;
    centerOnBoardroom(scale);
    didCenterRef.current = true;
  }, [scale, centerOnBoardroom]);

  const boardroomFocused = selectedId === BOARDROOM_NODE_ID;

  return (
    <div className={`glassbox-canvas-app${boardroomFocused ? ' glassbox-canvas-app--boardroom' : ''}`}>
      <header className="canvas-toolbar">
        <Link to="/employee" className="canvas-back">
          ← Product
        </Link>
        <div className="canvas-title-block">
          <h1>TrustFlow glassbox</h1>
          <span>Agent boardroom is the product — inputs feed it; enforcement follows</span>
        </div>

        <div className="canvas-controls">
          <label className="canvas-control">
            Scenario
            <select
              value={replay ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                const s = scenarios.find((sc) => sc.scenario_id === id);
                if (s) handleRequestChange(s.request, s.scenario_id);
              }}
            >
              <option value="">Custom / none</option>
              {scenarios.map((s) => (
                <option key={s.scenario_id} value={s.scenario_id}>
                  {s.scenario_id} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="canvas-run" onClick={handleRun} disabled={!request || running}>
            ▶ Run boardroom
          </button>
          <button type="button" className="canvas-fit" onClick={fit}>
            Fit
          </button>
          <div className="canvas-zoom">
            <button type="button" aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.45, s - 0.08))}>
              −
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setScale((s) => Math.min(1.15, s + 0.08))}>
              +
            </button>
          </div>
        </div>
      </header>

      <div className="canvas-legend">
        {(['data', 'ai', 'mechanics'] as NodeLeg[]).map((leg) => (
          <span key={leg} className="legend-item" style={{ color: LEG_META[leg].color }}>
            <span className="legend-dot">{LEG_META[leg].dot}</span>
            {LEG_META[leg].label}
          </span>
        ))}
        <span className="legend-hint">
          <a href="/strategy_explorer.html" target="_blank" rel="noreferrer" className="canvas-pitch-link">
            Problem framing (pitch) ↗
          </a>
        </span>
      </div>

      <div className="canvas-layout">
        <div className="canvas-viewport" ref={viewportRef}>
          <div
            className="canvas-stage"
            style={{
              width: bounds.width,
              height: bounds.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {CANVAS_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`canvas-tier-label canvas-tier-label--${tier.id}`}
                style={{ top: tier.y }}
              >
                <span className="canvas-tier-label__name">{tier.label}</span>
                <span className="canvas-tier-label__hint">{tier.hint}</span>
              </div>
            ))}

            <div
              className={[
                'canvas-boardroom-stage',
                running ? 'canvas-boardroom-stage--running' : '',
                turns.length > 0 ? 'canvas-boardroom-stage--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: BOARDROOM_STAGE_RECT.x,
                top: BOARDROOM_STAGE_RECT.y,
                width: BOARDROOM_STAGE_RECT.width,
                height: BOARDROOM_STAGE_RECT.height,
              }}
              aria-hidden
            />

            <svg className="canvas-edges" width={bounds.width} height={bounds.height}>
              {GLASSBOX_EDGES.map((e) => {
                const from = nodeById(e.from);
                const to = nodeById(e.to);
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={computeEdgePath(from, to)}
                    className={isHeroEdge(e) ? 'canvas-edge canvas-edge--hero' : 'canvas-edge'}
                  />
                );
              })}
            </svg>

            {GLASSBOX_NODES.map((node) => {
              const leg = node.leg;
              const selected = selectedId === node.id;
              const isBoardroom = node.id === BOARDROOM_NODE_ID;
              const isRail = node.tier === 'enforcement';
              const summary = nodeSummary(node.id, summaryCtx);

              if (isBoardroom) {
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={[
                      'canvas-node',
                      'canvas-node--stage',
                      `canvas-node--${leg}`,
                      'canvas-node--featured',
                      running ? 'canvas-node--running' : '',
                      selected ? 'canvas-node--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                    onClick={() => setSelectedId(node.id)}
                  >
                    <BoardroomNodeFace turns={turns} running={running} result={result} replay={replay} />
                  </button>
                );
              }

              return (
                <button
                  key={node.id}
                  type="button"
                  className={[
                    'canvas-node',
                    `canvas-node--${leg}`,
                    isRail ? 'canvas-node--rail' : '',
                    isRail && enforcementLive ? 'canvas-node--rail-live' : '',
                    selected ? 'canvas-node--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  onClick={() => setSelectedId(node.id)}
                >
                  <span className="canvas-node-kind" style={{ color: LEG_META[leg].color }}>
                    {LEG_META[leg].dot}{' '}
                    {leg === 'result' ? 'Output' : leg === 'data' ? 'Read' : 'Code'}
                  </span>
                  <span className="canvas-node-title">{node.title}</span>
                  <span className="canvas-node-summary">{summary}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className={`canvas-inspector${boardroomFocused ? ' canvas-inspector--boardroom' : ''}`}>
          <div className="canvas-inspector-head">
            <span className="canvas-inspector-label">Inspector</span>
            <strong>{GLASSBOX_NODES.find((n) => n.id === selectedId)?.title}</strong>
            {boardroomFocused && (
              <span className="canvas-inspector-sub">Live multi-agent negotiation — the product highlight</span>
            )}
          </div>
          <div className="glassbox">
            <NodeInspector
              nodeId={selectedId}
              request={request}
              replay={replay}
              turns={turns}
              result={result}
              running={running}
              boardroomError={error}
              policy={policy}
              policyHash={policyHash}
              inference={inference}
              auditEvents={auditEvents}
              onRequestChange={handleRequestChange}
              onRunBoardroom={handleRun}
              onInference={(resp) => {
                setInference(resp);
                refreshAudit();
                if (resp) setSelectedId('gateway');
              }}
              scenarios={scenarios}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
