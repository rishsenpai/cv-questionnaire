import { test, expect, Page, Route } from '@playwright/test';

// Tests voor BulkVacancyPanel op /admin → Vacatures tab.
//
// Aanpak: alle /api/admin/* + /api/parse-vacancy endpoints worden gemockt
// via page.route(). Admin-sessie wordt vervalst door token in localStorage
// + /api/admin/verify mock. Geen DB / OpenAI nodig.

const ADMIN_TOKEN = 'fake-test-token-admin';

// Minimale fake PDF (alleen magic bytes — server hoeft hem niet echt te
// parsen want we mocken parse-vacancy)
const FAKE_PDF = Buffer.from('%PDF-1.4\n%test\n');

interface CallTracker {
    parseCalls: number;
    createPayloads: Array<Record<string, unknown>>;
}

async function seedAdminSession(page: Page) {
    await page.addInitScript((token) => {
        localStorage.setItem('suri_admin_token', token);
    }, ADMIN_TOKEN);
}

async function mockAdminApis(
    page: Page,
    {
        employers = [],
        parseResponse,
        createResponse,
        tracker,
    }: {
        employers?: Array<{ _id: string; companyName: string; username: string }>;
        parseResponse?: (req: Route) => Promise<void>;
        createResponse?: (req: Route) => Promise<void>;
        tracker?: CallTracker;
    },
) {
    // Catch-all: registreer EERST zodat specifiekere routes erna winnen
    // (Playwright: laatst geregistreerd wint).
    await page.route('**/api/admin/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [], stats: {}, vacancies: [] }),
        });
    });

    await page.route('**/api/admin/verify', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
        });
    });

    await page.route('**/api/admin/employers', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: employers }),
        });
    });

    await page.route('**/api/admin/vacancies?**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                vacancies: [],
                pagination: { page: 1, limit: 100, total: 0, pages: 0 },
            }),
        });
    });

    // POST /api/admin/vacancies (create) — dezelfde URL als de GET hierboven
    // maar zonder query string en method=POST
    await page.route('**/api/admin/vacancies', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        if (tracker) {
            try { tracker.createPayloads.push(JSON.parse(route.request().postData() || '{}')); } catch { /* ignore */ }
        }
        if (createResponse) return createResponse(route);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                message: 'Vacature aangemaakt',
                data: { _id: `mock-${Math.random().toString(36).slice(2, 8)}`, title: 'Mock' },
            }),
        });
    });

    await page.route('**/api/parse-vacancy', async (route) => {
        if (tracker) tracker.parseCalls++;
        if (parseResponse) return parseResponse(route);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    title: 'Senior Developer (geparsed)',
                    location: 'Paramaribo',
                    requirements: 'Voorbeeld vereisten uit AI-parse.',
                },
            }),
        });
    });
}

async function openBulkPanel(page: Page) {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Vacatures/i }).first().click();
    await page.getByRole('button', { name: /Bulk Upload/i }).click();
    // Panel-heading bevestigt dat het paneel open is
    await expect(page.getByRole('heading', { name: /Bulk Vacatures Upload/i })).toBeVisible();
}

function fileInput(page: Page) {
    // De bulk-panel input heeft 'multiple', de single create-form input niet
    return page.locator('input[type="file"][multiple]');
}

