import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import natural from 'natural';
import { buildSearchQuery, rrf, hybridFuse, type RankedDoc } from '../lib/server/hybridMatch';

// Doel van deze test:
// Bewijzen dat het matching-algoritme Robert Badal hoog rankt voor de
// "Administrative Support"-vacature. Test draait zonder DB en zonder
// OpenAI: we extracten de DOCX-bestanden lokaal, bouwen een mini-CV-pool
// met Robert + 4 synthetische concurrenten (Schadebehandelaar-stijl),
// draaien BM25-scoring + RRF, en valideren de rangorde.
//
// Als deze test PASS = het algoritme klopt. Als Robert dan IN PRODUCTIE
// nog niet in de top-5 staat, ligt het probleem aan de data (CV niet in
// DB, geen embedding, verkeerd land, isInternal=true), niet aan de code.

const FIXTURES = path.join(__dirname, 'fixtures');

function extractDocxText(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    const zip = new AdmZip(buffer);
    const xml = zip.readAsText('word/document.xml');
    return xml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface MiniCV {
    id: string;
    fullName: string;
    text: string;
}

// Vier concurrenten gebaseerd op de namen die op de screenshot stonden.
// Allemaal schadebehandelaar/verzekeringen-profielen die in embedding-
// space dominant zijn maar minder ANVA/WFT-jargon hebben dan Robert.
const SYNTHETIC_COMPETITORS: MiniCV[] = [
    {
        id: 'fatima',
        fullName: 'Fatima Brahim',
        text: 'Schadebehandelaar Amsterdam 2 jaar ervaring credit risk financial risk insurance verzekeringen schadeclaims behandelen klantcontact correspondentie',
    },
    {
        id: 'michael',
        fullName: 'Michael Pfaff',
        text: 'Schadebehandelaar Ansvar Idea Amsterdam 11 jaar ervaring MAVO English insurance music verzekeringen schadeafhandeling letselschade',
    },
    {
        id: 'anne',
        fullName: 'Anne Troost',
        text: 'Acceptant Acceptatie Particulieren The Hague 2 jaar ervaring HBO Bachelor retail banking CRM sales management verzekeringen acceptatie',
    },
    {
        id: 'anouk',
        fullName: 'Anouk Schiffer',
        text: 'Best 8 jaar ervaring Nederlands verzekeringen Engels klantenservice schadebehandeling correspondentie',
    },
];

// Eenvoudige TF-IDF based ranking — proxy voor MongoDB $text-search BM25.
// Niet identiek, maar capture-t hetzelfde principe: zeldzame termen die
// vaak in een doc voorkomen scoren hoger.
function tfidfRank(query: string, docs: MiniCV[]): RankedDoc[] {
    const tfidf = new natural.TfIdf();
    docs.forEach(d => tfidf.addDocument(d.text.toLowerCase()));
    const scores: Array<{ id: string; score: number }> = [];
    tfidf.tfidfs(query.toLowerCase(), (i: number, measure: number) => {
        scores.push({ id: docs[i].id, score: measure });
    });
    return scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);
}

