import { test, expect } from '@playwright/test';
import { isHiddenVacancy, inferCountry, HIDDEN_VACANCY_COUNTRIES } from '../lib/country';

// Beleidswijziging 11-7-2026 (optie 3): NL-vacatures zijn niet langer
// server-side verborgen — iedereen kan ze zien via de landscope-toggle.
// De bescherming tegen cross-country solliciteren zit in de matching
// (land-op-land) en de geo-scope op /vacatures. Deze tests borgen dat
// niets meer verborgen wordt én dat de landdetectie zelf blijft werken
// (die drijft de matching en de geo-scope aan).

test.describe('Zichtbaarheid: geen enkel land wordt nog verborgen', () => {
    test('hidden-lijst is leeg', () => {
        expect(HIDDEN_VACANCY_COUNTRIES).toHaveLength(0);
    });

    test('NL-vacatures zijn niet langer verborgen', () => {
        expect(isHiddenVacancy({ location: 'Rotterdam, Nederland' })).toBe(false);
        expect(isHiddenVacancy({ country: 'netherlands', location: 'Onbekend' })).toBe(false);
    });

    test('Surinaamse en Guyaanse vacatures blijven zichtbaar', () => {
        expect(isHiddenVacancy({ location: 'Paramaribo' })).toBe(false);
        expect(isHiddenVacancy({ location: 'Georgetown, Guyana' })).toBe(false);
    });
});

test.describe('Landdetectie (drijft matching + geo-scope aan)', () => {
    test('NL-locatie wordt als netherlands herkend', () => {
        expect(inferCountry('Rotterdam, Nederland')).toBe('netherlands');
        expect(inferCountry('Amsterdam')).toBe('netherlands');
    });

    test('SR/GY-locaties worden correct herkend', () => {
        expect(inferCountry('Nickerie, Suriname')).toBe('suriname');
        expect(inferCountry('Georgetown, Guyana')).toBe('guyana');
        // "New Amsterdam" is Guyaans — mag niet als NL gelezen worden.
        expect(inferCountry('New Amsterdam, Guyana')).toBe('guyana');
    });

    test('niet-herkenbaar land blijft undefined (geen valse toewijzing)', () => {
        expect(inferCountry('Ergens ver weg')).toBeUndefined();
    });

    test('NL-signaal in omschrijving (WFT) wordt herkend als locatie leeg is', () => {
        expect(inferCountry('', 'Vereist: WFT Basis en WFT Schade.')).toBe('netherlands');
    });
});
