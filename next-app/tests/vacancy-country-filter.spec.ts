import { test, expect } from '@playwright/test';
import { isHiddenVacancy, isHiddenCv, inferCountry, HIDDEN_VACANCY_COUNTRIES, HIDDEN_CV_COUNTRIES } from '../lib/country';

// Beleidswijziging 3-8-2026: NL is weer verborgen, aan beide kanten.
// NL-vacatures zijn onzichtbaar en niet-solliciteerbaar voor werkzoekenden
// (lijst, detail, matching, apply) en NL-CV's worden niet aan werkgevers
// getoond (publieke matchingtool, brede auto-match). Admin ziet alles.

test.describe('Zichtbaarheid: NL is verborgen, SR/GY blijven zichtbaar', () => {
    test('NL staat in beide hidden-lijsten', () => {
        expect(HIDDEN_VACANCY_COUNTRIES).toContain('netherlands');
        expect(HIDDEN_CV_COUNTRIES).toContain('netherlands');
    });

    test('NL-vacatures zijn verborgen (via country-veld én via locatie-inferentie)', () => {
        expect(isHiddenVacancy({ location: 'Rotterdam, Nederland' })).toBe(true);
        expect(isHiddenVacancy({ country: 'netherlands', location: 'Onbekend' })).toBe(true);
        // Zonder gebackfilld country-veld: NL-signaal in de omschrijving telt ook.
        expect(isHiddenVacancy({ location: '', description: 'Vereist: WFT Basis en WFT Schade.' })).toBe(true);
    });

    test('Surinaamse, Guyaanse en ongelabelde vacatures blijven zichtbaar', () => {
        expect(isHiddenVacancy({ location: 'Paramaribo' })).toBe(false);
        expect(isHiddenVacancy({ location: 'Georgetown, Guyana' })).toBe(false);
        expect(isHiddenVacancy({ location: '' })).toBe(false);
    });

    test('NL-CV\'s zijn verborgen voor werkgevers', () => {
        expect(isHiddenCv({ location: 'Utrecht, Nederland' })).toBe(true);
        expect(isHiddenCv({ country: 'netherlands', location: 'Onbekend' })).toBe(true);
    });

    test('SR/GY- en ongelabelde CV\'s blijven zichtbaar voor werkgevers', () => {
        expect(isHiddenCv({ location: 'Paramaribo' })).toBe(false);
        expect(isHiddenCv({ location: 'Georgetown, Guyana' })).toBe(false);
        expect(isHiddenCv({ location: '' })).toBe(false);
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
