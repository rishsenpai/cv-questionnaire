import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireEmployer } from '@/lib/server/auth';
import { cosineSimilarity, generateEmbedding } from '@/lib/server/embeddings';
import { visibleCvCountryQuery, isHiddenCv } from '@/lib/country';

export const maxDuration = 60;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan !== 'premium') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Premium voor AI matching' },
            { status: 403 },
        );
    }
    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json(
            { success: false, message: 'AI matching is niet geconfigureerd' },
            { status: 503 },
        );
    }
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findOne({ _id: id, employerId: auth.employerId }).select('+embedding');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        let vacEmbedding = vacancy.embedding;
        if (!vacEmbedding || vacEmbedding.length === 0) {
            const text = `${vacancy.title}\n${vacancy.description || ''}\n${vacancy.requirements || ''}`;
            vacEmbedding = await generateEmbedding(text);
            await Vacancy.findByIdAndUpdate(vacancy._id, { embedding: vacEmbedding });
            console.log(`Generated and cached embedding for vacancy: ${vacancy.title}`);
        }

        // NL-CV's zijn verborgen voor werkgevers (zie HIDDEN_CV_COUNTRIES).
        const cvs = (await CV.find({
            embedding: { $exists: true, $ne: [] },
            isInternal: { $ne: true },
            ...visibleCvCountryQuery(),
        }).select('+embedding -fileData'))
            .filter(cv => !isHiddenCv(cv));

        if (cvs.length === 0) {
            return NextResponse.json({
                success: true,
                vacancy: { _id: vacancy._id, title: vacancy.title },
                matches: [],
                message: 'Geen CV\'s met embeddings gevonden. Genereer eerst embeddings voor bestaande CV\'s.',
            });
        }

        const matched = cvs.map(cv => {
            const score = cosineSimilarity(vacEmbedding!, cv.embedding!);
            const obj = cv.toObject() as unknown as Record<string, unknown>;
            delete obj.embedding;
            return { ...obj, matchScore: Math.round(score * 100), matchType: 'AI Semantic' };
        })
        .filter(cv => cv.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        console.log(`AI Matching - Found ${matched.length} matches for "${vacancy.title}"`);
        return NextResponse.json({
            success: true,
            vacancy: { _id: vacancy._id, title: vacancy.title },
            matches: matched,
            totalWithEmbeddings: cvs.length,
        });
    } catch (err) {
        console.error('Error in AI matching:', err);
        return NextResponse.json({ success: false, message: 'AI matching mislukt' }, { status: 500 });
    }
}
