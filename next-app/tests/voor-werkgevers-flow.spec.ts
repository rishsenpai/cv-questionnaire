import { test, expect, Page } from '@playwright/test';

// Werkgever-hoofdflow op /voor-werkgevers:
//  1. Snel zoeken op trefwoord → geanonimiseerde kandidaten → contact-modal.
//  2. Volledige vacaturetekst plakken → matches → aanvraag opgeslagen → contact.
// Alle API's gemockt met page.route (geen DB/OpenAI).

const QUICK_MATCHES = [
    { id: 'aaa111bbb222', jobTitle: 'Data Engineer', location: 'Paramaribo', summary: 'Ervaren data engineer.', topSkills: ['Python', 'SQL', 'Spark'], matchScore: 74 },
    { id: 'ccc333ddd444', jobTitle: 'Backend Developer', location: 'Nickerie', summary: 'API-specialist.', topSkills: ['Node.js', 'Postgres'], matchScore: 51 },
];

const VACANCY_MATCHES = [
    { id: 'eee555fff666', jobTitle: 'Data Engineer', location: 'Paramaribo', summary: 'Ervaren data engineer met cloud-ervaring.', topSkills: ['Python', 'SQL', 'Docker'], matchScore: 82, matchedTerms: ['python', 'sql'] },
];

async function mockAnalytics(page: Page) {
    await page.route('**/api/analytics/track', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
}

test.describe('Werkgever — publieke matching tool', () => {
    test('snel zoeken toont kandidaten en opent contact-modal', async ({ page }) => {
        await mockAnalytics(page);
        await page.route('**/api/employer-public/search-cvs**', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, query: 'data engineer', totalCvs: 120, matches: QUICK_MATCHES }),
            }));

        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/software developer/i).fill('data engineer');
        await page.getByRole('button', { name: /^zoeken$/i }).click();

        await expect(page.getByText(/2 kandidaten gevonden/i)).toBeVisible();
        await expect(page.getByText('Data Engineer').first()).toBeVisible();

        // Klik op een kandidaat → contact-modal met bel/mail.
        await page.getByRole('button', { name: /data engineer/i }).first().click();
        await expect(page.getByText(/kandidaat aanvragen/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /bel/i })).toBeVisible();
        await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
    });

    test('vacaturetekst plakken → matches + aanvraag opgeslagen', async ({ page }) => {
        await mockAnalytics(page);
        await page.route('**/api/employer-public/match-vacancy', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    leadId: 'lead789',
                    vacancyTitle: 'Data Engineer',
                    totalCvs: 120,
                    matches: VACANCY_MATCHES,
                    terms: ['python', 'sql', 'docker'],
                }),
            }));

        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/plak hier de volledige vacaturetekst/i).fill(
            'Wij zoeken een ervaren Data Engineer met Python, SQL en Docker. Standplaats Paramaribo.',
        );
        await page.getByPlaceholder(/naam@bedrijf\.com/i).fill('werkgever@bedrijf.com');
        await page.getByRole('button', { name: /vind matches/i }).click();

        await expect(page.getByText(/aanvraag opgeslagen/i)).toBeVisible();
        await expect(page.getByRole('heading', { name: /1 kandidaten gevonden/i })).toBeVisible();
        await expect(page.getByText('82%')).toBeVisible();

        // Contact opnemen opent de modal.
        await page.getByRole('button', { name: /neem contact op/i }).first().click();
        await expect(page.getByText(/kandidaat aanvragen/i)).toBeVisible();
    });

    test('lege zoekterm geeft nette melding, geen crash', async ({ page }) => {
        await mockAnalytics(page);
        await page.goto('/voor-werkgevers');
        await page.getByRole('button', { name: /^zoeken$/i }).click();
        await expect(page.getByText(/geef een zoekterm op/i)).toBeVisible();
    });
});

test.describe('Werkgever — publieke tool edge cases', () => {
    test('vacature met 0 matches: "geen matches" + aanvraag toch opgeslagen', async ({ page }) => {
        await mockAnalytics(page);
        await page.route('**/api/employer-public/match-vacancy', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, leadId: 'lead0', vacancyTitle: 'X', totalCvs: 120, matches: [], terms: [] }),
            }));
        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/plak hier de volledige vacaturetekst/i).fill(
            'Zeer niche vacature waarvoor we geen kandidaten verwachten in de database.',
        );
        await page.getByPlaceholder(/naam@bedrijf\.com/i).fill('werkgever@bedrijf.com');
        await page.getByRole('button', { name: /vind matches/i }).click();

        await expect(page.getByRole('heading', { name: /geen matches gevonden/i })).toBeVisible();
        await expect(page.getByText(/aanvraag opgeslagen/i).first()).toBeVisible();
    });

    test('zonder e-mail én telefoon wordt verzenden geblokkeerd (client-side)', async ({ page }) => {
        await mockAnalytics(page);
        let called = false;
        await page.route('**/api/employer-public/match-vacancy', route => { called = true; return route.abort(); });
        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/plak hier de volledige vacaturetekst/i).fill(
            'Wij zoeken een Data Engineer met Python en SQL. Standplaats Paramaribo.',
        );
        await page.getByRole('button', { name: /vind matches/i }).click();
        await expect(page.getByText(/vul een e-mail of telefoonnummer/i)).toBeVisible();
        expect(called).toBe(false); // geen API-call gedaan
    });

    test('snel zoeken zonder resultaten toont "geen profielen gevonden"', async ({ page }) => {
        await mockAnalytics(page);
        await page.route('**/api/employer-public/search-cvs**', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, query: 'astronaut', totalCvs: 120, matches: [] }),
            }));
        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/software developer/i).fill('astronaut');
        await page.getByRole('button', { name: /^zoeken$/i }).click();
        await expect(page.getByText(/geen profielen gevonden/i)).toBeVisible();
    });

    test('te groot bestand bij vacature-upload wordt geweigerd (client-side)', async ({ page }) => {
        await mockAnalytics(page);
        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/naam@bedrijf\.com/i).fill('werkgever@bedrijf.com');
        await page.locator('input[type=file]').setInputFiles({
            name: 'groot.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.alloc(Math.floor(4.6 * 1024 * 1024), 1),
        });
        await page.getByRole('button', { name: /vind matches/i }).click();
        await expect(page.getByText(/bestand te groot/i)).toBeVisible();
    });
});
