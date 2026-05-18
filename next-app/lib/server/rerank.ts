// Cohere Rerank v3.5 — cross-encoder reranking als tweede fase na de
// embedding-shortlist. Veel scherper dan rauwe cosine omdat het model
// query en document samen ziet en op semantische relevantie scoort
// in plaats van afstand-in-embedding-ruimte.
//
// Pricing (jan 2026): $2 per 1000 search-units; 1 unit = max 100 docs
// per query. Voor onze schaal (~50 docs per rerank-call) blijft het ver
// onder de cent per call.

const COHERE_RERANK_URL = 'https://api.cohere.com/v2/rerank';
const RERANK_MODEL = 'rerank-v3.5';

// Truncatie per doc (chars). Houdt kosten voorspelbaar en past binnen
// Cohere's tokens-per-doc limiet. Verzekerings-CVs en vacatures passen
// hier ruim in voor de relevante velden.
const MAX_DOC_CHARS = 2500;
const MAX_QUERY_CHARS = 2500;

export interface RerankInput {
    id: string;
    text: string;
}

export interface RerankResult {
    id: string;
    relevanceScore: number; // 0-1
    rank: number; // 0-based positie in rerank-output
}

interface CohereRerankResponse {
    id?: string;
    results: Array<{ index: number; relevance_score: number }>;
    meta?: { billed_units?: { search_units?: number } };
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max);
}

export function isRerankConfigured(): boolean {
    return Boolean(process.env.COHERE_API_KEY);
}

/**
 * Rerankt documenten t.o.v. een query. Retourneert de top-N met
 * relevance-scores (0..1, hoger = beter). Bij netwerkfout, missende
 * API-key of API-fout: returnt null zodat de caller kan terugvallen
 * op embedding-volgorde.
 */
export async function rerank(
    query: string,
    documents: RerankInput[],
    topN: number,
): Promise<RerankResult[] | null> {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
        console.warn('Cohere rerank: COHERE_API_KEY niet geconfigureerd — skip rerank');
        return null;
    }
    if (documents.length === 0) return [];

    const truncatedQuery = truncate(query, MAX_QUERY_CHARS);
    const docs = documents.map(d => truncate(d.text, MAX_DOC_CHARS));

    try {
        const res = await fetch(COHERE_RERANK_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: RERANK_MODEL,
                query: truncatedQuery,
                documents: docs,
                top_n: Math.min(topN, documents.length),
                return_documents: false,
            }),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`Cohere rerank ${res.status}:`, errText.slice(0, 200));
            return null;
        }

        const data = (await res.json()) as CohereRerankResponse;
        return data.results.map((r, rank) => ({
            id: documents[r.index].id,
            relevanceScore: r.relevance_score,
            rank,
        }));
    } catch (err) {
        console.error('Cohere rerank fetch failed:', err instanceof Error ? err.message : err);
        return null;
    }
}
