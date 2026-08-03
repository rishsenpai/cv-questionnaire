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

// Landen die NIET publiek getoond worden. Sinds 3-8-2026 is NL weer
// verborgen: NL-vacatures zijn onzichtbaar en niet-solliciteerbaar voor
// werkzoekenden (lijst, detail, matching, apply). Admin ziet alles.
export const HIDDEN_VACANCY_COUNTRIES: Country[] = ['netherlands'];

// CV-kant van hetzelfde besluit: NL-CV's worden niet aan werkgevers getoond
// (publieke matchingtool, auto-match-suggesties). Admin-schermen tonen ze wel.
export const HIDDEN_CV_COUNTRIES: Country[] = ['netherlands'];

/**
 * Mongo-filterfragment dat verborgen landen uitsluit. Vacatures zonder ingevuld
 * country-veld blijven zichtbaar ($nin matcht ook ontbrekende velden) — die
 * vangen we alsnog af met isHiddenVacancy() op basis van afgeleid land.
 */
export function visibleVacancyCountryQuery(): Record<string, unknown> {
    return HIDDEN_VACANCY_COUNTRIES.length ? { country: { $nin: HIDDEN_VACANCY_COUNTRIES } } : {};
}

/**
 * True als een vacature verborgen moet worden. Gebruikt het opgeslagen country-veld
 * en valt terug op inferCountry() zodat ook nog niet-gebackfillde vacatures correct
 * worden uitgesloten (geen operationele backfill-stap nodig).
 */
export function isHiddenVacancy(v: { country?: Country | null; location?: string | null; description?: string | null }): boolean {
    const country = v.country || inferCountry(v.location, v.description);
    return country ? HIDDEN_VACANCY_COUNTRIES.includes(country) : false;
}

/**
 * Mongo-filterfragment dat CV's uit verborgen landen uitsluit ($nin laat
 * CV's zonder country-veld door — die vangt isHiddenCv() alsnog af).
 */
export function visibleCvCountryQuery(): Record<string, unknown> {
    return HIDDEN_CV_COUNTRIES.length ? { country: { $nin: HIDDEN_CV_COUNTRIES } } : {};
}

/**
 * True als een CV verborgen moet worden voor werkgevers. Bewust alleen het
 * opgeslagen country-veld + de woonlocatie als signaal — géén fallback op
 * werkervaring/vrije tekst, want een Surinaamse kandidaat die ooit in
 * "Amsterdam" werkte zou anders onterecht als NL gefilterd worden.
 */
export function isHiddenCv(cv: { country?: Country | null; location?: string | null }): boolean {
    const country = cv.country || inferCountry(cv.location);
    return country ? HIDDEN_CV_COUNTRIES.includes(country) : false;
}
