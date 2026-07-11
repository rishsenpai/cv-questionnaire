import { test, expect } from '@playwright/test';

// Privacyverklaring-pagina (nieuw): bereikbaar via de footer en vanuit
// artikel 9 van de algemene voorwaarden; toont de toestemmings- en
// bewaartermijntekst en een werkende contactlink.

test.describe('Privacyverklaring-pagina', () => {
    test('is bereikbaar via de footer-link op de homepage', async ({ page }) => {
        await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: [] }) }));
        await page.goto('/');
        await page.locator('footer').getByRole('link', { name: 'Privacyverklaring' }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
        await expect(page.getByRole('heading', { name: /privacy-?\s*verklaring/i })).toBeVisible();
    });

    test('toont de kernonderdelen van de verklaring', async ({ page }) => {
        await page.goto('/privacyverklaring');
        // Toestemming + doeleinden
        await expect(page.getByRole('heading', { name: /welke gegevens we verwerken/i })).toBeVisible();
        await expect(page.getByText(/uitdrukkelijk toestemming/i)).toBeVisible();
        // Bewaartermijn zonder vaste maximale zoekduur
        await expect(page.getByText(/geen vooraf vastgestelde maximale zoekduur/i)).toBeVisible();
        // Disclaimer: geen garantie op werk
        await expect(page.getByRole('heading', { name: /geen garantie op werk/i })).toBeVisible();
        // Rechten + werkende contactlink
        await expect(page.getByText(/toestemming in te trekken/i)).toBeVisible();
        await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    });

    test('artikel 9 van de algemene voorwaarden linkt naar de privacyverklaring', async ({ page }) => {
        await page.goto('/algemene-voorwaarden');
        await page.getByRole('link', { name: 'privacyverklaring' }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
        await expect(page.getByRole('heading', { name: /privacy-?\s*verklaring/i })).toBeVisible();
    });

    test('PRIVACY-link op de auth-pagina werkt', async ({ page }) => {
        await page.goto('/auth');
        await page.getByRole('link', { name: 'PRIVACY', exact: true }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
    });

    test('cv-upload toont direct een akkoord-regel met werkende privacy-link', async ({ page }) => {
        await page.goto('/cv-upload');
        await expect(page.getByText(/door je cv te uploaden ga je akkoord/i)).toBeVisible();
        await page.getByRole('link', { name: 'privacyverklaring', exact: true }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
    });

    test('voor-werkgevers toont akkoord-regel bij het matchingformulier', async ({ page }) => {
        await page.goto('/voor-werkgevers');
        await expect(page.getByText(/door je aanvraag te versturen ga je akkoord/i)).toBeVisible();
        await page.getByRole('link', { name: 'privacyverklaring', exact: true }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
    });

    test('signup toont akkoord-regel met werkende links naar voorwaarden en privacyverklaring', async ({ page }) => {
        await page.goto('/auth?signup=1');
        const consent = page.getByText(/door een account te creëren ga je akkoord/i);
        await expect(consent).toBeVisible();
        await page.getByRole('link', { name: 'privacyverklaring', exact: true }).click();
        await expect(page).toHaveURL(/\/privacyverklaring/);
        await page.goBack();
        await page.getByRole('link', { name: 'algemene voorwaarden', exact: true }).click();
        await expect(page).toHaveURL(/\/algemene-voorwaarden/);
    });
});
