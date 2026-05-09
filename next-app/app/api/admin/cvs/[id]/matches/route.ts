import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';
import {
    cosineSimilarity,
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';

export const maxDuration = 60;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json({ success: false, message: 'OPENAI_API_KEY niet geconfigureerd' }, { status: 503 });
    }

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findById(id).select('+embedding');
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV niet gevonden' }, { status: 404 });
        }

        let cvEmbedding = cv.embedding;
        if (!cvEmbedding || cvEmbedding.length === 0) {
            const textToEmbed = prepareCVText(cv);
            if (!textToEmbed || textToEmbed.trim().length < 50) {
                return NextResponse.json({ success: false, message: 'CV heeft te weinig tekst voor matching' }, { status: 400 });
            }
            const textHash = generateTextHash(textToEmbed);
            cvEmbedding = await generateEmbedding(textToEmbed);
            await CV.findByIdAndUpdate(cv._id, { embedding: cvEmbedding, textHash });
        }

        const vacancies = await Vacancy.find({
            isActive: true,
            embedding: { $exists: true, $ne: [] },
        }).select('+embedding -fileData');

        const matches = vacancies.map(vacancy => {
            const score = cosineSimilarity(cvEmbedding!, vacancy.embedding!);
            const obj = vacancy.toObject() as unknown as Record<string, unknown>;
            delete obj.embedding;
            obj.description = sanitizeJobText(vacancy.description, vacancy.company);
            obj.requirements = sanitizeJobText(vacancy.requirements, vacancy.company);
            return {
                ...obj,
                matchScore: Math.round(score * 100),
                matchType: 'AI Semantic',
            };
        })
        .filter(v => v.matchScore >= 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        return NextResponse.json({
            success: true,
            cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle, location: cv.location },
            totalVacancies: vacancies.length,
            matches,
        });
    } catch (err) {
        console.error('admin cvs/[id]/matches error:', err);
        return NextResponse.json({ success: false, message: 'Matching mislukt' }, { status: 500 });
    }
}