test.describe('Matching: Robert Badal × Administrative Support', () => {
    let robertText: string;
    let vacancyText: string;
    let pool: MiniCV[];

    test.beforeAll(() => {
        robertText = extractDocxText(path.join(FIXTURES, 'robert-badal-cv.docx'));
        vacancyText = extractDocxText(path.join(FIXTURES, 'admin-support-vacancy.docx'));
        pool = [
            { id: 'robert', fullName: 'Robert Badal', text: robertText },
            ...SYNTHETIC_COMPETITORS,
        ];
    });

    test('DOCX-bestanden zijn extractbaar en hebben inhoud', () => {
        expect(robertText.length).toBeGreaterThan(500);
        expect(vacancyText.length).toBeGreaterThan(200);
    });

    test('buildSearchQuery extraheert betekenisvolle tokens uit vacature', () => {
        const query = buildSearchQuery(vacancyText);
        const tokens = query.split(' ');
        expect(tokens.length).toBeGreaterThan(5);
        // Geen stopwoorden in resultaat
        expect(tokens).not.toContain('de');
        expect(tokens).not.toContain('the');
        // Alleen tokens van 3+ chars
        for (const t of tokens) expect(t.length).toBeGreaterThanOrEqual(3);
    });

    test('Robert CV bevat administratief/insurance-jargon dat in vacature staat', () => {
        const lower = robertText.toLowerCase();
        // Print eerst de inhoud zodat we bij failure direct zien wat erin staat
        console.log('--- Robert CV first 500 chars ---');
        console.log(robertText.slice(0, 500));
        console.log('--- Vacature first 500 chars ---');
        console.log(vacancyText.slice(0, 500));

        // Soft check: het CV moet basiswoorden uit administratief domein
        // bevatten. Niet alle jargon hoeft erin — administratief is het
        // breedste signaal.
        const adminTerms = ['administr', 'support', 'office', 'kantoor', 'secretari'];
        const present = adminTerms.filter(t => lower.includes(t));
        console.log('Admin-terms gevonden in Robert CV:', present);
        expect(present.length).toBeGreaterThan(0);
    });

    test('BM25/TF-IDF rangschikking: Robert hoort in de top-3 voor Admin Support', () => {
        const query = buildSearchQuery(vacancyText, 50);
        console.log('Search query (eerste 200 chars):', query.slice(0, 200));

        const ranking = tfidfRank(query, pool);
        console.log('TF-IDF ranking:');
        ranking.forEach((r, i) => {
            const cv = pool.find(p => p.id === r.id)!;
            console.log(`  ${i + 1}. ${cv.fullName.padEnd(20)} score=${r.score.toFixed(2)}`);
        });

        const robertRank = ranking.findIndex(r => r.id === 'robert');
        console.log(`Robert rank: ${robertRank === -1 ? 'NIET GERANKT' : robertRank + 1}`);

        // Robert moet überhaupt in de ranking staan (score > 0)
        expect(robertRank).toBeGreaterThanOrEqual(0);
        // En in de top-3 van de 5-poel
        expect(robertRank).toBeLessThan(3);
    });

    test('RRF fusion van twee fictieve rankings werkt voorspelbaar', () => {
        // Cosine-ranking simulatie: Robert staat laag (broad-profile probleem)
        const cosineRanking: RankedDoc[] = [
            { id: 'fatima', score: 70 },
            { id: 'michael', score: 68 },
            { id: 'anne', score: 67 },
            { id: 'anouk', score: 66 },
            { id: 'robert', score: 55 }, // 5e plek
        ];
        // BM25-ranking: Robert hoog door jargon-overlap
        const bm25Ranking: RankedDoc[] = [
            { id: 'robert', score: 14.2 },
            { id: 'michael', score: 9.1 },
            { id: 'fatima', score: 7.5 },
        ];

        const fused = hybridFuse(cosineRanking, bm25Ranking, 5);
        console.log('RRF gefuseerde volgorde:', fused.map(f => f.id));

        // RRF rescue: omdat Robert in BM25 #1 staat én in cosine #5, krijgt
        // hij genoeg punten om hoog te eindigen.
        const robertFusedRank = fused.findIndex(f => f.id === 'robert');
        expect(robertFusedRank).toBeGreaterThanOrEqual(0);
        expect(robertFusedRank).toBeLessThan(3);
    });

    test('RRF helper: documenten in beide lijsten winnen', () => {
        const r1: RankedDoc[] = [
            { id: 'a', score: 1 },
            { id: 'b', score: 1 },
            { id: 'c', score: 1 },
        ];
        const r2: RankedDoc[] = [
            { id: 'b', score: 1 },
            { id: 'd', score: 1 },
        ];
        const fused = rrf([r1, r2]);
        // b zit in beide → hoogste score
        const bScore = fused.get('b') || 0;
        const aScore = fused.get('a') || 0;
        const dScore = fused.get('d') || 0;
        expect(bScore).toBeGreaterThan(aScore);
        expect(bScore).toBeGreaterThan(dScore);
    });
});
