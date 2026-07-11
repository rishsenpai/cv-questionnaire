import { test, expect, Page } from '@playwright/test';

// Analytics-tab op /admin: het periode-filter. Nieuw: de 'Vandaag'-knop
// die from/to (vanaf lokale middernacht) meestuurt i.p.v. ?days=.
// Alle API's gemockt — geen DB nodig.

const ADMIN_TOKEN = 'fake-test-token-admin';

const EMPTY_SUMMARY = {
    totalPageviews: 12,
    uniqueVisitors: 5,
    cvSubmissions: 2,
    cvUploads: 3,
    cvManual: 1,
    highMatchEvents: 0,
    highMatchStats: { totalHighMatches: 0, avgTopScore: 0 },
    pageviewsByPage: [],
    visitorsByCountry: [],
    visitorsByCity: [],
    languageUsage: [],
    dailyPageviews: [],
    dailyCVs: [],
    deviceTypes: [],
    browsers: [],
    operatingSystems: [],
    screenSizes: [],
};

async function seedAdminSession(page: Page) {
    await page.addInitScript((token) => {
        localStorage.setItem('suri_admin_token', token);
    }, ADMIN_TOKEN);
}

test.describe('Admin → Analytics → periode-filter', () => {
    test('Vandaag-knop stuurt from/to van vandaag mee i.p.v. days', async ({ page }) => {
        const summaryUrls: string[] = [];
        await seedAdminSession(page);
        await page.route('**/api/admin/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], stats: {}, vacancies: [] }) }));
        await page.route('**/api/admin/verify', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
        await page.route('**/api/analytics/summary**', async (route) => {
            summaryUrls.push(route.request().url());
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EMPTY_SUMMARY }) });
        });

        await page.goto('/admin');
        await page.getByRole('button', { name: /Analytics/i }).first().click();

        // Default: 30 dagen
        await expect.poll(() => summaryUrls.length).toBeGreaterThan(0);
        expect(summaryUrls[0]).toContain('days=30');

        // Klik 'Vandaag' → nieuwe request met from/to en zonder days
        await page.getByRole('button', { name: 'Vandaag', exact: true }).click();
        await expect.poll(() => summaryUrls.length).toBeGreaterThan(1);
        const todayUrl = new URL(summaryUrls[summaryUrls.length - 1]);
        expect(todayUrl.searchParams.get('days')).toBeNull();
        const from = todayUrl.searchParams.get('from');
        const to = todayUrl.searchParams.get('to');
        expect(from).toBeTruthy();
        expect(to).toBeTruthy();
        // from = lokale middernacht van vandaag; to = nu (dus to >= from en beide geldig)
        expect(new Date(from!).getTime()).toBeLessThanOrEqual(new Date(to!).getTime());
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        expect(new Date(from!).getTime()).toBe(startOfToday.getTime());

        // Data van de mock wordt getoond (tab is niet gecrasht na de wissel)
        await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    });
});
