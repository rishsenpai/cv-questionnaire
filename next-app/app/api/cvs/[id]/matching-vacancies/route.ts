import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import MatchEvent from '@/models/MatchEvent';
import {
    cosineSimilarity,
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';
import { errorMessages, type Language } from '@/lib/server/i18n';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';
import { compareLocations, applyLocationBonus } from '@/lib/server/locationMatch';
import { visibleVacancyCountryQuery, isHiddenVacancy } from '@/lib/country';

export const maxDuration = 60;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const url = new URL(req.url);
    const langParam = (url.searchParams.get('lang') || 'en').toLowerCase();
    const lang: Language = ['en', 'nl', 'es'].includes(langParam) ? (langParam as Language) : 'en';
    const t = errorMessages[lang];

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: t.cvNotFound }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
            return NextResponse.json({ success: false, message: t.aiNotConfigured }, { status: 503 });
        }

        await connectDB();
        const cv = await CV.findById(id).select('+embedding');
        if (!cv) {
            return NextResponse.json({ success: false, message: t.cvNotFound }, { status: 404 });
        }

        let cvEmbedding = cv.embedding;
        if (!cvEmbedding || cvEmbedding.length === 0) {
            const textToEmbed = prepareCVText(cv);
            if (!textToEmbed || textToEmbed.trim().length < 50) {
                return NextResponse.json(
                    { success: false, message: t.cvInsufficientText },
                    { status: 400 },
                );
            }
            const textHash = generateTextHash(textToEmbed);
            cvEmbedding = await generateEmbedding(textToEmbed);
            await CV.findByIdAndUpdate(cv._id, { embedding: cvEmbedding, textHash });
            console.log(`Generated and cached embedding for CV: ${cv.fullName}`);
        }

        // Sluit verborgen landen (NL) uit: Surinaamse kandidaten mogen niet op
        // NL-vacatures matchen/solliciteren. isHiddenVacancy() vangt hieronder ook
        // vacatures af die nog geen gebackfilld country-veld hebben.
        const vacancies = (await Vacancy.find({
            isActive: true,
            fulfilledAt: null,
            embedding: { $exists: true, $ne: [] },
            ...visibleVacancyCountryQuery(),
        }).select('+embedding -fileData')).filter(v => !isHiddenVacancy(v));

        if (vacancies.length === 0) {
            return NextResponse.json({
                success: true,
                cv: { _id: cv._id, fullName: cv.fullName },
                matches: [],
                message: t.noVacanciesWithEmbeddings,
            });
        }

        const scored = vacancies.map(vacancy => {
            const cosineScore = cosineSimilarity(cvEmbedding!, vacancy.embedding!);
            // Locatie-bonus: +12 zelfde stad, +6 zelfde provincie, -8 verschillend.
            // Skipt bij remote vacatures.
            const { bonus } = compareLocations(vacancy.location, cv.location, vacancy.isRemote);
            const finalScore = applyLocationBonus(Math.round(cosineScore * 100), bonus);

            const obj = vacancy.toObject() as unknown as Record<string, unknown>;
            delete obj.embedding;
            obj.description = sanitizeJobText(vacancy.description, vacancy.company);
            obj.requirements = sanitizeJobText(vacancy.requirements, vacancy.company);
            // Anoniem: bedrijfsnaam altijd verbergen — alles loopt via JobParsing.
            delete obj.company;
            delete obj.companyLogo;
            delete obj.applyLink;
            if (!vacancy.employerId) {
                obj.viaJobParsing = true;
            }
            delete obj.fullText;
            return {
                _vacancyId: vacancy._id,
                _vacancyTitle: vacancy.title,
                ...obj,
                matchScore: finalScore,
                matchType: 'AI Semantic' as const,
            };
        })
        .filter(v => v.matchScore >= 20)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        const matched = scored.map(({ _vacancyId: _v, _vacancyTitle: _t, ...rest }) => rest);

        try {
            const top = scored.slice(0, 5);
            if (top.length > 0) {
                const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const existing = await MatchEvent.find({
                    cvId: cv._id,
                    vacancyId: { $in: top.map(t => t._vacancyId) },
                    createdAt: { $gte: since },
                }).select('vacancyId').lean();
                const seen = new Set(existing.map(e => String(e.vacancyId)));
                const docs = top
                    .filter(t => !seen.has(String(t._vacancyId)))
                    .map(t => ({
                        cvId: cv._id,
                        cvFullName: cv.fullName,
                        vacancyId: t._vacancyId,
                        vacancyTitle: t._vacancyTitle,
                        score: t.matchScore,
                        matchType: t.matchType,
                        source: 'jobseeker' as const,
                    }));
                if (docs.length > 0) await MatchEvent.insertMany(docs, { ordered: false });
            }
        } catch (err) {
            console.error('MatchEvent log (jobseeker) failed:', err instanceof Error ? err.message : err);
        }

        console.log(`CV Matching - Found ${matched.length} vacancies for "${cv.fullName}"`);

        return NextResponse.json({
            success: true,
            cv: { _id: cv._id, fullName: cv.fullName },
            matches: matched,
            totalVacancies: vacancies.length,
        });
    } catch (err) {
        console.error('Error in CV-to-vacancy matching:', err);
        return NextResponse.json({ success: false, message: t.matchingFailed }, { status: 500 });
    }
}
