import { test, expect } from '@playwright/test';

const DENIED_URL = '/employee/requests/demo-s05-denied';
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8080';

test.beforeEach(async ({ request }) => {
  const res = await request.post(`${BACKEND}/v1/demo/reseed`);
  expect(res.ok()).toBeTruthy();
});

test.describe('Denied request — resolution panel', () => {
  test('propose alternative navigates to child request', async ({ page }) => {
    await page.goto(DENIED_URL);
    await expect(page.getByRole('heading', { name: 'ChatGPT Enterprise' })).toBeVisible();
    const propose = page.getByRole('button', { name: 'Propose alternative' });
    await expect(propose).toBeVisible();
    await expect(propose).toBeEnabled();
    await propose.click();
    await expect(page).not.toHaveURL(/demo-s05-denied$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Copilot/i);
  });

  test('appeal opens form and submits', async ({ page }) => {
    await page.goto(DENIED_URL);
    await page.getByRole('button', { name: 'Appeal' }).click();
    await page.getByPlaceholder(/min 20 characters/i).fill(
      'New evidence: internal security review completed and vendor DPA workshop is scheduled.',
    );
    await page.getByRole('button', { name: 'Submit appeal' }).click();
    await expect(page.getByText('Appeal submitted')).toBeVisible();
  });

  test('accept decision closes request', async ({ page }) => {
    await page.goto(DENIED_URL);
    await page.getByRole('button', { name: 'Accept decision' }).click();
    await expect(page.getByText('Closed')).toBeVisible();
  });

  test('customize alternative link opens new request with parent', async ({ page }) => {
    await page.goto(DENIED_URL);
    await page.getByRole('link', { name: 'Customize alternative…' }).click();
    await expect(page).toHaveURL(/parent=demo-s05-denied/);
  });
});

test.describe('Denied request — page links', () => {
  test('back, governance view, and tabs work', async ({ page }) => {
    await page.goto(DENIED_URL);
    await page.getByRole('link', { name: 'Back to requests' }).click();
    await expect(page).toHaveURL(/\/employee\/requests$/);

    await page.goto(DENIED_URL);
    await page.getByRole('link', { name: /Open governance view/i }).click();
    await expect(page).toHaveURL(/\/governance\/requests\/demo-s05-denied/);

    await page.goto(DENIED_URL);
    await page.getByRole('tab', { name: /Agent negotiation/i }).click();
    await expect(page.getByText(/Round 1/i)).toBeVisible();
    await page.getByRole('tab', { name: 'Policy' }).click();
    await page.getByRole('tab', { name: 'Gateway activity' }).click();
  });

  test('advocate chat accepts a why question', async ({ page }) => {
    await page.goto(DENIED_URL);
    const input = page.getByPlaceholder(/Ask why/i);
    await input.fill('Why was this denied?');
    await input.press('Enter');
    await expect(page.getByText(/blocker|DPA|Procurement/i).last()).toBeVisible();
  });
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('propose alternative is fully in viewport and clickable', async ({ page }) => {
    await page.goto(DENIED_URL);
    const btn = page.getByRole('button', { name: 'Propose alternative' });
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);

    await btn.click();
    await expect(page).not.toHaveURL(/demo-s05-denied$/);
  });
});
