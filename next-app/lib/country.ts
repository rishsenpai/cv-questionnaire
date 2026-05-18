// Land-detectie op basis van vrije-tekst location-velden.
// Gebruikt voor matching-scope: een NL-CV moet niet als kandidaat
// verschijnen bij een Guyana-vacature, en vice versa.

export type Country = 'guyana' | 'netherlands' | 'suriname';

export const COUNTRY_LABEL: Record<Country, string> = {
    guyana: 'Guyana',
    netherlands: 'Nederland',
    suriname: 'Suriname',
};

// Trefwoorden + bekende stadsnamen per land. Volgorde maakt niet uit;
// inferCountry retourneert het eerste land dat matcht. Bij conflict
// (location bevat zowel "Suriname" als "Amsterdam") wint de meest-
// specifieke landnaam — daarom checken we eerst expliciete landnamen.
const COUNTRY_KEYWORDS: Record<Country, string[]> = {
    guyana: ['guyana', 'georgetown', 'timehri', 'linden', 'lethem', 'new amsterdam', 'bartica'],
    suriname: ['suriname', 'paramaribo', 'nickerie', 'commewijne', 'wanica', 'lelydorp', 'moengo', 'albina', 'nieuw nickerie'],
    netherlands: [
        'nederland', 'netherlands', 'holland',
        'amsterdam', 'rotterdam', 'utrecht', 'den haag', 'the hague', 'eindhoven',
        'tilburg', 'groningen', 'breda', 'nijmegen', 'apeldoorn', 'haarlem',
        'enschede', 'almere', 'arnhem', 'zaanstad', 'amersfoort', 'maastricht',
        'leiden', 'dordrecht', 'zoetermeer', 'zwolle', 'deventer', 'delft',
        'alphen aan den rijn', 'leeuwarden', 'venlo', 'hilversum',
    ],
};

// NL-postcode formaat: 4 cijfers + optionele spatie + 2 letters.
const NL_POSTCODE = /\b\d{4}\s?[A-Z]{2}\b/i;

export function inferCountry(location?: string | null): Country | undefined {
    if (!location) return undefined;
    const lower = location.toLowerCase();

    // Volgorde: kleinere landen eerst (Guyana, Suriname) zodat
    // "New Amsterdam, Guyana" niet als NL gedetecteerd wordt.
    for (const country of ['guyana', 'suriname', 'netherlands'] as Country[]) {
        for (const keyword of COUNTRY_KEYWORDS[country]) {
            if (lower.includes(keyword)) return country;
        }
    }

    if (NL_POSTCODE.test(location)) return 'netherlands';
    return undefined;
}
