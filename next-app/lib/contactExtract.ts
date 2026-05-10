// Helpers voor email/telefoon extractie + validatie (NL + Suriname).
// Gebruikt door zowel server (parse-cv backfill) als client (review form).

export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Patterns voor Nederlandse + Surinaamse telefoonnummers (gestript van whitespace,
// streepjes, haakjes, punten). Spiegelt tests/phone-validation.spec.js.
const NL_SR_PHONE_PATTERNS = [
    /^06\d{8}$/,                  // NL mobiel
    /^0031\d{9}$/,                // NL internationaal (00-prefix)
    /^\+31\d{9}$/,                // NL internationaal (+ prefix)
    /^31\d{9}$/,                  // NL zonder leading +
    /^0[1-9][0-9]\d{6,7}$/,       // NL vast (020, 010, 0521 ...)
    /^00597\d{6,7}$/,             // SR internationaal
    /^\+597\d{6,7}$/,
    /^597\d{6,7}$/,
    /^8[0-9]\d{5}$/,              // SR mobiel zonder landcode
];

export function stripPhone(value: string): string {
    return (value || '').replace(/[\s\-().]/g, '');
}

export function isValidNLOrSRPhone(value: string | null | undefined): boolean {
    if (!value) return false;
    const cleaned = stripPhone(String(value));
    return NL_SR_PHONE_PATTERNS.some(p => p.test(cleaned));
}

// Probeer een telefoonnummer te extraheren uit een ruwe CV-tekst. Scant op
// pluksels van 7-15 cijfers (eventueel met +, spaties, streepjes), valideert
// elke kandidaat tegen NL/SR-regels en geeft het eerste geldige terug.
export function extractPhone(text: string): string | null {
    if (!text) return null;
    // Match losse telefoon-achtige strings. Beperk tot redelijke lengtes.
    const candidates = text.match(/(\+?\d[\d\s\-().]{6,18}\d)/g) || [];
    for (const raw of candidates) {
        if (isValidNLOrSRPhone(raw)) {
            return formatPhone(raw);
        }
    }
    return null;
}

// Lichte normalisatie: verwijder excessieve whitespace, behoud + en cijfers.
// Niet aggressief — gebruikersinvoer mag visuele scheidingstekens hebben.
export function formatPhone(value: string): string {
    if (!value) return '';
    return value.replace(/\s+/g, ' ').trim();
}

export function extractEmail(text: string): string | null {
    if (!text) return null;
    const matches = text.match(EMAIL_REGEX);
    if (!matches || matches.length === 0) return null;
    // Filter obvious noise (placeholders, example domains)
    const filtered = matches.filter(m => {
        const lower = m.toLowerCase();
        return !lower.includes('example.') && !lower.includes('lorem');
    });
    return (filtered[0] || matches[0]).trim();
}

export const EMAIL_REGEX_STRICT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string | null | undefined): boolean {
    if (!value) return false;
    return EMAIL_REGEX_STRICT.test(String(value).trim());
}
