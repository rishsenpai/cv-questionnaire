import { test, expect, Page } from '@playwright/test';

// Landscope op /vacatures: bezoekers uit Suriname zien standaard alleen
// Surinaamse vacatures (geo via /api/geo), met een zichtbare toggle om alle
// landen te tonen. Handmatige keuze wordt onthouden in localStorage.

const VACANCIES = [
    { _id: 'v1', title: 'Warehouse Coordinator', location: 'Paramaribo', employmentType: 'Full-time', viaJobParsing: true },
    { _id: 'v2', title: 'Offshore Engineer', location: 'Georgetown, Guyana', employmentType: 'Full-time', viaJobParsing: true },
    { _id: 'v3', title: 'Office Manager', location: '', employmentType: 'Full-time', viaJobParsing: true },
];

async function mockApis(page: Page, geoCountryCode: string | null) {
    await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: VACANCIES }) }));
    await page.route('**/api/geo', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, countryCode: geoCountryCode }) }));
}

test.describe('Geo landscope op vacatures', () => {
    test('SR-bezoeker ziet alleen Suriname (en ongelabeld), Guyana verborgen', async ({ page }) => {
        await mockApis(page, 'SR');
        await page.goto('/vacatures');
        await expect(page.getByText(/je ziet alleen vacatures in suriname/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /warehouse coordinator/i })).toBeVisible();
        // Ongelabelde vacature blijft zichtbaar (interne vacatures zonder locatie).
        await expect(page.getByRole('link', { name: /office manager/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toHaveCount(0);
    });

    test('toggle "Toon alle landen" toont ook Guyana en wordt onthouden', async ({ page }) => {
        await mockApis(page, 'SR');
        await page.goto('/vacatures');
        await page.getByRole('button', { name: /toon alle landen/i }).click();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toBeVisible();
        await expect(page.getByText(/je ziet vacatures uit alle landen/i)).toBeVisible();

        // Keuze overleeft een reload — geo (SR) mag de handmatige keuze niet overschrijven.
        await page.reload();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toBeVisible();
        // En terug naar alleen Suriname kan ook weer.
        await page.getByRole('button', { name: /toon alleen suriname/i }).click();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toHaveCount(0);
    });

    test('bezoeker buiten SR/GY ziet alles, zonder scope-banner', async ({ page }) => {
        await mockApis(page, 'US');
        await page.goto('/vacatures');
        await expect(page.getByRole('link', { name: /warehouse coordinator/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toBeVisible();
        await expect(page.getByText(/je ziet alleen vacatures in/i)).toHaveCount(0);
    });

    test('geo-API kapot → alles zichtbaar (fail-open)', async ({ page }) => {
        await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: VACANCIES }) }));
        await page.route('**/api/geo', r => r.abort());
        await page.goto('/vacatures');
        await expect(page.getByRole('link', { name: /warehouse coordinator/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /offshore engineer/i })).toBeVisible();
    });
});
