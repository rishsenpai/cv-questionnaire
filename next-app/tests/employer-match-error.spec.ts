import { test, expect, Page } from '@playwright/test';

// Reproductie + fix voor de bug op /voor-werkgevers:
// "Unexpected token '<', "<!DOCTYPE "... is not valid JSON".
//
// Oorzaak: de client deed res.json() zonder te controleren of het antwoord
// wél JSON is. Als de serverless functie in productie time-out of crasht,
// stuurt Vercel een HTML-foutpagina (504/500) terug — res.json() gooit dan
// een parse-error die letterlijk in de UI werd getoond.
//
// We mocken het endpoint met een HTML-foutpagina (net als Vercel bij een
// timeout) en verwachten dat de gebruiker een leesbare melding krijgt,
// niet de rauwe "Unexpected token"-fout.

const VERCEL_TIMEOUT_HTML =
    '<!DOCTYPE html><html><head><title>504: Gateway Timeout</title></head>' +
    '<body><h1>504</h1><p>This Serverless Function has timed out.</p></body></html>';

async function fillEmployerForm(page: Page) {
    await page.goto('/voor-werkgevers');
    await page.getByPlaceholder(/plak hier de volledige vacaturetekst/i).fill(
        'Wij zoeken een ervaren Data Engineer met Python, SQL en cloud. Standplaats Paramaribo.',
    );
    await page.getByPlaceholder(/naam@bedrijf\.com/i).fill('test@gmail.com');
}

test.describe('voor-werkgevers — niet-JSON foutafhandeling', () => {
    test('toont leesbare melding wanneer de API een HTML-foutpagina teruggeeft (geen "Unexpected token")', async ({ page }) => {
        await page.route('**/api/employer-public/match-vacancy', async (route) => {
            await route.fulfill({
                status: 504,
                contentType: 'text/html',
                body: VERCEL_TIMEOUT_HTML,
            });
        });

        await fillEmployerForm(page);
        await page.getByRole('button', { name: /vind matches/i }).click();

        // De rauwe parse-fout mag NIET zichtbaar zijn.
        await expect(page.getByText(/unexpected token/i)).toHaveCount(0);
        await expect(page.getByText(/is not valid json/i)).toHaveCount(0);
        await expect(page.getByText(/<!doctype/i)).toHaveCount(0);

        // Er moet wél een begrijpelijke foutmelding staan (504 → "te druk").
        await expect(
          page.getByText(/te druk|duurde te lang|probeer het.*opnieuw|later opnieuw/i),
        ).toBeVisible();
    });

    test('snel zoeken toont ook leesbare melding bij HTML-fout', async ({ page }) => {
        await page.route('**/api/employer-public/search-cvs**', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'text/html',
                body: VERCEL_TIMEOUT_HTML,
            });
        });

        await page.goto('/voor-werkgevers');
        await page.getByPlaceholder(/software developer/i).fill('data engineer');
        await page.getByRole('button', { name: /^zoeken$/i }).click();

        await expect(page.getByText(/unexpected token/i)).toHaveCount(0);
        await expect(page.getByText(/is not valid json/i)).toHaveCount(0);
    });
});
