// Auto-matcher voor net-aangemaakte werkgever-vacatures.
// Wordt fire-and-forget aangeroepen vanuit /api/employer/vacancies POST.
//
// Gebruikt altijd OpenAI embeddings (text-embedding-3-small) + cosineSimilarity.
// Schrijft top-N (default 10) als CuratedMatch met status 'suggested':
// onzichtbaar voor werkgever, admin promoot ze handmatig naar 'presented'.

import { Types } from 'mongoose';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { cosineSimilarity, generateEmbedding, prepareCVText } from './embeddings';
import { rerank, isRerankConfigured } from './rerank';
import { bm25SearchCVs, hybridFuse, type RankedDoc } from './hybridMatch';
import { compareLocations, applyLocationBonus } from './locationMatch';
import { visibleCvCountryQuery } from '@/lib/country';

// Drie-fase pipeline:
//   1a. Embedding cosine → top-100 (semantic recall)
//   1b. BM25 keyword search → top-100 (lexical recall — vangt jargon
//       zoals "ANVA", "WFT", "polismutaties" die in een broad CV niet
//       sterk doorkomen in embedding-space)
//   2.  RRF fusion → top-RERANK_INPUT_SIZE (50)
//   3.  Cohere rerank → top-TOP_N (25)
const TOP_N = 25;
const RERANK_INPUT_SIZE = 50;
const RECALL_SIZE = 100; // cosine en BM25 elk
const EMBEDDING_THRESHOLD = 0.20;
const RERANK_THRESHOLD = 0.10;

export interface AutoMatchResult {
    method: 'embedding' | 'skipped';
    suggestionsCreated: number;
    candidatesScanned: number;
    reason?: string;
}

interface VacancyDoc {
    _id: unknown;
    employerId?: unknown;
    title?: string;
    description?: string;
    requirements?: string;
    fullText?: string;
    embedding?: number[];
    location?: string;
    isRemote?: boolean;
}

interface RunAutoMatchOptions {
    // Override de country-scope (standaard = vacancy.country). Met
    // 'guyana' | 'netherlands' | 'suriname' forceer je dat land;
    // met undefined valt 't terug op vacancy.country.
    countryOverride?: 'guyana' | 'netherlands' | 'suriname';
}

