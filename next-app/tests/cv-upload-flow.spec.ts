import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Kandidaat-hoofdflow: CV uploaden → geparste gegevens controleren →
// bevestigen → doorgestuurd naar de matches. Alle API's worden gemockt
// met page.route (geen DB, geen OpenAI) zodat de test deterministisch is
// en de UI-flow zelf test.

const FIXTURE = path.join(__dirname, 'fixtures', 'robert-badal-cv.docx');

const PARSED = {
    fullName: 'Jan de Tester',
    email: 'jan@example.com',
    phone: '0612345678',
    location: 'Paramaribo',
    birthDate: '01/01/1990',
    languages: 'Nederlands (moedertaal)',
    jobTitle: 'Software Developer',
    summary: 'Ervaren developer met 5 jaar ervaring.',
    experience: 'Software Developer bij TestCorp (2019-heden)',
    education: 'BSc Informatica',
    skills: 'JavaScript, React, Node.js',
    achievements: 'Team lead',
};

async function mockCommon(page: Page, parsed: typeof PARSED = PARSED) {
    // analytics-tracker vuurt bij page-load; mock 'm zodat er geen
    // DB-fouten in de serverlog verschijnen.
    await page.route('**/api/analytics/track', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.route('**/api/parse-cv', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: parsed, extractedTextLength: 2693 }),
        }));
    // Bestemmingspagina mag geen echte call doen.
    await page.route('**/api/cvs/*/matching-vacancies*', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, cv: { _id: 'x', fullName: parsed.fullName }, matches: [] }),
        }));
}

test.describe('Kandidaat — CV-upload flow', () => {
    test('upload → review → bevestig → matches', async ({ page }) => {
        await mockCommon(page);
        await page.route('**/api/submit-cv', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, cvId: 'cv123' }),
            }));

        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);

        // Review-scherm toont de geparste gegevens (velden vooringevuld).
        await expect(page.getByRole('heading', { name: /klopt deze info/i })).toBeVisible();
        await expect(page.locator('input[type="text"]').first()).toHaveValue('Jan de Tester');
        await expect(page.locator('input[type="email"]')).toHaveValue('jan@example.com');
        await expect(page.locator('input[type="tel"]')).toHaveValue('0612345678');
        await expect(page.locator('textarea').first()).toHaveValue(/JavaScript/);

        // Bevestigen → navigatie naar de matches van het nieuwe CV.
        await page.getByRole('button', { name: /bevestig & toon matches/i }).click();
        await expect(page).toHaveURL(/\/mijn-matches\?cvId=cv123/);
    });

    test('duplicaat CV stuurt terugkerende kandidaat tóch naar matches (regressie)', async ({ page }) => {
        await mockCommon(page);
        // Server geeft bij duplicaat nu success:true + bestaande cvId terug.
        await page.route('**/api/submit-cv', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    duplicate: true,
                    cvId: 'existing456',
                    message: 'Er bestaat al een CV met deze naam en werkervaring.',
                }),
            }));

        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await page.getByRole('button', { name: /bevestig & toon matches/i }).click();

        await expect(page).toHaveURL(/\/mijn-matches\?cvId=existing456/);
        // De oude blokkade-melding mag NIET blijven hangen op de upload-pagina.
        await expect(page.getByText(/neem contact op als je je cv wilt bijwerken/i)).toHaveCount(0);
    });

    test('ongeldige e-mail blokkeert verzenden', async ({ page }) => {
        await mockCommon(page, { ...PARSED, email: 'geen-geldig-adres' });

        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);

        await expect(page.getByRole('heading', { name: /klopt deze info/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /bevestig & toon matches/i })).toBeDisabled();
        await expect(page.getByText(/ongeldig e-mailadres/i).first()).toBeVisible();
    });

    test('niet-ondersteund bestandstype toont foutmelding', async ({ page }) => {
        await mockCommon(page);
        await page.goto('/cv-upload');
        // .txt is niet toegestaan → client weigert vóór upload.
        await page.locator('input[type=file]').setInputFiles({
            name: 'cv.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('platte tekst cv'),
        });
        await expect(page.getByText(/alleen pdf of word/i)).toBeVisible();
    });
});

