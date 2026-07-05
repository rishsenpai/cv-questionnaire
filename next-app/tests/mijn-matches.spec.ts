import { test, expect, Page } from '@playwright/test';

// Kandidaat ziet zijn matches op /mijn-matches?cvId=... — matching-vacancies
// wordt gemockt zodat we puur de rendering/varianten testen.

const CV = { _id: 'cv123', fullName: 'Jan de Tester' };

const MATCHES = [
    {
        _id: 'v1',
        title: 'Senior Data Engineer',
        location: 'Paramaribo',
        employmentType: 'Fulltime',
        salary: { min: 5000, max: 8000, currency: 'SRD' },
        matchScore: 88,
        matchType: 'AI Semantic',
    },
    {
        _id: 'v2',
        title: 'Backend Developer',
        location: 'Amsterdam',
        matchScore: 62,
        matchType: 'AI Semantic',
    },
];

async function mockMatches(page: Page, matches: typeof MATCHES) {
    await page.route('**/api/analytics/track', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/cvs/*/matching-vacancies*', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, cv: CV, totalVacancies: 3, matches }),
        }));
}

test.describe('Kandidaat — Mijn matches', () => {
    test('rendert matchkaarten met scores', async ({ page }) => {
        await mockMatches(page, MATCHES);
        await page.goto('/mijn-matches?cvId=cv123');

        await expect(page.getByRole('heading', { name: /matches voor jan/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /top 2 matches/i })).toBeVisible();

        await expect(page.getByRole('link', { name: /senior data engineer/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /backend developer/i })).toBeVisible();
        await expect(page.getByText('88%')).toBeVisible();
        // Score >= 80 → "Top Match"-badge.
        await expect(page.getByText(/top match/i)).toBeVisible();
        // Solliciteer-knoppen aanwezig.
        await expect(page.getByRole('link', { name: /solliciteer/i }).first()).toBeVisible();
    });

    test('lege matchlijst toont "nog geen matches"', async ({ page }) => {
        await mockMatches(page, []);
        await page.goto('/mijn-matches?cvId=cv123');
        await expect(page.getByRole('heading', { name: /nog geen matches/i })).toBeVisible();
    });

    test('zonder cvId toont "nog geen CV gevonden"', async ({ page }) => {
        await page.route('**/api/analytics/track', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.goto('/mijn-matches');
        await expect(page.getByRole('heading', { name: /nog geen cv gevonden/i })).toBeVisible();
    });
});

test.describe('Kandidaat — Mijn matches edge cases', () => {
    test('server-fout (success:false) toont probleem-melding', async ({ page }) => {
        await page.route('**/api/analytics/track', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/cvs/*/matching-vacancies*', route =>
            route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, message: 'AI-matching is niet geconfigureerd.' }),
            }));
        await page.goto('/mijn-matches?cvId=cv123');
        await expect(page.getByRole('heading', { name: /probleem opgetreden/i })).toBeVisible();
        await expect(page.getByText(/ai-matching is niet geconfigureerd/i)).toBeVisible();
    });

    test('HTML-crash → nette melding, geen "Unexpected token"', async ({ page }) => {
        await page.route('**/api/analytics/track', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/cvs/*/matching-vacancies*', route =>
            route.fulfill({ status: 500, contentType: 'text/html', body: '<!DOCTYPE html><html><body>500</body></html>' }));
        await page.goto('/mijn-matches?cvId=cv123');
        await expect(page.getByText(/verbinding mislukt/i)).toBeVisible();
        await expect(page.getByText(/unexpected token/i)).toHaveCount(0);
    });

    test('match zonder optionele velden (geen salaris/locatie) rendert zonder crash', async ({ page }) => {
        await page.route('**/api/analytics/track', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/cvs/*/matching-vacancies*', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    cv: CV,
                    totalVacancies: 1,
                    // Bewust zonder location/salary/employmentType.
                    matches: [{ _id: 'v9', title: 'Vacature Zonder Extra Velden', matchScore: 55, matchType: 'AI Semantic' }],
                }),
            }));
        await page.goto('/mijn-matches?cvId=cv123');
        await expect(page.getByRole('link', { name: /vacature zonder extra velden/i })).toBeVisible();
        await expect(page.getByText('55%')).toBeVisible();
    });
});
