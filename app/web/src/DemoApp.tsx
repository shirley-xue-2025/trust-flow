import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PolicyArtifact, RequestPacket } from '@trustflow/shared';
import RequestForm from './views/RequestForm.js';
import Boardroom from './views/Boardroom.js';
import PolicyPanel from './views/PolicyPanel.js';
import Playground from './views/Playground.js';
import AuditLog from './views/AuditLog.js';
import './styles.css';

type Tab = 'intro' | 'request' | 'boardroom' | 'policy' | 'playground' | 'audit';

export interface AppState {
  request?: RequestPacket;
  replay?: string;
  policy?: PolicyArtifact;
  policyHash?: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'intro', label: '0 · Problem' },
  { id: 'request', label: '1 · Request' },
  { id: 'boardroom', label: '2 · Boardroom' },
  { id: 'policy', label: '3 · Policy' },
  { id: 'playground', label: '4 · Playground' },
  { id: 'audit', label: '5 · Audit Log' },
];

export default function DemoApp() {
  const [tab, setTab] = useState<Tab>('intro');
  const [state, setState] = useState<AppState>({});

  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  return (
    <div className="glassbox">
      <div className="app">
      <header className="top">
        <h1>TrustFlow</h1>
        <span className="sub">
          Deterministic enforcement at the edge · generative negotiation for policy authoring
        </span>
        <Link to="/employee" className="demo-employee-link">
          ← Product
        </Link>
        <span className="glassbox-label">Internal technical view</span>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'intro' && (
        <div className="panel">
          <h2>The problem — approval deadlock + Shadow AI</h2>
          <p className="muted">
            Weeks of Legal / IT / Betriebsrat email before an employee can use an AI tool. TrustFlow
            compresses that negotiation into a compiled, enforceable policy.
          </p>
          <iframe
            title="strategy explorer"
            src="/strategy_explorer.html"
            style={{ width: '100%', height: 560, border: '1px solid var(--border)', borderRadius: 10 }}
          />
        </div>
      )}

      {tab === 'request' && (
        <RequestForm
          onSubmit={(request, replay) => {
            patch({ request, replay });
            setTab('boardroom');
          }}
        />
      )}

      {tab === 'boardroom' && (
        <Boardroom
          request={state.request}
          replay={state.replay}
          onCompiled={(policy, policyHash) => patch({ policy, policyHash })}
          gotoPolicy={() => setTab('policy')}
        />
      )}

      {tab === 'policy' && (
        <PolicyPanel policy={state.policy} hash={state.policyHash} gotoPlayground={() => setTab('playground')} />
      )}

      {tab === 'playground' && <Playground policy={state.policy} request={state.request} />}

      {tab === 'audit' && <AuditLog />}
      </div>
    </div>
  );
}
