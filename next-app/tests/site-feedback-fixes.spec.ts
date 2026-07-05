import { test, expect, Page } from '@playwright/test';

// Regressietests voor de feedback-batch (WhatsApp-groep, 4-7-2026): dedupe
// dienstverband-filter, salaris tot 500k, WhatsApp-knop verbergen zonder
// geconfigureerd nummer, werkende districten-links, footer-links en de
// call-to-action bij lege zoekresultaten. Alle API's gemockt (geen DB).

// Mix van ruwe employmentType-waarden zoals ze uit de imports komen:
// 'FULL_TIME' (JSearch) + 'Full-time' (handmatig) moeten samensmelten tot één label.
const VACANCIES = [
    { _id: 'v1', title: 'Warehouse Coordinator', location: 'Paramaribo', employmentType: 'FULL_TIME', salary: { min: 6000, max: 9000, currency: 'SRD' }, viaJobParsing: true },
    { _id: 'v2', title: 'Sales Manager', location: 'Wanica', employmentType: 'Full-time', salary: { min: 20000, max: 40000, currency: 'SRD' }, viaJobParsing: true },
    { _id: 'v3', title: 'Merchandiser', location: 'Nickerie', employmentType: 'CONTRACT', salary: { min: 5000, max: 8000, currency: 'SRD' }, viaJobParsing: true },
    { _id: 'v4', title: 'Offshore Engineer', location: 'Paramaribo', employmentType: 'FULL-TIME', salary: { min: 3000, max: 5000, currency: 'USD' }, viaJobParsing: true },
];

async function mockVacancies(page: Page) {
    await page.route('**/api/analytics/track', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/vacancies**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: VACANCIES }) }));
}

test.describe('Vacatures — feedback fixes', () => {
    test('dienstverband-filter dedupet FULL_TIME/FULL-TIME/Full-time tot één label', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/vacatures');

        const typeSection = page.locator('aside').filter({ hasText: 'Type Dienstverband' });
        // Eén genormaliseerd 'Full-time' label (i.p.v. FULL_TIME én FULL-TIME apart).
        await expect(typeSection.getByText('Full-time', { exact: true })).toHaveCount(1);
        await expect(typeSection.getByText('Contract', { exact: true })).toHaveCount(1);
        // Ruwe enum-varianten mogen niet meer als losse opties verschijnen.
        await expect(typeSection.getByText('FULL_TIME', { exact: true })).toHaveCount(0);
        await expect(typeSection.getByText('FULL-TIME', { exact: true })).toHaveCount(0);
    });

    test('salaris-slider loopt tot SRD 500.000', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/vacatures');
        await expect(page.locator('input[type=range]')).toHaveAttribute('max', '500000');
    });

    test('WhatsApp-knop linkt naar het geconfigureerde nummer (geen placeholder)', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/vacatures');
        const wa = page.locator('a[href*="wa.me"]').first();
        await expect(wa).toBeVisible();
        // Echt nummer uit env, niet meer de dode placeholder 5971234567.
        await expect(wa).toHaveAttribute('href', /wa\.me\/31624106252/);
        await expect(page.locator('a[href*="wa.me/5971234567"]')).toHaveCount(0);
    });

    test('lege zoekresultaten tonen upload-CTA i.p.v. doodlopend scherm', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/vacatures?q=zzzgeenresultaat');
        await expect(page.getByText(/geen vacatures gevonden/i)).toBeVisible();
        await expect(page.getByText(/no worries/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /upload je cv/i })).toBeVisible();
    });

    test('district-parameter uit URL wordt toegepast op de locatiefilter', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/vacatures?location=Nickerie');
        // Alleen de Nickerie-vacature blijft over.
        await expect(page.getByRole('link', { name: /merchandiser/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /warehouse coordinator/i })).toHaveCount(0);
    });
});

test.describe('Homepage — feedback fixes', () => {
    test('districten zijn klikbare links naar de gefilterde vacaturepagina', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/');
        const districtLink = page.getByRole('link', { name: 'Paramaribo' });
        await expect(districtLink).toHaveAttribute('href', '/vacatures?location=Paramaribo');
    });

    test('footer heeft werkende contactlink en geen dode LinkedIn-tekst', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/');
        await expect(page.locator('footer a[href^="mailto:"]')).toHaveCount(1);
        // 'Nog geen LinkedIn' → dode LinkedIn-tekst is weggehaald.
        await expect(page.locator('footer').getByText('LinkedIn', { exact: true })).toHaveCount(0);
    });

    test('zoekterm van homepage komt voorgevuld + gefilterd aan op vacatures (geen dubbele invoer)', async ({ page }) => {
        await mockVacancies(page);
        await page.goto('/');
        await page.getByPlaceholder(/functie, trefwoord of bedrijf/i).fill('Sales');
        await page.getByRole('link', { name: 'Zoeken' }).click();
        await expect(page).toHaveURL(/\/vacatures\?q=Sales/);
        // Zoekveld is voorgevuld — de gebruiker hoeft niet opnieuw te typen.
        await expect(page.getByPlaceholder(/functie of bedrijf/i)).toHaveValue('Sales');
        // En de lijst is direct gefilterd op de zoekterm.
        await expect(page.getByRole('link', { name: /sales manager/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /warehouse coordinator/i })).toHaveCount(0);
    });
});
