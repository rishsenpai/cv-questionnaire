import { test, expect } from '@playwright/test';
import { isHiddenVacancy, inferCountry } from '../lib/country';

// Pure-logic tests voor het uitsluiten van NL-vacatures (besluit Ricky 4-7-2026):
// Surinaamse kandidaten mogen NL-vacatures niet zien of matchen. Deze helper
// bepaalt of een vacature verborgen moet worden — op basis van het opgeslagen
// country-veld óf, als dat ontbreekt, afgeleid uit locatie/omschrijving.

test.describe('NL-vacatures uitsluiten', () => {
    test('NL-locatie (Rotterdam) wordt verborgen', () => {
        expect(isHiddenVacancy({ location: 'Rotterdam, Nederland' })).toBe(true);
        expect(isHiddenVacancy({ location: 'Amsterdam' })).toBe(true);
    });

    test('Surinaamse en Guyaanse vacatures blijven zichtbaar', () => {
        expect(isHiddenVacancy({ location: 'Paramaribo' })).toBe(false);
        expect(isHiddenVacancy({ location: 'Nickerie, Suriname' })).toBe(false);
        expect(isHiddenVacancy({ location: 'Georgetown, Guyana' })).toBe(false);
    });

    test('opgeslagen country=netherlands verbergt ook zonder herkenbare locatie', () => {
        expect(isHiddenVacancy({ country: 'netherlands', location: 'Onbekend' })).toBe(true);
    });

    test('niet-herkenbaar land blijft zichtbaar (geen valse NL-uitsluiting)', () => {
        expect(isHiddenVacancy({ location: 'Ergens ver weg' })).toBe(false);
        expect(inferCountry('Ergens ver weg')).toBeUndefined();
    });

    test('NL-signaal in omschrijving (WFT) wordt afgevangen als locatie leeg is', () => {
        expect(isHiddenVacancy({ location: '', description: 'Vereist: WFT Basis en WFT Schade.' })).toBe(true);
    });
});
