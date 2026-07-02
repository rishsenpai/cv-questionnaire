// Soft-signal locatie-scoring bovenop cosine. Vergelijkt twee locatie-strings
// op city/provincie-niveau en geeft een bonus (zelfde stad/provincie) of
// penalty (verre afstand binnen hetzelfde land). Wordt niet toegepast bij
// remote vacatures.
//
// Bewust geen externe geo-API: locaties zijn vrije tekst en mensen typen
// "Rotterdam", "rotterdam, nl", "Greater Rotterdam Area" enz. — een
// lightweight token-overlap heuristiek vangt 95% van de gevallen.

export interface LocationScore {
    bonus: number; // -8 tot +12 percentage-punten
    reason: 'same-city' | 'same-region' | 'different-region' | 'unknown' | 'remote-skip';
}

// City → provincie/regio. Lowercase. Alleen de top-steden van NL en SR;
// onbekende steden vallen terug op 'unknown' (geen bonus, geen penalty).
const CITY_TO_REGION: Record<string, string> = {
    // Nederland — provincies
    amsterdam: 'noord-holland', haarlem: 'noord-holland', hilversum: 'noord-holland',
    alkmaar: 'noord-holland', zaandam: 'noord-holland', 'den helder': 'noord-holland',
    purmerend: 'noord-holland', amstelveen: 'noord-holland', hoofddorp: 'noord-holland',
    rotterdam: 'zuid-holland', 'den haag': 'zuid-holland', "'s-gravenhage": 'zuid-holland',
    leiden: 'zuid-holland', delft: 'zuid-holland', dordrecht: 'zuid-holland',
    zoetermeer: 'zuid-holland', gouda: 'zuid-holland', schiedam: 'zuid-holland',
    'capelle aan den ijssel': 'zuid-holland',
    utrecht: 'utrecht', amersfoort: 'utrecht', nieuwegein: 'utrecht',
    veenendaal: 'utrecht', zeist: 'utrecht', soesterberg: 'utrecht',
    eindhoven: 'noord-brabant', tilburg: 'noord-brabant', breda: 'noord-brabant',
    'den bosch': 'noord-brabant', "'s-hertogenbosch": 'noord-brabant',
    helmond: 'noord-brabant', oss: 'noord-brabant', roosendaal: 'noord-brabant',
    nijmegen: 'gelderland', arnhem: 'gelderland', apeldoorn: 'gelderland',
    ede: 'gelderland', doetinchem: 'gelderland', tiel: 'gelderland',
    enschede: 'overijssel', zwolle: 'overijssel', deventer: 'overijssel',
    almelo: 'overijssel', hengelo: 'overijssel',
    groningen: 'groningen', delfzijl: 'groningen',
    leeuwarden: 'friesland', drachten: 'friesland', sneek: 'friesland',
    assen: 'drenthe', emmen: 'drenthe', meppel: 'drenthe', hoogeveen: 'drenthe',
    lelystad: 'flevoland', almere: 'flevoland', dronten: 'flevoland',
    middelburg: 'zeeland', vlissingen: 'zeeland', goes: 'zeeland',
    maastricht: 'limburg', heerlen: 'limburg', venlo: 'limburg',
    roermond: 'limburg', sittard: 'limburg', weert: 'limburg',

    // Suriname — districten
    paramaribo: 'paramaribo',
    wanica: 'wanica', lelydorp: 'wanica',
    nickerie: 'nickerie', nieuw_nickerie: 'nickerie', 'nieuw nickerie': 'nickerie',
    commewijne: 'commewijne', 'nieuw amsterdam': 'commewijne',
    saramacca: 'saramacca', groningen_sr: 'saramacca',
    marowijne: 'marowijne', albina: 'marowijne', moengo: 'marowijne',
    para: 'para', onverwacht: 'para',
    brokopondo: 'brokopondo',
    sipaliwini: 'sipaliwini',
    coronie: 'coronie',

    // Guyana — regions (English names)
    georgetown: 'demerara-mahaica',
    'new amsterdam': 'east-berbice-corentyne',
    linden: 'upper-demerara-berbice',
    bartica: 'cuyuni-mazaruni',
    anna_regina: 'pomeroon-supenaam',
    'anna regina': 'pomeroon-supenaam',
};

// Ruis-tokens die we niet als city-kandidaat tellen.
const NOISE_TOKENS = new Set([
    'nl', 'netherlands', 'nederland', 'the', 'sr', 'suriname', 'gy', 'guyana',
    'and', 'or', 'of', 'in', 'at', 'on', 'het', 'de', 'van', 'der',
    'area', 'greater', 'region', 'omgeving', 'centrum', 'centre', 'center',
    'noord', 'zuid', 'oost', 'west', 'north', 'south', 'east',
    'nv', 'bv', 'hybride', 'remote', 'thuiswerk',
]);

function tokenize(loc: string): string[] {
    return loc
        .toLowerCase()
        .replace(/[,;/().]/g, ' ')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length >= 3 && !NOISE_TOKENS.has(t));
}

// Probeer city-multi-word matches eerst (bv. 'den haag', 'nieuw nickerie').
function detectCity(tokens: string[]): string | null {
    const joined = tokens.join(' ');
    for (const city of Object.keys(CITY_TO_REGION)) {
        if (city.includes(' ') && joined.includes(city)) return city;
    }
    for (const token of tokens) {
        if (CITY_TO_REGION[token]) return token;
    }
    return null;
}

/**
 * Vergelijk twee locaties. Bij vacancyIsRemote=true: geen bonus/penalty
 * (locatie is irrelevant voor matching).
 */
export function compareLocations(
    vacancyLocation: string | undefined | null,
    cvLocation: string | undefined | null,
    vacancyIsRemote = false,
): LocationScore {
    if (vacancyIsRemote) return { bonus: 0, reason: 'remote-skip' };
    if (!vacancyLocation || !cvLocation) return { bonus: 0, reason: 'unknown' };

    const vTokens = tokenize(vacancyLocation);
    const cTokens = tokenize(cvLocation);
    if (vTokens.length === 0 || cTokens.length === 0) return { bonus: 0, reason: 'unknown' };

    const vCity = detectCity(vTokens);
    const cCity = detectCity(cTokens);

    // Exacte stad-match (na normalisatie): hoogste bonus.
    if (vCity && cCity && vCity === cCity) {
        return { bonus: 12, reason: 'same-city' };
    }
    // Token-overlap als city-detectie faalde (onbekende stad).
    const tokenOverlap = vTokens.some(t => cTokens.includes(t));
    if (tokenOverlap && (!vCity || !cCity)) {
        return { bonus: 12, reason: 'same-city' };
    }

    // Zelfde provincie/regio: +6.
    if (vCity && cCity) {
        const vRegion = CITY_TO_REGION[vCity];
        const cRegion = CITY_TO_REGION[cCity];
        if (vRegion && cRegion && vRegion === cRegion) {
            return { bonus: 6, reason: 'same-region' };
        }
        // Andere provincie binnen hetzelfde land: penalty.
        if (vRegion && cRegion && vRegion !== cRegion) {
            return { bonus: -8, reason: 'different-region' };
        }
    }

    return { bonus: 0, reason: 'unknown' };
}

/**
 * Helper: pas de bonus toe op een 0-100 matchScore, geclampt naar [0,100].
 */
export function applyLocationBonus(score: number, bonus: number): number {
    return Math.max(0, Math.min(100, score + bonus));
}
