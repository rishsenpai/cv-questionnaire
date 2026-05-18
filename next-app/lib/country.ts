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

// Sterke NL-signalen uit beschrijvingstekst die niet voorkomen op andere
// markten. WFT = Wet Financieel Toezicht, een NL-specifieke regeling.
const NL_STRONG_SIGNALS = /\b(wft\s*basis|wft\s*schade|wft\s*leven|wft\s*hypotheek|cao\s+(?:nederland|nl)|aow|kvk[- ]?nummer)\b/i;

function inferFromText(text: string): Country | undefined {
    const lower = text.toLowerCase();
    // Volgorde: kleinere landen eerst (Guyana, Suriname) zodat
    // "New Amsterdam, Guyana" niet als NL gedetecteerd wordt.
    for (const country of ['guyana', 'suriname', 'netherlands'] as Country[]) {
        for (const keyword of COUNTRY_KEYWORDS[country]) {
            if (lower.includes(keyword)) return country;
        }
    }
    if (NL_POSTCODE.test(text)) return 'netherlands';
    return undefined;
}

/**
 * Bepaal het land op basis van vrije tekst. Probeert eerst de location
 * (meest specifiek), en valt terug op een bredere beschrijvingstekst als
 * dat geen resultaat oplevert. Voor de beschrijvings-fallback gelden
 * dezelfde keywords plus enkele NL-specifieke signalen (WFT-diploma's,
 * AOW, KvK) die zelden in Suriname-/Guyana-vacatures voorkomen.
 */
export function inferCountry(location?: string | null, fallbackText?: string | null): Country | undefined {
    if (location) {
        const fromLocation = inferFromText(location);
        if (fromLocation) return fromLocation;
    }
    if (fallbackText) {
        const fromText = inferFromText(fallbackText);
        if (fromText) return fromText;
        if (NL_STRONG_SIGNALS.test(fallbackText)) return 'netherlands';
    }
    return undefined;
}
