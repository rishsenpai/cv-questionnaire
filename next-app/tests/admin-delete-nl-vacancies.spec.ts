import { test, expect, Page } from '@playwright/test';

// 'Verwijder NL-vacatures'-knop op /admin → Vacatures: bevestigingsdialoog,
// DELETE naar /api/admin/vacancies/netherlands, resultaat-alert.
// Alle API's gemockt — geen DB nodig.

const ADMIN_TOKEN = 'fake-test-token-admin';

async function seedAdminSession(page: Page) {
    await page.addInitScript((token) => {
        localStorage.setItem('suri_admin_token', token);
    }, ADMIN_TOKEN);
}

test.describe('Admin → Vacatures → Verwijder NL-vacatures', () => {
    test('bevestigen → DELETE-call → resultaat-alert', async ({ page }) => {
        let deleteCalls = 0;
        await seedAdminSession(page);
        await page.route('**/api/admin/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], stats: {}, vacancies: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } }) }));
        await page.route('**/api/admin/verify', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
        await page.route('**/api/admin/vacancies/netherlands', async (route) => {
            deleteCalls++;
            expect(route.request().method()).toBe('DELETE');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, deleted: 38, curatedMatches: 0, matchEvents: 0 }),
            });
        });

        const dialogs: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogs.push(`${dialog.type()}: ${dialog.message()}`);
            await dialog.accept();
        });

        await page.goto('/admin');
        await page.getByRole('button', { name: /Vacatures/i }).first().click();
        await page.getByRole('button', { name: 'Verwijder NL-vacatures' }).click();

        await expect.poll(() => deleteCalls).toBe(1);
        // Eerst de confirm, daarna de resultaat-alert met het aantal
        expect(dialogs[0]).toContain('confirm:');
        expect(dialogs[0]).toMatch(/NEDERLANDSE vacatures/);
        await expect.poll(() => dialogs.length).toBe(2);
        expect(dialogs[1]).toContain('38 NL-vacatures verwijderd');
    });

    test('annuleren → geen DELETE-call', async ({ page }) => {
        let deleteCalls = 0;
        await seedAdminSession(page);
        await page.route('**/api/admin/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], stats: {}, vacancies: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } }) }));
        await page.route('**/api/admin/verify', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
        await page.route('**/api/admin/vacancies/netherlands', async (route) => {
            deleteCalls++;
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, deleted: 0 }) });
        });
        page.on('dialog', d => d.dismiss());

        await page.goto('/admin');
        await page.getByRole('button', { name: /Vacatures/i }).first().click();
        await page.getByRole('button', { name: 'Verwijder NL-vacatures' }).click();

        // Geef een eventuele (foutieve) call de kans om binnen te komen
        await page.waitForTimeout(500);
        expect(deleteCalls).toBe(0);
    });
});