test.describe('Admin → Vacatures → Bulk Upload', () => {
    test('opent paneel en laadt werkgever-dropdown', async ({ page }) => {
        await seedAdminSession(page);
        await mockAdminApis(page, {
            employers: [
                { _id: 'emp1', companyName: 'Acme BV', username: 'acme' },
                { _id: 'emp2', companyName: 'Porter NV', username: 'porter' },
            ],
        });

        await openBulkPanel(page);

        // Werkgever-dropdown specifiek targeten: er staat nu ook een
        // country-scope <select> (title="Beperk de match...") in het paneel.
        const dropdown = page.locator('select').filter({ has: page.locator('option', { hasText: 'Acme BV' }) });
        // Default = leeg/admin (de option zelf is niet zichtbaar in een
        // gesloten select, dus check de helper-text eronder)
        await expect(dropdown).toHaveValue('');
        await expect(page.getByText(/als admin\/internal opgeslagen/i)).toBeVisible();
        // Werkgevers aanwezig als opties (attached, niet visible — closed select)
        await expect(dropdown.locator('option', { hasText: 'Acme BV' })).toBeAttached();
        await expect(dropdown.locator('option', { hasText: 'Porter NV' })).toBeAttached();
    });

    test('helper-text wisselt bij employer-selectie en POST krijgt employerId', async ({ page }) => {
        const tracker: CallTracker = { parseCalls: 0, createPayloads: [] };
        await seedAdminSession(page);
        await mockAdminApis(page, {
            employers: [{ _id: 'emp1', companyName: 'Acme BV', username: 'acme' }],
            tracker,
        });

        await openBulkPanel(page);

        // Default helper-text
        await expect(page.getByText(/Geen auto-match/i)).toBeVisible();

        // Selecteer werkgever → tekst wisselt (werkgever-dropdown specifiek,
        // naast de nieuwe country-scope select)
        await page.locator('select').filter({ has: page.locator('option[value="emp1"]') }).selectOption('emp1');
        await expect(page.getByText(/auto-match draait per vacature/i)).toBeVisible();

        // Voeg 1 file toe en start
        await fileInput(page).setInputFiles({
            name: 'vacature-acme.pdf',
            mimeType: 'application/pdf',
            buffer: FAKE_PDF,
        });
        await page.getByRole('button', { name: /Start \(1\)/i }).click();

        // Wacht tot create-call binnen is
        await expect.poll(() => tracker.createPayloads.length, { timeout: 5000 }).toBe(1);
        expect(tracker.createPayloads[0]?.employerId).toBe('emp1');
        expect(tracker.createPayloads[0]?.title).toBe('Senior Developer (geparsed)');
    });

    test('drie files → drie creates → stats kloppen', async ({ page }) => {
        const tracker: CallTracker = { parseCalls: 0, createPayloads: [] };
        await seedAdminSession(page);
        await mockAdminApis(page, { tracker });

        await openBulkPanel(page);

        await fileInput(page).setInputFiles([
            { name: 'a.pdf', mimeType: 'application/pdf', buffer: FAKE_PDF },
            { name: 'b.pdf', mimeType: 'application/pdf', buffer: FAKE_PDF },
            { name: 'c.pdf', mimeType: 'application/pdf', buffer: FAKE_PDF },
        ]);

        // StatChip "Totaal" = 3 (de chip render label "Totaal" + count)
        await expect(page.getByText(/Totaal/i).locator('..').filter({ hasText: '3' })).toBeVisible();

        await page.getByRole('button', { name: /Start \(3\)/i }).click();

        await expect.poll(() => tracker.createPayloads.length, { timeout: 8000 }).toBe(3);
        expect(tracker.parseCalls).toBe(3);
        // Geen employerId meegestuurd (admin-modus)
        for (const p of tracker.createPayloads) {
            expect(p.employerId).toBeUndefined();
        }
    });

    test('te grote file → failed zonder parse-call', async ({ page }) => {
        const tracker: CallTracker = { parseCalls: 0, createPayloads: [] };
        await seedAdminSession(page);
        await mockAdminApis(page, { tracker });

        await openBulkPanel(page);

        // 5 MB > limit van 4.5 MB
        const big = Buffer.alloc(5 * 1024 * 1024, 0x25); // gevuld met '%' chars
        await fileInput(page).setInputFiles({
            name: 'huge.pdf',
            mimeType: 'application/pdf',
            buffer: big,
        });

        await expect(page.getByText(/Bestand te groot/i)).toBeVisible();
        // Start-knop is disabled (0 pending)
        const startBtn = page.getByRole('button', { name: /Start \(0\)/i });
        await expect(startBtn).toBeDisabled();

        // Geen parse-call gemaakt
        expect(tracker.parseCalls).toBe(0);
    });

    test('fout file-type → failed zonder parse-call', async ({ page }) => {
        const tracker: CallTracker = { parseCalls: 0, createPayloads: [] };
        await seedAdminSession(page);
        await mockAdminApis(page, { tracker });

        await openBulkPanel(page);

        await fileInput(page).setInputFiles({
            name: 'image.png',
            mimeType: 'image/png',
            buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        });

        await expect(page.getByText(/Alleen PDF of Word/i)).toBeVisible();
        expect(tracker.parseCalls).toBe(0);
    });

    test('parse mislukt → status failed met server-message', async ({ page }) => {
        await seedAdminSession(page);
        await mockAdminApis(page, {
            parseResponse: async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, message: 'Geen tekst gevonden in PDF' }),
                });
            },
        });

        await openBulkPanel(page);

        await fileInput(page).setInputFiles({
            name: 'broken.pdf',
            mimeType: 'application/pdf',
            buffer: FAKE_PDF,
        });
        await page.getByRole('button', { name: /Start \(1\)/i }).click();

        await expect(page.getByText(/Geen tekst gevonden in PDF/i)).toBeVisible({ timeout: 5000 });
    });
});
