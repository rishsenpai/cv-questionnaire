import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import MatchEvent from '@/models/MatchEvent';
import { requireAdmin } from '@/lib/server/auth';
import { extractText } from '@/lib/server/cvTextExtract';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';
import {
    cosineSimilarity,
    generateEmbedding,
    parseCVWithAI,
    prepareCVText,
} from '@/lib/server/embeddings';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json({ success: false, message: 'OPENAI_API_KEY niet geconfigureerd' }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { fileName, fileType, fileSize, fileData, lang } = body || {};
        if (!fileData) {
            return NextResponse.json({ success: false, message: 'Geen bestand meegestuurd' }, { status: 400 });
        }
        if (fileSize && fileSize > MAX_FILE_BYTES) {
            return NextResponse.json({ success: false, message: 'Bestand te groot (>10MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(fileData, 'base64');
        const { text, error } = await extractText({ buffer, fileName, fileType });
        if (error) {
            return NextResponse.json({ success: false, message: `Tekstextractie mislukt: ${error}` }, { status: 400 });
        }

        const parsed = await parseCVWithAI(text, (lang === 'en' || lang === 'es') ? lang : 'nl');
        const cvFullName = parsed.fullName || (fileName || '').replace(/\.[^/.]+$/, '') || 'Onbekend';

        const cvText = prepareCVText({ ...parsed, fullText: text });
        const cvEmbedding = await generateEmbedding(cvText);

        await connectDB();
        const vacancies = await Vacancy.find({
            isActive: true,
            embedding: { $exists: true, $ne: [] },
        }).select('+embedding -fileData');

        const scored = vacancies.map(vacancy => {
            const score = cosineSimilarity(cvEmbedding, vacancy.embedding!);
            const obj = vacancy.toObject() as unknown as Record<string, unknown>;
            delete obj.embedding;
            obj.description = sanitizeJobText(vacancy.description, vacancy.company);
            obj.requirements = sanitizeJobText(vacancy.requirements, vacancy.company);
            return {
                _vacancyId: vacancy._id,
                _vacancyTitle: vacancy.title,
                ...obj,
                matchScore: Math.round(score * 100),
                matchType: 'AI Semantic' as const,
            };
        })
        .filter(v => v.matchScore >= 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        try {
            const top = scored.slice(0, 5);
            if (top.length > 0) {
                await MatchEvent.insertMany(
                    top.map(t => ({
                        cvFullName,
                        vacancyId: t._vacancyId,
                        vacancyTitle: t._vacancyTitle,
                        score: t.matchScore,
                        matchType: t.matchType,
                        source: 'admin-cv' as const,
                    })),
                    { ordered: false },
                );
            }
        } catch (err) {
            console.error('MatchEvent log (admin-cv) failed:', err instanceof Error ? err.message : err);
        }

        const matches = scored.map(({ _vacancyId: _v, _vacancyTitle: _t, ...rest }) => rest);

        return NextResponse.json({
            success: true,
            cv: { fullName: cvFullName, jobTitle: parsed.jobTitle, location: parsed.location },
            totalVacancies: vacancies.length,
            matches,
        });
    } catch (err) {
        console.error('match-cv-upload error:', err);
        return NextResponse.json({ success: false, message: 'Match mislukt' }, { status: 500 });
    }
}
