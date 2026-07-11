import { test, expect, Page } from '@playwright/test';

// 'Verwijder NL-vacatures'-knop op /admin → Vacatures: haalt eerst een
// preview op (GET), toont de lijst in de bevestigingsdialoog, en doet pas
// daarna de DELETE. Alle API's gemockt — geen DB nodig.

const ADMIN_TOKEN = 'fake-test-token-admin';

const PREVIEW = {
    success: true,
    count: 2,
    vacancies: [
        { id: 'a1', title: 'Java Developer', company: 'Acme', location: 'Amsterdam', source: 'adzuna' },
        { id: 'a2', title: 'DevOps Engineer', company: 'Beta', location: 'Rotterdam', source: 'adzuna' },
    ],
    skippedEmployerCount: 1,
    skippedEmployer: [{ id: 'e1', title: 'NL werkgever-vacature', company: 'WerkgeverNV', location: 'Utrecht' }],
};

async function seedAdminSession(page: Page) {
    await page.addInitScript((token) => {
        localStorage.setItem('suri_admin_token', token);
    }, ADMIN_TOKEN);
}

async function mockAdmin(page: Page, counters: { gets: number; deletes: number }) {
    await page.route('**/api/admin/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], stats: {}, vacancies: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } }) }));
    await page.route('**/api/admin/verify', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
    await page.route('**/api/admin/vacancies/netherlands', async (route) => {
        if (route.request().method() === 'GET') {
            counters.gets++;
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PREVIEW) });
        }
        counters.deletes++;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, deleted: 2, curatedMatches: 0, matchEvents: 0, skippedEmployerCount: 1 }),
        });
    });
}

test.describe('Admin → Vacatures → Verwijder NL-vacatures', () => {
    test('preview → bevestigen → DELETE-call → resultaat-alert', async ({ page }) => {
        const counters = { gets: 0, deletes: 0 };
        await seedAdminSession(page);
        await mockAdmin(page, counters);

        const dialogs: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogs.push(`${dialog.type()}: ${dialog.message()}`);
            await dialog.accept();
        });

        await page.goto('/admin');
        await page.getByRole('button', { name: /Vacatures/i }).first().click();
        await page.getByRole('button', { name: 'Verwijder NL-vacatures' }).click();

        await expect.poll(() => counters.deletes).toBe(1);
        expect(counters.gets).toBe(1);
        // Confirm toont aantal, de te verwijderen titels én de overgeslagen werkgever-vacatures
        expect(dialogs[0]).toContain('confirm:');
        expect(dialogs[0]).toContain('2 NEDERLANDSE vacatures');
        expect(dialogs[0]).toContain('Java Developer');
        expect(dialogs[0]).toContain('1 werkgever-vacature(s) worden overgeslagen');
        await expect.poll(() => dialogs.length).toBe(2);
        expect(dialogs[1]).toContain('2 NL-vacatures verwijderd');
    });

    test('annuleren in de preview → geen DELETE-call', async ({ page }) => {
        const counters = { gets: 0, deletes: 0 };
        await seedAdminSession(page);
        await mockAdmin(page, counters);
        page.on('dialog', d => d.dismiss());

        await page.goto('/admin');
        await page.getByRole('button', { name: /Vacatures/i }).first().click();
        await page.getByRole('button', { name: 'Verwijder NL-vacatures' }).click();

        // Preview mag opgehaald zijn, maar er is niets verwijderd
        await expect.poll(() => counters.gets).toBe(1);
        await page.waitForTimeout(500);
        expect(counters.deletes).toBe(0);
    });
});
