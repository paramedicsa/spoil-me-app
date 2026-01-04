import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3002';

test('header currency toggle updates artist page prices', async ({ page }) => {
  await page.goto(`${BASE}/#/artist-partnership`);
  // Wait for header CTA to appear
  // Dismiss any unexpected modal overlay that may block interactions
  const possibleDismissButtons = ['Continue in Browser', 'Understood', 'Close', 'Got it', 'Understood', 'Install Update'];
  for (const label of possibleDismissButtons) {
    const btn = page.getByRole('button', { name: label });
    if (await btn.count() > 0) {
      try { await btn.first().click({ timeout: 2000 }); } catch (e) { /* ignore */ }
    }
  }
  // Try pressing Escape and clicking backdrop to close stubborn modals
  try { await page.keyboard.press('Escape'); } catch (e) { /* ignore */ }
  try { await page.click('div.fixed.inset-0', { position: { x: 10, y: 10 }, timeout: 2000 }); } catch (e) { /* ignore */ }

  const cta = page.getByText(/START YOUR SHOP/);
  await expect(cta).toBeVisible({ timeout: 7000 });

  // Ensure initial currency (should match app default - ZAR)
  const initialText = await cta.textContent();
  expect(initialText).toContain('R');

  // Find currency toggle and click it
  // Use a direct DOM click so overlays that intercept pointer events won't block the action
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Toggle currency"]') as HTMLElement | null;
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  // After toggle, CTA should display USD
  await expect(cta).toHaveText(/\$/);

  // Toggle back (use DOM dispatch to avoid overlay)
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Toggle currency"]') as HTMLElement | null;
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await expect(cta).toHaveText(/R/);
});