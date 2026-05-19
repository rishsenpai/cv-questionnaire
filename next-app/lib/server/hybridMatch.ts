// Hybrid retrieval: combineert cosine-similarity (embeddings) en BM25
// (MongoDB $text full-text search) via Reciprocal Rank Fusion (RRF).
//
// Waarom RRF: rauwe scores van twee verschillende systemen zijn niet
// vergelijkbaar (cosine 0-1, BM25 0-25+). RRF gebruikt alleen rank-
// positie: voor elke gerangschikte lijst krijgt een doc 1/(k+rank).
// Documenten die in beide lijsten staan winnen automatisch zonder dat
// we score-normalisatie hoeven te tunen. k=60 is industry-default.

import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';

const RRF_K = 60;

export interface RankedDoc {
    id: string;
    score: number;
}

/**
 * Reciprocal Rank Fusion: combineert N gerankte lijsten tot één
 * fused-score-map. Documenten met betere rank in meer lijsten winnen.
 */
export function rrf(rankings: RankedDoc[][], k = RRF_K): Map<string, number> {
    const fused = new Map<string, number>();
    for (const ranking of rankings) {
        ranking.forEach((doc, idx) => {
            const rank = idx + 1; // 1-indexed
            const contribution = 1 / (k + rank);
            fused.set(doc.id, (fused.get(doc.id) || 0) + contribution);
        });
    }
    return fused;
}

/**
 * Bouwt een zoekstring voor MongoDB $text. Verwijdert te-korte/ruis-
 * tokens. MongoDB tokenizeert zelf op whitespace en punctuation; wij
 * hoeven alleen ruis weg te halen zodat de query niet uit boilerplate
 * woorden bestaat.
 */
const STOPWORDS = new Set([
    'de', 'het', 'een', 'en', 'of', 'is', 'in', 'op', 'voor', 'aan', 'te', 'bij',
    'met', 'door', 'naar', 'om', 'als', 'dat', 'die', 'dit', 'deze', 'er',
    'we', 'je', 'jij', 'u', 'wij', 'ik', 'hij', 'zij', 'ze', 'zo', 'ook',
    'kan', 'kun', 'kunt', 'wordt', 'worden', 'zal', 'zou', 'heeft', 'hebben',
    'the', 'a', 'an', 'and', 'or', 'is', 'in', 'on', 'for', 'at', 'to', 'with',
    'by', 'from', 'as', 'that', 'this', 'these', 'those', 'be', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
]);

export function buildSearchQuery(text: string, maxTokens = 100): string {
    const tokens = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 3 && !STOPWORDS.has(t));
    // Dedupe terwijl we volgorde behouden — eerste voorkomen wint.
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const t of tokens) {
        if (!seen.has(t)) {
            seen.add(t);
            unique.push(t);
        }
        if (unique.length >= maxTokens) break;
    }
    return unique.join(' ');
}

/**
 * BM25 search over CV-collectie. Retourneert top-N CV ids op text-score
 * gerangschikt. Met aanvullende filter-criteria (isInternal etc) zodat
 * dit naadloos in de bestaande match-pipelines past.
 */
export async function bm25SearchCVs(
    queryText: string,
    limit: number,
    extraFilter: Record<string, unknown> = {},
): Promise<RankedDoc[]> {
    const cleanQuery = buildSearchQuery(queryText);
    if (!cleanQuery) return [];

    try {
        const results = await CV.find(
            { $text: { $search: cleanQuery }, ...extraFilter },
            { score: { $meta: 'textScore' } },
        )
            .select('_id')
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();
        return results.map(r => ({
            id: String(r._id),
            score: (r as unknown as { score?: number }).score || 0,
        }));
    } catch (err) {
        console.error('bm25SearchCVs failed:', err instanceof Error ? err.message : err);
        return [];
    }
}

/**
 * BM25 search over Vacancy-collectie. Spiegel van bm25SearchCVs.
 */
export async function bm25SearchVacancies(
    queryText: string,
    limit: number,
    extraFilter: Record<string, unknown> = {},
): Promise<RankedDoc[]> {
    const cleanQuery = buildSearchQuery(queryText);
    if (!cleanQuery) return [];

    try {
        const results = await Vacancy.find(
            { $text: { $search: cleanQuery }, ...extraFilter },
            { score: { $meta: 'textScore' } },
        )
            .select('_id')
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();
        return results.map(r => ({
            id: String(r._id),
            score: (r as unknown as { score?: number }).score || 0,
        }));
    } catch (err) {
        console.error('bm25SearchVacancies failed:', err instanceof Error ? err.message : err);
        return [];
    }
}

/**
 * Hybrid retrieve: combineert een al-bekende cosine-ranking met een
 * verse BM25-ranking via RRF. Retourneert de top-N gefuseerde docs.
 *
 * @param cosineRanking — al gesorteerde lijst van cosine-resultaten
 * @param bm25Ranking — al gesorteerde lijst van BM25-resultaten
 * @param topN — hoeveel docs als output
 */
export function hybridFuse(
    cosineRanking: RankedDoc[],
    bm25Ranking: RankedDoc[],
    topN: number,
): RankedDoc[] {
    const fused = rrf([cosineRanking, bm25Ranking]);
    return Array.from(fused.entries())
        .map(([id, score]) => ({ id, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}
