import { test, expect, Page } from '@playwright/test';

// Regressietest voor de trilinguale site (NL/EN/ES). Verifieert dat de
// taalswitcher in de navbar de content wisselt op meerdere pagina's en dat de
// keuze bewaard blijft. API's gemockt (geen DB).

async function mock(page: Page) {
  await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: [] }) }));
}

async function switchTo(page: Page, label: RegExp) {
  await page.getByRole('button', { name: /language|taal|idioma/i }).first().click();
  await page.getByRole('menuitemradio', { name: label }).click();
}

test.describe('Trilinguale site', () => {
  test('home wisselt NL → EN → ES', async ({ page }) => {
    await mock(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /vind je nieuwe/i })).toBeVisible();
    await switchTo(page, /english/i);
    await expect(page.getByRole('heading', { name: /find your next/i })).toBeVisible();
    await switchTo(page, /español/i);
    await expect(page.getByRole('heading', { name: /encuentra tu nuevo/i })).toBeVisible();
  });

  test('taalkeuze blijft bewaard na reload en over pagina’s heen', async ({ page }) => {
    await mock(page);
    await page.goto('/');
    await switchTo(page, /english/i);
    await page.reload();
    await expect(page.getByRole('heading', { name: /find your next/i })).toBeVisible();
    // Navigeer naar vacatures — taal blijft EN.
    await page.goto('/vacatures');
    await expect(page.getByRole('heading', { name: /find your perfect match/i })).toBeVisible();
    // En FAQ.
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /everything you want to/i })).toBeVisible();
  });

  test('navbar-links zijn vertaald in het Spaans', async ({ page }) => {
    await mock(page);
    await page.goto('/');
    await switchTo(page, /español/i);
    // "Vacantes" (ES) verschijnt in de navigatie.
    await expect(page.getByRole('link', { name: /vacantes/i }).first()).toBeVisible();
  });
});
