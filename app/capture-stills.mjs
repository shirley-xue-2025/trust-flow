// Capture judge-facing stills from the running TrustFlow dev server.
// Run from trust-flow/app:  node <path>/capture_stills.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const WEB = 'http://localhost:5173';
const API = 'http://localhost:8080';
const OUT = process.env.STILLS_OUT ?? '../docs/hackathon/screenshots';
mkdirSync(OUT, { recursive: true });

const api = async (method, path, body, headers = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
};

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

// 0 — pristine demo state
await api('POST', '/v1/demo/reseed');

// 1 — glassbox classic (boardroom outcome after payment-routing demo replay)
await page.goto(`${WEB}/glassbox`);
await page.locator('.glassbox-theater__outcome, .boardroom-stage-transcript').first().waitFor({ timeout: 45000 });
await page.waitForTimeout(800);
await shot('01_glassbox_boardroom_s04');

// 2 — employee S04 agent-negotiation transcript
await page.goto(`${WEB}/employee/requests/demo-s04-pending-signoff?tab=negotiation`);
await page.getByText('Round 5', { exact: false }).first().waitFor({ timeout: 30000 });
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(400);
await shot('02_employee_negotiation_s04');

// 3 — governance dual sign-off (pending)
await page.goto(`${WEB}/governance/requests/demo-s04-pending-signoff?role=dpo`);
await page.getByText('Human sign-off').first().waitFor({ timeout: 20000 });
await page.waitForTimeout(300);
await shot('03_governance_signoff_pending');

// 4 — approve both reviews via API, capture approved state
const detail = await api('GET', '/v1/governance/requests/demo-s04-pending-signoff');
const reviews = detail.human_reviews ?? detail.reviews ?? [];
const rationale = {
  dpo: 'Privacy risk reviewed — masking policy and audit retention adequate for pilot.',
  it: 'Routing pinned to LOCAL_QWEN_72B for payment schemas; logging and retention verified.',
};
for (const r of reviews) {
  const key = (r.reviewer_role ?? r.role ?? r.review_id ?? '').toLowerCase().includes('it') ? 'it' : 'dpo';
  await api(
    'POST',
    `/v1/governance/requests/demo-s04-pending-signoff/reviews/${r.review_id ?? r.id}/decide`,
    { decision: 'approve', rationale: rationale[key] },
  );
}
await page.reload();
await page.getByText('Human sign-off').first().waitFor({ timeout: 20000 });
await page.waitForTimeout(300);
await shot('04_governance_signoff_approved');

// 5/6 — gateway playground: email MASK, then IBAN BLOCK
await page.goto(`${WEB}/glassbox`);
await page.locator('.glassbox-theater__outcome').waitFor({ timeout: 45000 });
const gatewayCard = page.getByText('Send a prompt to test').first();
await gatewayCard.click();
const panel = page.getByText('Send through gateway');
if (!(await panel.isVisible().catch(() => false))) await gatewayCard.click();
await panel.waitFor({ timeout: 5000 });

await page.getByRole('button', { name: 'Email (masked)' }).click();
await page.getByText('Send through gateway').click();
await page.getByText('outcome', { exact: false }).first().waitFor({ timeout: 10000 });
await page.waitForTimeout(400);
await shot('05_gateway_email_masked');

await page.getByRole('button', { name: 'IBAN (may block)' }).click();
await page.getByText('Send through gateway').click();
await page.getByText('PII_BLOCK', { exact: false }).first().waitFor({ timeout: 10000 });
await page.waitForTimeout(400);
await shot('06_gateway_iban_block');

// 7 — governance audit trail
await page.goto(`${WEB}/governance/audit`);
await page.waitForTimeout(1200);
await shot('07_governance_audit');

// 8 — S05 denied: advocate + resolution
await page.goto(`${WEB}/employee/requests/demo-s05-denied`);
await page.getByText('Your Advocate', { exact: false }).waitFor({ timeout: 15000 });
await page.waitForTimeout(300);
await shot('08_employee_s05_denied_advocate');

// 9 — S02 works-council gate banner
await page.goto(`${WEB}/employee/requests/demo-s02-external`);
await page.waitForTimeout(1200);
await shot('09_employee_s02_wc_gate');

// 10 — strategy explorer (problem framing), best effort
try {
  const resp = await page.goto(`${WEB}/strategy_explorer.html`, { timeout: 8000 });
  if (resp?.ok()) {
    await page.waitForTimeout(1500);
    await shot('10_strategy_explorer');
  } else {
    console.log('strategy_explorer.html not served — skipped');
  }
} catch {
  console.log('strategy_explorer.html not reachable — skipped');
}

// restore pristine demo state
await api('POST', '/v1/demo/reseed');
await browser.close();
console.log(`done → ${OUT}`);
