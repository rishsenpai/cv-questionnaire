import { test, expect } from '@playwright/test';

// FAQ-pagina (nieuw n.a.v. 'Contact en FAQ werken niet'): bereikbaar via de
// footer, accordion klapt open, en er staat een werkende contact-CTA.

test.describe('FAQ-pagina', () => {
    test('is bereikbaar via de footer-link', async ({ page }) => {
        await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
        await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: [] }) }));
        await page.goto('/');
        await page.locator('footer').getByRole('link', { name: 'FAQ' }).click();
        await expect(page).toHaveURL(/\/faq/);
        await expect(page.getByRole('heading', { name: /alles wat je wilt weten/i })).toBeVisible();
    });

    test('accordion opent een antwoord en toont contactopties', async ({ page }) => {
        await page.goto('/faq');
        const vraag = page.getByRole('button', { name: /moet ik een account aanmaken/i });
        await vraag.click();
        await expect(page.getByText(/zonder registratie vooraf/i)).toBeVisible();
        // Werkende contactkanalen (mailto + WhatsApp met geconfigureerd nummer).
        await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
        await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
    });
});
