import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EvalScenario, GatewayAuditEvent, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { getAudit, getScenarios, type InferenceResponse } from '../api.js';
import { useBoardroomRun } from '../hooks/useBoardroomRun.js';
import { BoardroomTheater } from './BoardroomTheater.js';
import { EnforcementBar, InputContextBar, type EnforcementId } from './EnforcementBar.js';
import { GlassboxToolbar } from './GlassboxToolbar.js';
import NodeInspector from './NodeInspector.js';
import { PipelineStrip } from './PipelineStrip.js';

const PANEL_TITLES: Record<string, string> = {
  request: 'Employee request',
  'org-gates': 'Org gates read',
  compiler: 'Policy compiler',
  policy: 'Compiled policy',
  gateway: 'Gateway enforce',
  audit: 'Audit trail',
  result: 'Result',
};

export default function GlassBoxCanvas() {
  const [request, setRequest] = useState<RequestPacket | undefined>();
  const [replay, setReplay] = useState<string | undefined>();
  const [policy, setPolicy] = useState<PolicyArtifact | undefined>();
  const [policyHash, setPolicyHash] = useState<string | undefined>();
  const [scenarios, setScenarios] = useState<EvalScenario[]>([]);
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [inference, setInference] = useState<InferenceResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<GatewayAuditEvent[]>([]);
  const [autoRun, setAutoRun] = useState(true);

  const onCompiled = useCallback((p: PolicyArtifact, hash: string) => {
    setPolicy(p);
    setPolicyHash(hash);
    setInspectorId(null);
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
    setInspectorId(null);
  };

  const handleRun = () => {
    setAutoRun(false);
    run();
    setInspectorId(null);
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

  const panelTitle = inspectorId ? (PANEL_TITLES[inspectorId] ?? inspectorId) : '';
  const panelTech =
    inspectorId === 'gateway' ||
    inspectorId === 'audit' ||
    inspectorId === 'compiler' ||
    inspectorId === 'policy';

  return (
    <div className={`glassbox-shell${inspectorId ? ' glassbox-shell--panel-open' : ''}`}>
      <GlassboxToolbar
        scenarios={scenarios}
        replay={replay}
        request={request}
        running={running}
        error={error}
        onScenarioChange={handleRequestChange}
        onRun={handleRun}
      />

      <PipelineStrip highlight="boardroom" />

      <div className="glassbox-main">
        <div className="glassbox-body">
          <InputContextBar
            request={request}
            activeRequest={inspectorId === 'request'}
            activeGates={inspectorId === 'org-gates'}
            onSelectRequest={() => setInspectorId((id) => (id === 'request' ? null : 'request'))}
            onSelectGates={() => setInspectorId((id) => (id === 'org-gates' ? null : 'org-gates'))}
          />

          <BoardroomTheater turns={turns} running={running} result={result} replay={replay} />

          <EnforcementBar
            ctx={summaryCtx}
            selected={inspectorId}
            onSelect={(id: EnforcementId) => setInspectorId((cur) => (cur === id ? null : id))}
          />
        </div>

        {inspectorId && (
          <aside className="glassbox-panel" aria-labelledby="glassbox-panel-title">
            <header className="glassbox-panel__head">
              <div className="glassbox-panel__head-text">
                <span className="glassbox-panel__label">Detail</span>
                <strong id="glassbox-panel-title">{panelTitle}</strong>
              </div>
              <button
                type="button"
                className="glassbox-panel__close"
                aria-label="Close detail panel"
                onClick={() => setInspectorId(null)}
              >
                ✕
              </button>
            </header>
            <div className={`glassbox-panel__body${panelTech ? ' glassbox-panel__body--tech' : ''}`}>
              {panelTech ? (
                <div className="glassbox">
                  <NodeInspector
                    nodeId={inspectorId}
                    embedded
                    request={request}
                    replay={replay}
                    turns={turns}
                    result={result}
                    running={running}
                    policy={policy}
                    policyHash={policyHash}
                    inference={inference}
                    auditEvents={auditEvents}
                    onRequestChange={handleRequestChange}
                    onInference={(resp) => {
                      setInference(resp);
                      refreshAudit();
                      if (resp) setInspectorId('gateway');
                    }}
                    scenarios={scenarios}
                  />
                </div>
              ) : (
                <NodeInspector
                  nodeId={inspectorId}
                  embedded
                  request={request}
                  replay={replay}
                  turns={turns}
                  result={result}
                  running={running}
                  policy={policy}
                  policyHash={policyHash}
                  inference={inference}
                  auditEvents={auditEvents}
                  onRequestChange={handleRequestChange}
                  onInference={(resp) => {
                    setInference(resp);
                    refreshAudit();
                    if (resp) setInspectorId('gateway');
                  }}
                  scenarios={scenarios}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
