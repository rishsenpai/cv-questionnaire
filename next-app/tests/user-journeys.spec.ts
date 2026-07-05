import { test, expect, Page } from '@playwright/test';

const VACANCIES = Array.from({ length: 12 }, (_, i) => ({
  _id: `aaaaaaaaaaaaaaaaaaaaaa${String(i).padStart(2, '0')}`,
  title: i === 0 ? 'Sales Manager' : i === 1 ? 'Warehouse Coordinator' : `Vacature ${i}`,
  location: i % 2 ? 'Paramaribo' : 'Wanica',
  employmentType: i % 3 ? 'FULL_TIME' : 'CONTRACT',
  salary: i === 2 ? {} : { min: 5000 + i * 2000, max: 8000 + i * 3000, currency: 'SRD' },
  viaJobParsing: true,
  description: 'Omschrijving', requirements: 'Eis 1\nEis 2',
  postedAt: new Date(2026, 5, 20 - i).toISOString(),
}));

async function mockAll(page: Page) {
  await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await page.route('**/api/vacancies?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: VACANCIES }) }));
  await page.route(/\/api\/vacancies\/aaaaaaaaaaaaaaaaaaaaaa\d\d$/, r => {
    const id = r.request().url().split('/').pop();
    const v = VACANCIES.find(x => x._id === id);
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancy: v }) });
  });
  await page.route('**/api/candidate/me', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"success":false}' }));
}

