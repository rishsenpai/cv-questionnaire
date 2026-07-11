import { test, expect, Page } from '@playwright/test';

// Mobiele weergave van vacaturekaarten (screenshot-feedback 11-7): de metaregel
// (locatie · salaris · dienstverband) liep uit de kaart omdat de contentkolom
// in de gestapelde layout zijn natuurlijke breedte pakte i.p.v. de kaartbreedte.
// Deze tests borgen: geen horizontale overflow en het dienstverband-label
// volledig binnen het scherm, op homepage én /vacatures.

const VACANCIES = [
    {
        _id: 'v1',
        title: 'Shop Assistant',
        location: 'Georgetown, Guyana',
        employmentType: 'FULL-TIME',
        viaJobParsing: false,
        company: 'Winkel NV',
    },
    {
        _id: 'v2',
        title: 'Executive Assistant met een hele lange functietitel erbij',
        location: 'Paramaribo, Suriname',
        employmentType: 'FULL-TIME',
        salary: { min: 15000, max: 25000, currency: 'SRD' },
        viaJobParsing: true,
    },
];

async function mockApis(page: Page) {
    await page.route('**/api/analytics/track', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/geo', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, countryCode: 'SR' }) }));
    await page.route('**/api/vacancies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, vacancies: VACANCIES }) }));
}

async function expectNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('Mobiel — vacaturekaarten', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('homepage: kaart-metaregel blijft binnen het scherm', async ({ page }) => {
        await mockApis(page);
        await page.goto('/');
        // Wacht tot de kaarten geladen zijn
        await expect(page.getByText(/executive assistant/i).first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
        // Het dienstverband-label staat volledig binnen de viewport
        const typeLabel = page.getByText('Full-time', { exact: true }).first();
        await expect(typeLabel).toBeVisible();
        const box = await typeLabel.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    });

    test('AI Career Scout: fullscreen chat met invoer onderaan het scherm', async ({ page }) => {
        await mockApis(page);
        await page.goto('/');
        await page.getByRole('button', { name: /ask ai scout/i }).click();

        // Chatvenster vult het scherm en de invoerbalk zit onderaan (geen dode
        // witruimte meer door de oude max-h-cap op het berichtenvak).
        const inputField = page.getByPlaceholder(/stel je vraag/i);
        await expect(inputField).toBeVisible();
        const box = await inputField.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y + box!.height).toBeGreaterThan(700);
        await expectNoHorizontalOverflow(page);

        // Invoer heeft 16px tekst zodat iOS niet inzoomt bij focus.
        const fontSize = await inputField.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        expect(fontSize).toBeGreaterThanOrEqual(16);

        // Chatten werkt: hint versturen levert een antwoord van de scout op.
        await page.getByRole('button', { name: 'Check mijn CV', exact: true }).click();
        await expect(page.getByText(/cv check/i)).toBeVisible();

        // Body-scroll is vergrendeld zolang de chat open is, en komt daarna terug.
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
        await page.getByRole('button', { name: /sluit career scout/i }).click();
        await expect(inputField).not.toBeVisible();
        expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    });

    test('/vacatures: kaarten zonder horizontale overflow', async ({ page }) => {
        await mockApis(page);
        await page.goto('/vacatures');
        await expect(page.getByRole('link', { name: /executive assistant/i })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        // Salaris + locatie metadata volledig binnen de viewport
        const salary = page.getByText(/SRD 15\.000-25\.000/).first();
        await expect(salary).toBeVisible();
        const box = await salary.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    });
});