export async function runAutoMatchForVacancy(
    vacancyId: string,
    options: RunAutoMatchOptions = {},
): Promise<AutoMatchResult> {
    const vacancy = await Vacancy.findById(vacancyId).select('+embedding country fulfilledAt location isRemote');
    if (!vacancy) {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'vacancy not found' };
    }
    if (vacancy.fulfilledAt) {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'vacancy fulfilled' };
    }
    // employerId is optioneel: voor admin/internal vacatures slaan we suggesties
    // op zonder werkgever-eigenaar (admin is dan zelf de "ontvanger").
    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'OPENAI_API_KEY missing' };
    }

    // Skip CVs die al gekoppeld zijn aan deze vacature
    const alreadyLinked = await CuratedMatch.find({ vacancyId }).distinct('cvId');
    const excludeSet = new Set(alreadyLinked.map(String));

    let vacEmbedding = vacancy.embedding;
    if (!vacEmbedding || vacEmbedding.length === 0) {
        const text = `${vacancy.title || ''}\n${vacancy.description || ''}\n${vacancy.requirements || ''}`;
        if (text.trim().length < 10) {
            return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'vacancy text too short' };
        }
        vacEmbedding = await generateEmbedding(text);
        await Vacancy.findByIdAndUpdate(vacancy._id, { embedding: vacEmbedding });
    }

    // Scope-bepaling: explicit override wint van vacancy.country.
    // Zonder beide matchen we breed (legacy gedrag).
    const scopeCountry = options.countryOverride || vacancy.country;
    const cvQuery: Record<string, unknown> = {
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
    };
    // Zonder scope: breed matchen, maar CV's uit verborgen landen (NL) niet
    // als suggestie opvoeren. Een expliciete scope (bv. de NL-adminflow via
    // countryOverride) wint — die suggesties blijven admin-gated.
    if (scopeCountry) cvQuery.country = scopeCountry;
    else Object.assign(cvQuery, visibleCvCountryQuery());
    const cvs = await CV.find(cvQuery).select({ embedding: 1, _id: 1 }).lean();

    // Fase 1a: cosine over ALLE in-scope CVs, met embedding-threshold.
    const cosineScored: Array<{ cvId: string; score: number }> = [];
    for (const cv of cvs) {
        const cvId = String(cv._id);
        if (excludeSet.has(cvId)) continue;
        const cvEmb = (cv as unknown as { embedding?: number[] }).embedding;
        if (!cvEmb || cvEmb.length === 0) continue;
        const sim = cosineSimilarity(vacEmbedding, cvEmb);
        if (sim >= EMBEDDING_THRESHOLD) {
            cosineScored.push({ cvId, score: Math.round(sim * 100) });
        }
    }
    cosineScored.sort((a, b) => b.score - a.score);
    const cosineRanking: RankedDoc[] = cosineScored.slice(0, RECALL_SIZE).map(s => ({ id: s.cvId, score: s.score }));

    // Fase 1b: BM25 keyword search met vacature-tekst als query. Vangt
    // jargon (ANVA, WFT, polismutaties) dat broad-profile CVs zou
    // missen in embedding-space.
    const vacancyText = [vacancy.title, vacancy.description, vacancy.requirements].filter(Boolean).join(' ');
    const bm25Filter: Record<string, unknown> = {
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
        _id: { $nin: Array.from(excludeSet).map(id => new Types.ObjectId(id)) },
    };
    if (scopeCountry) bm25Filter.country = scopeCountry;
    else Object.assign(bm25Filter, visibleCvCountryQuery());
    const bm25Ranking = await bm25SearchCVs(vacancyText, RECALL_SIZE, bm25Filter);

    // Fase 2: RRF fusie van beide rankings → top-RERANK_INPUT_SIZE.
    const fusedPool = hybridFuse(cosineRanking, bm25Ranking, RERANK_INPUT_SIZE);

    // Score-map voor de fallback bij ontbrekende rerank: cosine als bron,
    // anders een neutrale 50%. RRF-score zelf is niet geschikt om aan
    // werkgever te tonen (klein getal zoals 0.03).
    const cosineMap = new Map(cosineScored.map(s => [s.cvId, s.score]));
    const poolForRerank: Array<{ cvId: string; score: number }> = fusedPool.map(d => ({
        cvId: d.id,
        score: cosineMap.get(d.id) ?? 50,
    }));

    // Fase 3: rerank met Cohere als de key geconfigureerd is.
    // Bij ontbrekende key of API-fout vallen we terug op de gefuseerde volgorde.
    const rerankedTop = (await rerankCandidates(vacancy, poolForRerank)) ?? poolForRerank.slice(0, TOP_N);

    // Fase 4: locatie-signal als soft bonus/penalty op final score.
    // CV-locaties ophalen voor de top-N en bonus toepassen — herrangschikt
    // de lijst zodat fysiek dichter-bij kandidaten hoger uitkomen.
    const top = await applyLocationSignal(vacancy as VacancyDoc, rerankedTop);

    const created = await persistSuggestions(vacancy as VacancyDoc, top);
    return { method: 'embedding', suggestionsCreated: created, candidatesScanned: cvs.length };
}

// Past de locatie-bonus toe op een gerankte pool en sorteert opnieuw.
async function applyLocationSignal(
    vacancy: VacancyDoc,
    pool: Array<{ cvId: string; score: number }>,
): Promise<Array<{ cvId: string; score: number }>> {
    if (pool.length === 0) return pool;
    if (vacancy.isRemote) return pool; // remote = locatie irrelevant
    if (!vacancy.location) return pool;

    const cvIds = pool.map(p => new Types.ObjectId(p.cvId));
    const cvLocs = await CV.find({ _id: { $in: cvIds } }).select('_id location').lean();
    const locMap = new Map<string, string | undefined>();
    for (const cv of cvLocs) {
        locMap.set(String(cv._id), cv.location);
    }

    return pool
        .map(p => {
            const cvLoc = locMap.get(p.cvId);
            const { bonus } = compareLocations(vacancy.location, cvLoc, false);
            return { cvId: p.cvId, score: applyLocationBonus(p.score, bonus) };
        })
        .sort((a, b) => b.score - a.score);
}

