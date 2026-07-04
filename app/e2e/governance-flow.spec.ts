import { test, expect } from '@playwright/test';

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8080';

test.beforeEach(async ({ request }) => {
  const res = await request.post(`${BACKEND}/v1/demo/reseed`);
  expect(res.ok()).toBeTruthy();
});

test.describe('Governance console', () => {
  test('queues and sign-off request links work', async ({ page }) => {
    await page.goto('/governance/queues?queue=signoff&role=dpo');
    await expect(page.getByRole('heading', { name: /Queues/i })).toBeVisible();

    const signoffRow = page.getByRole('link', { name: /Alex Weber/i }).first();
    await expect(signoffRow).toBeVisible({ timeout: 10_000 });
    await signoffRow.click();
    await expect(page).toHaveURL(/\/governance\/requests\/demo-s04-pending-signoff/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Claude Code/i);
  });

  test('role switcher in header updates persona and queues', async ({ page }) => {
    await page.goto('/governance/queues?queue=signoff&role=dpo');
    await page.getByRole('button', { name: 'IT Security' }).click();
    await expect(page).toHaveURL(/role=it/);
    await expect(page.getByText('CISO · NordPay AG')).toBeVisible();
    await page.getByRole('button', { name: 'Procurement' }).click();
    await expect(page).toHaveURL(/role=procurement/);
    await expect(page.getByText('Vendor & DPA risk')).toBeVisible();
  });

  test('queue tabs navigate', async ({ page }) => {
    await page.goto('/governance/queues?queue=signoff&role=dpo');
    await page.getByRole('button', { name: 'Appeals' }).click();
    await expect(page).toHaveURL(/queue=appeals/);
    await page.getByRole('button', { name: 'External' }).click();
    await expect(page).toHaveURL(/queue=external/);
  });

  test('overview dashboard links to queues', async ({ page }) => {
    await page.goto('/governance');
    await page.getByRole('link', { name: /pending sign-off/i }).click();
    await expect(page).toHaveURL(/\/governance\/queues/);
  });
});

test.describe('Employee dashboard demo links', () => {
  test('pre-seeded scenario buttons open request detail', async ({ page }) => {
    await page.goto('/employee');
    await page.getByRole('link', { name: 'ChatGPT — denied (appeal demo)' }).click();
    await expect(page).toHaveURL(/demo-s05-denied/);
    await expect(page.getByRole('button', { name: 'Propose alternative' })).toBeVisible();
  });
});
