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
    // De match moet zichtbaar zijn...
    await expect.soft(page.getByRole('link', { name: 'Sales Manager' })).toBeVisible();
    // ...én een niet-matchende vacature moet WEG zijn. Zonder deze regel zou een
    // kapot filter dat alles toont ook slagen (Sales Manager staat er dan ook) —
    // precies de holle-assertie-val van de sectorbug.
    await expect.soft(page.getByRole('link', { name: 'Warehouse Coordinator' })).toHaveCount(0);
    await expect.soft(page.getByRole('link', { name: 'Vacature 3', exact: true })).toHaveCount(0);
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
    // Niet alleen de URL: de auth-pagina moet ook echt gerenderd zijn (een
    // wachtwoordveld). Een redirect naar een lege/kapotte /auth zou anders slagen.
    await expect.soft(page.locator('input[type=password]').first()).toBeVisible();
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

  test('J5 sectoren -> klik sector -> zoekterm belandt in het filter', async ({ page }) => {
    await mockAll(page);
    await page.goto('/sectoren');
    // Pak een concrete sectorkaart i.p.v. "de eerste link", zodat we het label
    // dat wordt doorgegeven ook kunnen verifiëren in het zoekveld (echt eindresultaat,
    // niet alleen dat de URL veranderde).
    const card = page.locator('a[href*="/vacatures?q="]', { hasText: 'Finance & Legal' });
    await expect(card).toBeVisible();
    await card.click();
    await expect.soft(page).toHaveURL(/vacatures\?q=/);
    // Kernoutcome: het label staat voorgevuld in het zoekveld (de bug was dat dit
    // label vervolgens nooit matchte — J13 borgt de resultaten zelf).
    await expect.soft(page.getByPlaceholder(/functie of bedrijf/i)).toHaveValue(/Finance & Legal/);
  });

  test('J6 auth: signup werkgever toont bedrijfsvelden + validatie', async ({ page }) => {
    await mockAll(page);
    await page.goto('/auth?signup=1');
    await page.getByRole('button', { name: /werkgever|employer/i }).first().click();
    await expect.soft(page.getByPlaceholder(/bedrijfsnaam|company/i).first()).toBeVisible();
    await page.getByRole('button', { name: /account creëren|create account/i }).click();
    // Scherp anker i.p.v. losse woorden (die ook op labels matchen): de validatie
    // markeert minstens één veld semantisch als ongeldig (aria-invalid=true)...
    await expect.soft(page.locator('[aria-invalid="true"]').first()).toBeVisible();
    // ...en het formulier is NIET verzonden — we staan nog op het signup-formulier.
    await expect.soft(page.getByPlaceholder(/bedrijfsnaam|company/i).first()).toBeVisible();
  });

  test('J7 wachtwoord-vergeten: leeg -> fout, gevuld -> succes', async ({ page }) => {
    await mockAll(page);
    await page.route('**/forgot-password', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.goto('/wachtwoord-vergeten');
    await page.locator('button[type=submit], form button').last().click();
    // Exacte validatiemelding i.p.v. een losse-woorden-regex.
    await expect.soft(page.getByText(/voer je e-mailadres in/i)).toBeVisible();
    await page.locator('input').first().fill('test@example.com');
    await page.locator('button[type=submit], form button').last().click();
    // Echt eindresultaat: het succes-scherm ("Check je inbox") is gerenderd,
    // niet enkel een tekstfragment ergens op de pagina.
    await expect.soft(page.getByRole('heading', { name: /check je inbox/i })).toBeVisible();
  });

  test('J8 mijn-matches zonder CV -> nette lege staat met upload-CTA', async ({ page }) => {
    await mockAll(page);
    await page.goto('/mijn-matches');
    // Echt eindresultaat: de "geen CV"-staat is gerenderd met de juiste tekst...
    await expect.soft(page.getByRole('heading', { name: /nog geen cv gevonden/i })).toBeVisible();
    // ...en de CTA wijst daadwerkelijk naar /cv-upload (niet zomaar "een upload-link").
    await expect.soft(page.getByRole('link', { name: /cv uploaden/i })).toHaveAttribute('href', '/cv-upload');
  });

  test('J9 cv-builder: stap-validatie', async ({ page }) => {
    await mockAll(page);
    await page.goto('/cv-builder');
    // Exacte 'Volgende' (NL default): /next/i zou ook de Next.js Dev Tools-knop
    // matchen in dev-mode (bestaat niet in productie).
    const nextBtn = page.getByRole('button', { name: 'Volgende', exact: true });
    await nextBtn.click();
    // Exacte veld-specifieke fout i.p.v. losse woorden; bewijst dat stap-validatie
    // echt aansloeg op het verplichte naam-veld.
    await expect.soft(page.getByText(/naam is verplicht/i)).toBeVisible();
    // En de stap is NIET voortgezet: de Volgende-knop staat er nog.
    await expect.soft(nextBtn).toBeVisible();
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

test.describe('Sector-zoekfilter (woord-matching)', () => {
  const SECTOR_VACS = [
    { _id: 'bbbbbbbbbbbbbbbbbbbbbb01', title: 'Data Analist', location: 'Paramaribo', employmentType: 'FULL_TIME', salary: { min: 6000, max: 9000, currency: 'SRD' }, viaJobParsing: true, description: 'Werken met dashboards', requirements: 'SQL', postedAt: new Date(2026, 5, 1).toISOString() },
    { _id: 'bbbbbbbbbbbbbbbbbbbbbb02', title: 'Vrachtwagenchauffeur', location: 'Nickerie', employmentType: 'FULL_TIME', salary: { min: 4000, max: 5000, currency: 'SRD' }, viaJobParsing: true, description: 'Transport van goederen', requirements: 'Rijbewijs', postedAt: new Date(2026, 5, 2).toISOString() },
  ];

  test('J13 meerwoords-sectorlabel toont de relevante vacature (niet leeg)', async ({ page }) => {
    await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/vacancies?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: SECTOR_VACS }) }));
    await page.route('**/api/candidate/me', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"success":false}' }));

    // Exact de link die een sectorkaart genereert: label met komma + ampersand.
    await page.goto('/vacatures?q=' + encodeURIComponent('IT, Data & Digital'));
    // "Data" uit het label matcht de titel "Data Analist" → zichtbaar.
    await expect(page.getByRole('link', { name: 'Data Analist' })).toBeVisible();
    // De niet-gerelateerde vacature valt weg.
    await expect.soft(page.getByRole('link', { name: 'Vrachtwagenchauffeur' })).toHaveCount(0);
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