test.describe('Kandidaat — CV-upload edge cases', () => {
    test('bestand groter dan 4.5 MB wordt geweigerd vóór upload', async ({ page }) => {
        await mockCommon(page);
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles({
            name: 'groot.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.alloc(Math.floor(4.6 * 1024 * 1024), 1),
        });
        await expect(page.getByText(/groter dan 4\.5 MB/i)).toBeVisible();
    });

    test('parse-cv 400 (tekst te kort) toont foutscherm met server-melding', async ({ page }) => {
        await mockCommon(page);
        await page.route('**/api/parse-cv', route =>
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, message: 'De tekst is te kort om te verwerken.' }),
            }));
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await expect(page.getByRole('heading', { name: /er ging iets mis/i })).toBeVisible();
        await expect(page.getByText(/tekst is te kort/i)).toBeVisible();
    });

    test('parse-cv geeft HTML-crash → nette melding, geen "Unexpected token"', async ({ page }) => {
        await mockCommon(page);
        await page.route('**/api/parse-cv', route =>
            route.fulfill({ status: 500, contentType: 'text/html', body: '<!DOCTYPE html><html><body>500</body></html>' }));
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await expect(page.getByText(/verbinding mislukt/i)).toBeVisible();
        await expect(page.getByText(/unexpected token/i)).toHaveCount(0);
    });

    test('lege verplichte velden na parsen → meerdere validatiefouten, knop uit', async ({ page }) => {
        await mockCommon(page, { ...PARSED, fullName: '', email: '', phone: '', jobTitle: '' });
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await expect(page.getByRole('heading', { name: /klopt deze info/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /bevestig & toon matches/i })).toBeDisabled();
        await expect(page.getByText(/naam is verplicht/i)).toBeVisible();
        await expect(page.getByText(/e-mailadres is verplicht/i)).toBeVisible();
        await expect(page.getByText(/telefoonnummer is verplicht/i)).toBeVisible();
        await expect(page.getByText(/functie is verplicht/i)).toBeVisible();
    });

    test('ongeldig veld corrigeren maakt de knop weer actief', async ({ page }) => {
        await mockCommon(page, { ...PARSED, email: 'geen-geldig-adres' });
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        const submit = page.getByRole('button', { name: /bevestig & toon matches/i });
        await expect(submit).toBeDisabled();
        // Corrigeer het e-mailveld → knop wordt actief.
        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill('jan@example.com');
        await expect(submit).toBeEnabled();
    });

    test('submit-cv 500 → terug naar review met foutmelding, geen navigatie', async ({ page }) => {
        await mockCommon(page);
        await page.route('**/api/submit-cv', route =>
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, message: 'Opslaan mislukt. Probeer het opnieuw.' }),
            }));
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await page.getByRole('button', { name: /bevestig & toon matches/i }).click();
        await expect(page.getByText(/opslaan mislukt/i)).toBeVisible();
        await expect(page).toHaveURL(/\/cv-upload/);
    });

    test('submit-cv HTML-crash → nette melding, geen "Unexpected token"', async ({ page }) => {
        await mockCommon(page);
        await page.route('**/api/submit-cv', route =>
            route.fulfill({ status: 504, contentType: 'text/html', body: '<!DOCTYPE html><html><body>504</body></html>' }));
        await page.goto('/cv-upload');
        await page.locator('input[type=file]').setInputFiles(FIXTURE);
        await page.getByRole('button', { name: /bevestig & toon matches/i }).click();
        await expect(page.getByText(/verbinding mislukt/i)).toBeVisible();
        await expect(page.getByText(/unexpected token/i)).toHaveCount(0);
    });
});