test.describe('User journeys', () => {
  test('J1 home: zoeken via Enter -> voorgevuld + gefilterd', async ({ page }) => {
    await mockAll(page);
    await page.goto('/');
    await page.getByPlaceholder(/functie, trefwoord/i).fill('Sales');
    await page.getByPlaceholder(/functie, trefwoord/i).press('Enter');
    await expect(page).toHaveURL(/vacatures\?q=Sales/);
    await expect.soft(page.getByPlaceholder(/functie of bedrijf/i)).toHaveValue('Sales');
    await expect.soft(page.getByRole('link', { name: 'Sales Manager' })).toBeVisible();
  });

  test('J2 vacatures: salaris-slider filtert, suggesties werken, sorteren werkt', async ({ page }) => {
    await mockAll(page);
    await page.goto('/vacatures');
    await expect(page.getByRole('link', { name: 'Sales Manager' })).toBeVisible();
    await page.locator('input[type=range]').fill('10000');
    await expect.soft(page.getByRole('link', { name: 'Vacature 11' })).toHaveCount(0);
    await expect.soft(page.getByRole('link', { name: 'Vacature 2', exact: true })).toBeVisible();
    await page.locator('input[type=range]').fill('500000');
    const search = page.getByPlaceholder(/functie of bedrijf/i);
    await search.click();
    await search.fill('ware');
    const suggestion = page.locator('.absolute.top-full button', { hasText: 'Warehouse Coordinator' });
    await expect.soft(suggestion).toBeVisible();
    await suggestion.click();
    await expect.soft(search).toHaveValue('Warehouse Coordinator');
    await search.fill('');
    await page.locator('select').last().selectOption('Salaris');
    const first = await page.locator('main a[href^="/vacatures/aaaa"]').first().textContent();
    expect.soft(first).toContain('Vacature 11');
  });

  test('J3 vacatures: bookmark zonder login -> redirect naar /auth', async ({ page }) => {
    await mockAll(page);
    await page.goto('/vacatures');
    await expect(page.getByRole('link', { name: 'Sales Manager' })).toBeVisible();
    await page.getByRole('button', { name: /bewaar vacature sales manager/i }).click();
    await expect.soft(page).toHaveURL(/\/auth/);
  });

  test('J4 detail: apply-modal validatie + escape sluit', async ({ page }) => {
    await mockAll(page);
    await page.goto('/vacatures/aaaaaaaaaaaaaaaaaaaaaa00');
    await expect(page.getByRole('heading', { name: 'Sales Manager' })).toBeVisible();
    await page.getByRole('button', { name: /direct solliciteren/i }).click();
    await expect(page.getByRole('heading', { name: /solliciteren via/i })).toBeVisible();
    await page.locator('input[type=text]').last().fill('Test Persoon');
    await page.locator('input[type=email]').last().fill('test@example.com');
    await page.getByRole('button', { name: /nu solliciteren/i }).click();
    await expect.soft(page.getByText(/upload je cv om te kunnen solliciteren/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect.soft(page.getByRole('heading', { name: /solliciteren via/i })).toHaveCount(0);
  });

  test('J5 sectoren -> klik sector -> gefilterde vacatures', async ({ page }) => {
    await mockAll(page);
    await page.goto('/sectoren');
    const links = page.locator('a[href*="/vacatures?q="]');
    await expect(links.first()).toBeVisible();
    await links.first().click();
    await expect.soft(page).toHaveURL(/vacatures\?q=/);
  });

  test('J6 auth: signup werkgever toont bedrijfsvelden + validatie', async ({ page }) => {
    await mockAll(page);
    await page.goto('/auth?signup=1');
    await page.getByRole('button', { name: /werkgever|employer/i }).first().click();
    await expect.soft(page.getByPlaceholder(/bedrijfsnaam|company/i).first()).toBeVisible();
    await page.getByRole('button', { name: /account creëren|create account/i }).click();
    await expect.soft(page.locator('text=/verplicht|required|voer|vul/i').first()).toBeVisible();
  });

  test('J7 wachtwoord-vergeten: leeg -> fout, gevuld -> succes', async ({ page }) => {
    await mockAll(page);
    await page.route('**/forgot-password', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.goto('/wachtwoord-vergeten');
    await page.locator('button[type=submit], form button').last().click();
    await expect.soft(page.locator('text=/verplicht|vul|voer/i').first()).toBeVisible();
    await page.locator('input').first().fill('test@example.com');
    await page.locator('button[type=submit], form button').last().click();
    await expect.soft(page.locator('text=/verstuurd|inbox|check/i').first()).toBeVisible();
  });

  test('J8 mijn-matches zonder CV -> nette lege staat met upload-CTA', async ({ page }) => {
    await mockAll(page);
    await page.goto('/mijn-matches');
    await expect.soft(page.getByRole('link', { name: /upload/i }).first()).toBeVisible();
  });

  test('J9 cv-builder: stap-validatie', async ({ page }) => {
    await mockAll(page);
    await page.goto('/cv-builder');
    await page.getByRole('button', { name: /volgende|next/i }).click();
    await expect.soft(page.locator('text=/verplicht|vul|voer/i').first()).toBeVisible();
  });

  test('J10 faq: accordion open/dicht', async ({ page }) => {
    await mockAll(page);
    await page.goto('/faq');
    const q = page.getByRole('button', { name: /is het gratis/i });
    await q.click();
    await expect.soft(page.getByText(/volledig gratis/i)).toBeVisible();
    await q.click();
    await expect.soft(page.getByText(/volledig gratis/i)).toHaveCount(0);
  });

  test('J11 vacatures: geen nep match-percentage (matching gebeurt pas op /mijn-matches)', async ({ page }) => {
    await mockAll(page);
    await page.goto('/vacatures');
    await expect(page.getByRole('link', { name: 'Sales Manager' })).toBeVisible();
    await expect.soft(page.getByText(/match score/i)).toHaveCount(0);
    await expect.soft(page.locator('select option', { hasText: 'Match Score' })).toHaveCount(0);
    await page.goto('/vacatures/aaaaaaaaaaaaaaaaaaaaaa00');
    await expect(page.getByRole('heading', { name: 'Sales Manager' })).toBeVisible();
    await expect.soft(page.getByText(/match score/i)).toHaveCount(0);
  });
});

test.describe('Mobiel menu (touch)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('J12 mobiel: X-knop sluit het hamburgermenu', async ({ page }) => {
    await mockAll(page);
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /mobiel menu/i });
    // Scope op <nav>: de footer heeft ook een 'CV Upload'-link die altijd zichtbaar is.
    // .last(): het mobiele paneel staat na de (verborgen) desktop-nav in de DOM.
    const navLink = page.locator('nav').getByRole('link', { name: 'CV Upload' }).last();
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(navLink).toBeVisible();
    // Vóór de fix sloot touchstart het menu en opende de click het meteen weer.
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navLink).not.toBeVisible();
  });
});
