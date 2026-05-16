import { test, expect, Page } from '@playwright/test';

// Tests voor de "nieuwe matches"-badge op /dashboard/company.
//
// Aanpak: we mocken alle /api/employer/* endpoints met page.route() zodat
// er geen DB of OpenAI-call nodig is. Auth wordt vervalst door de
// employer-token in localStorage te zetten + /api/employer/verify te
// mocken. Zo testen we puur de UI-laag van de badge.

const EMPLOYER_TOKEN = 'fake-test-token-employer';

interface MockVacancy {
    _id: string;
    title: string;
    company?: string;
    location?: string;
    createdAt: string;
    isActive: boolean;
    source: string;
}

interface MockAnalytics {
    vacancyId: string;
    presented: number;
    viewed?: number;
    contactRequested?: number;
    rejected?: number;
    viewCount?: number;
    applicationCount?: number;
    jobseekerMatchCount?: number;
}

async function seedEmployerSession(page: Page) {
    await page.addInitScript((token) => {
        localStorage.setItem('suri_employer_token', token);
        localStorage.setItem(
            'suri_user',
            JSON.stringify({
                role: 'employer',
                name: 'Test Bedrijf',
                isLoggedIn: true,
                onboarded: true,
            }),
        );
    }, EMPLOYER_TOKEN);
}

async function mockEmployerApis(
    page: Page,
    {
        vacancies,
        analyticsByVacancy,
    }: {
        vacancies: MockVacancy[];
        analyticsByVacancy: Record<string, MockAnalytics>;
    },
) {
    // /api/employer/verify (POST) → werkgever-sessie
    await page.route('**/api/employer/verify', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                employer: { companyName: 'Test Bedrijf', plan: 'basic' },
            }),
        });
    });

    // /api/employer/vacancies (GET) → vacaturelijst
    await page.route('**/api/employer/vacancies', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: vacancies }),
        });
    });

    // /api/employer/vacancies/{id}/analytics (GET) → per-vacature stats
    await page.route('**/api/employer/vacancies/*/analytics', async (route) => {
        const url = route.request().url();
        const match = url.match(/\/vacancies\/([^/]+)\/analytics/);
        const vacancyId = match?.[1] || '';
        const stats = analyticsByVacancy[vacancyId] || {
            vacancyId,
            presented: 0,
            viewed: 0,
            contactRequested: 0,
            rejected: 0,
        };
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                vacancy: { _id: vacancyId, title: 'Mock' },
                stats: {
                    viewCount: stats.viewCount ?? 0,
                    applicationCount: stats.applicationCount ?? 0,
                    curatedTotal:
                        (stats.presented ?? 0) +
                        (stats.viewed ?? 0) +
                        (stats.contactRequested ?? 0) +
                        (stats.rejected ?? 0),
                    presented: stats.presented ?? 0,
                    viewed: stats.viewed ?? 0,
                    contactRequested: stats.contactRequested ?? 0,
                    rejected: stats.rejected ?? 0,
                    jobseekerMatchCount: stats.jobseekerMatchCount ?? 0,
                },
                recentMatchEvents: [],
            }),
        });
    });

    // Curated-matches fetch (alleen geraakt bij uitklappen) — leeg
    await page.route('**/api/employer/vacancies/*/curated-matches', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, matches: [] }),
        });
    });
}

function vacancy(id: string, title: string): MockVacancy {
    return {
        _id: id,
        title,
        company: 'Test Bedrijf',
        location: 'Paramaribo',
        createdAt: new Date('2026-05-10T10:00:00Z').toISOString(),
        isActive: true,
        source: 'employer',
    };
}

test.describe('Employer dashboard — nieuwe-matches badge', () => {
    test('toont globale pill + per-rij badge bij presented matches', async ({ page }) => {
        await seedEmployerSession(page);
        await mockEmployerApis(page, {
            vacancies: [vacancy('v1', 'Senior Developer')],
            analyticsByVacancy: {
                v1: { vacancyId: 'v1', presented: 3 },
            },
        });

        await page.goto('/dashboard/company');

        // Header globale pill
        const globalPill = page.getByRole('link', { name: /3 nieuw.*match/i });
        await expect(globalPill).toBeVisible();

        // Per-rij badge in vacaturekop
        const rowBadge = page.locator('#vacancy-v1').getByText(/3 nieuw.*match/i);
        await expect(rowBadge).toBeVisible();
    });

    test('geen badge bij 0 presented matches', async ({ page }) => {
        await seedEmployerSession(page);
        await mockEmployerApis(page, {
            vacancies: [vacancy('v1', 'Senior Developer')],
            analyticsByVacancy: {
                v1: { vacancyId: 'v1', presented: 0, viewed: 2 },
            },
        });

        await page.goto('/dashboard/company');

        // Wachten tot de vacaturerij gerenderd is (analytics call afgerond)
        await expect(page.locator('#vacancy-v1')).toBeVisible();
        await page.waitForTimeout(300);

        // Geen globale pill (link met "N nieuw(e) match...") en geen rij-badge
        await expect(page.getByRole('link', { name: /\d+\s+nieuw.*match/i })).toHaveCount(0);
        await expect(page.locator('#vacancy-v1').getByText(/\d+\s+nieuw.*match/i)).toHaveCount(0);
    });

    test('telt presented matches op over meerdere vacatures', async ({ page }) => {
        await seedEmployerSession(page);
        await mockEmployerApis(page, {
            vacancies: [vacancy('v1', 'Senior Developer'), vacancy('v2', 'Marketing Lead')],
            analyticsByVacancy: {
                v1: { vacancyId: 'v1', presented: 2 },
                v2: { vacancyId: 'v2', presented: 1 },
            },
        });

        await page.goto('/dashboard/company');

        const globalPill = page.getByRole('link', { name: /3 nieuw.*match/i });
        await expect(globalPill).toBeVisible();

        await expect(page.locator('#vacancy-v1').getByText(/2 nieuw.*match/i)).toBeVisible();
        await expect(page.locator('#vacancy-v2').getByText(/1 nieuw.*match/i)).toBeVisible();
    });

    test('globale pill scrollt naar eerste vacature met nieuwe matches', async ({ page }) => {
        await seedEmployerSession(page);
        await mockEmployerApis(page, {
            vacancies: [
                vacancy('v1', 'Geen Nieuwe'),
                vacancy('v2', 'Wel Nieuwe'),
            ],
            analyticsByVacancy: {
                v1: { vacancyId: 'v1', presented: 0 },
                v2: { vacancyId: 'v2', presented: 1 },
            },
        });

        await page.setViewportSize({ width: 1280, height: 600 });
        await page.goto('/dashboard/company');

        const pill = page.getByRole('link', { name: /1 nieuw.*match/i });
        await expect(pill).toBeVisible();

        // Forceer dat target onder de fold zit door verticale ruimte te tellen
        // — bij 600px hoogte staat de tweede vacaturerij (na hero + form) niet
        // bovenaan, dus we kunnen scroll meten.
        const beforeY = await page.evaluate(() => window.scrollY);
        await pill.click();
        await page.waitForFunction((y) => window.scrollY !== y, beforeY, { timeout: 2000 });
        const afterY = await page.evaluate(() => window.scrollY);
        expect(afterY).toBeGreaterThan(beforeY);
    });
});
