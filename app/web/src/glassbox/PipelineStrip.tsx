import { Link } from 'react-router-dom';

const STEPS = [
  { id: 'inputs', label: 'Inputs', detail: 'Employee packet + org reads' },
  { id: 'boardroom', label: 'Agent boardroom', detail: 'Specialists negotiate' },
  { id: 'compiler', label: 'Compiler signs', detail: 'Deterministic policy hash' },
  { id: 'humans', label: 'Humans approve', detail: 'DPO + IT sign-off' },
  { id: 'gateway', label: 'Gateway enforces', detail: 'No LLM at edge' },
] as const;

export function PipelineStrip({
  highlight = 'boardroom',
  interactive = false,
  onStepClick,
}: {
  highlight?: string;
  interactive?: boolean;
  onStepClick?: (id: string) => void;
}) {
  return (
    <nav className="glassbox-pipeline" aria-label="Trust pipeline">
      {STEPS.map((step, i) => (
        <div key={step.id} className="glassbox-pipeline__segment">
          {i > 0 && <span className="glassbox-pipeline__arrow" aria-hidden />}
          {interactive && onStepClick ? (
            <button
              type="button"
              className={[
                'glassbox-pipeline__step',
                'glassbox-pipeline__step--button',
                highlight === step.id ? 'glassbox-pipeline__step--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onStepClick(step.id)}
            >
              <span className="glassbox-pipeline__label">{step.label}</span>
              <span className="glassbox-pipeline__detail">{step.detail}</span>
            </button>
          ) : (
            <div
              className={[
                'glassbox-pipeline__step',
                highlight === step.id ? 'glassbox-pipeline__step--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="glassbox-pipeline__label">{step.label}</span>
              <span className="glassbox-pipeline__detail">{step.detail}</span>
            </div>
          )}
        </div>
      ))}
      <Link to="/strategy_explorer.html" target="_blank" rel="noreferrer" className="glassbox-pipeline__pitch">
        Problem framing ↗
      </Link>
    </nav>
  );
}
