import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import {
    cosineSimilarity,
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';
import { errorMessages, type Language } from '@/lib/server/i18n';

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

        const vacancies = await Vacancy.find({
            isActive: true,
            embedding: { $exists: true, $ne: [] },
        }).select('+embedding -fileData');

        if (vacancies.length === 0) {
            return NextResponse.json({
                success: true,
                cv: { _id: cv._id, fullName: cv.fullName },
                matches: [],
                message: t.noVacanciesWithEmbeddings,
            });
        }

        const matched = vacancies
            .map(vacancy => {
                const score = cosineSimilarity(cvEmbedding!, vacancy.embedding!);
                const obj = vacancy.toObject() as unknown as Record<string, unknown>;
                delete obj.embedding;
                // GDPR-mask voor kandidaten — bedrijfsnaam/logo/apply-link niet tonen
                delete obj.company;
                delete obj.companyLogo;
                delete obj.applyLink;
                delete obj.fullText;
                return {
                    ...obj,
                    matchScore: Math.round(score * 100),
                    matchType: 'AI Semantic',
                };
            })
            .filter(v => v.matchScore >= 40)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 20);

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