// Tweede-fase reranking: query = vacancy-tekst, docs = CV-tekst.
// Retourneert null als rerank niet beschikbaar is zodat caller terugvalt.
async function rerankCandidates(
    vacancy: { title?: string; description?: string; requirements?: string },
    pool: Array<{ cvId: string; score: number }>,
): Promise<Array<{ cvId: string; score: number }> | null> {
    if (!isRerankConfigured() || pool.length === 0) return null;

    // Tekst van de top-50 CVs ophalen (alleen text-velden, geen embedding).
    const cvIds = pool.map(p => new Types.ObjectId(p.cvId));
    const cvTexts = await CV.find({ _id: { $in: cvIds } })
        .select('_id jobTitle skills experience education languages summary')
        .lean();
    const textMap = new Map<string, string>();
    for (const cv of cvTexts) {
        textMap.set(String(cv._id), prepareCVText(cv));
    }
    const docs = pool
        .map(p => ({ id: p.cvId, text: textMap.get(p.cvId) || '' }))
        .filter(d => d.text.length > 0);
    if (docs.length === 0) return null;

    const vacancyText = [vacancy.title, vacancy.description, vacancy.requirements]
        .filter(Boolean)
        .join('\n\n');
    const reranked = await rerank(vacancyText, docs, TOP_N);
    if (!reranked) return null;

    return reranked
        .filter(r => r.relevanceScore >= RERANK_THRESHOLD)
        .map(r => ({ cvId: r.id, score: Math.round(r.relevanceScore * 100) }));
}

async function persistSuggestions(
    vacancy: VacancyDoc,
    top: Array<{ cvId: string; score: number }>,
): Promise<number> {
    if (top.length === 0) return 0;
    // bulkWrite met upsert is idempotent: nieuwe pairs worden geïnsert,
    // bestaande (vacancyId+cvId) krijgen een score-update zonder dup-key error.
    // Per-doc try/catch + console.error zodat eventuele schema/cast/validation
    // problemen zichtbaar zijn in Vercel logs i.p.v. stil 0 te retourneren.
    const vacancyObjectId = vacancy._id as Types.ObjectId;
    const employerObjectId = vacancy.employerId as Types.ObjectId | undefined;
    let upserted = 0;
    let modified = 0;
    const errors: string[] = [];
    for (const t of top) {
        let cvObjectId: Types.ObjectId;
        try {
            cvObjectId = new Types.ObjectId(t.cvId);
        } catch (err) {
            errors.push(`invalid cvId ${t.cvId}: ${err instanceof Error ? err.message : String(err)}`);
            continue;
        }
        try {
            const res = await CuratedMatch.updateOne(
                { vacancyId: vacancyObjectId, cvId: cvObjectId },
                {
                    $setOnInsert: {
                        vacancyId: vacancyObjectId,
                        cvId: cvObjectId,
                        ...(employerObjectId ? { employerId: employerObjectId } : {}),
                        status: 'suggested',
                        source: 'auto-embedding',
                        addedAt: new Date(),
                    },
                    $set: { matchScore: t.score },
                },
                { upsert: true },
            );
            if (res.upsertedCount > 0) upserted++;
            else if (res.modifiedCount > 0) modified++;
        } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err));
        }
    }
    if (errors.length > 0) {
        console.error(`persistSuggestions errors for vacancy ${String(vacancyObjectId)}: ${errors.length} failed (${errors.slice(0, 3).join(' | ')})`);
    }
    console.log(`persistSuggestions vacancy ${String(vacancyObjectId)}: ${upserted} new + ${modified} updated (of ${top.length} candidates, ${errors.length} errors)`);
    return upserted;
}
