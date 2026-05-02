/**
 * Verwijder identificeerbare bedrijfs- en contactgegevens uit
 * vacaturetekst voor publieke (kandidaat-facing) endpoints.
 *
 * Aanpak voor bedrijfsnaam: tokeniseer → vervang elk distinctief
 * woord (≥3 chars, niet in stop-lijst). Daardoor wordt voor
 * "Staatsolie Maatschappij Suriname N.V." óók losse 'Staatsolie'
 * gevangen, niet alleen de complete naam.
 *
 * Imperfecte heuristiek — typefouten of variantspelling glippen
 * er soms doorheen. Voor harde anonimisering zou AI-rewrite van
 * descriptions bij import beter zijn.
 */

// Generieke woorden die geen identificerende waarde hebben en dus
// niet moeten worden vervangen (anders krijg je '[werkgever] Suriname'
// → '[werkgever] [werkgever]', wat de tekst onleesbaar maakt).
const STOP_WORDS: ReadonlySet<string> = new Set([
    // Rechtspersonen
    'nv', 'n.v', 'bv', 'b.v', 'ltd', 'inc', 'llc', 'corp', 'corporation',
    'gmbh', 'sa', 's.a', 'ag', 'plc', 'srl', 'ltda', 'co',
    // Generieke business
    'company', 'group', 'groep', 'holding', 'holdings', 'ventures',
    'partners', 'partner', 'services', 'solutions', 'consulting',
    'international', 'global', 'world', 'worldwide',
    // Land + regio (zou anders de hele tekst rood maken)
    'suriname', 'surinaamse', 'sr', 'paramaribo', 'wanica',
    'commewijne', 'nickerie', 'brokopondo', 'saramacca',
    'nederland', 'nederlandse', 'netherlands', 'dutch',
    // Connectors
    'the', 'and', 'or', 'of', 'van', 'der', 'het', 'de', 'en', 'in', 'on',
    'at', 'for', 'a', 'an',
]);

function tokenizeCompanyName(name: string): string[] {
    return name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Unicode letters/cijfers, rest weg
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

export function sanitizeJobText(text: string | undefined | null, companyName?: string | null): string {
    if (!text) return '';
    let out = String(text);

    // Bedrijfsnaam-tokens vervangen (case-insensitive, met word boundary).
    // Inclusief possessive forms ('s).
    if (companyName) {
        // Eerst de hele naam (voor gevallen waar 'm in 1 stuk staat).
        const fullName = companyName.trim();
        if (fullName.length >= 3) {
            const escapedFull = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            out = out.replace(new RegExp(escapedFull, 'gi'), '[werkgever]');
        }

        // Daarna losse tokens.
        const tokens = tokenizeCompanyName(companyName);
        for (const token of tokens) {
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // \b = word boundary; (?:[''']s|s)? vangt possessive en plural
            const re = new RegExp(`\\b${escaped}(?:[''']s|s)?\\b`, 'gi');
            out = out.replace(re, '[werkgever]');
        }

        // Collapse herhaalde [werkgever] [werkgever] → één instance
        out = out.replace(/(?:\[werkgever\][\s,.]*){2,}/g, '[werkgever] ');
    }

    // E-mailadressen
    out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[e-mail]');

    // URLs
    out = out.replace(/https?:\/\/[^\s)<>"']+/gi, '[link]');
    out = out.replace(/\bwww\.[^\s)<>"']+/gi, '[link]');

    // Telefoonnummers (8+ cijfers totaal, internationale formats)
    out = out.replace(
        /(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g,
        (match) => {
            const digits = match.replace(/\D/g, '');
            return digits.length >= 8 ? '[telefoon]' : match;
        },
    );

    return out;
}
