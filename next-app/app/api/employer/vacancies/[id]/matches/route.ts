import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
// Alleen de TfIdf-submodule — niet de 'natural' barrel (die require't
// afinn-165, ESM-only → ERR_REQUIRE_ESM crash op Vercel). Zie match-vacancy.
import { TfIdf } from 'natural/lib/natural/tfidf';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireEmployer } from '@/lib/server/auth';
import { tokenize } from '@/lib/server/synonyms';

export const maxDuration = 60;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan !== 'premium') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Premium voor vacature matching' },
            { status: 403 },
        );
    }
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findOne({ _id: id, employerId: auth.employerId });
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        const vacancyText = vacancy.fullText || `${vacancy.title} ${vacancy.description || ''} ${vacancy.requirements || ''}`;
        const cvs = await CV.find({ isInternal: { $ne: true } }).select('-fileData');

        const tfidf = new TfIdf();
        tfidf.addDocument(tokenize(vacancyText, true));

        const cvTexts = cvs.map(cv => {
            const text = `${cv.jobTitle || ''} ${cv.jobTitle || ''} ${cv.skills || ''} ${cv.skills || ''} ${cv.fullText || ''} ${cv.experience || ''}`;
            return tokenize(text, true);
        });
        cvTexts.forEach(tokens => tfidf.addDocument(tokens));

        const vacancyTerms: Array<{ term: string; tfidf: number }> = [];
        tfidf.listTerms(0).slice(0, 30).forEach(item => {
            vacancyTerms.push({ term: item.term, tfidf: item.tfidf });
        });

        const matched = cvs.map((cv, index) => {
            const cvDocIndex = index + 1;
            let score = 0;
            const matchedTerms: string[] = [];
            vacancyTerms.forEach(vt => {
                const cvTfidf = tfidf.tfidf(vt.term, cvDocIndex);
                if (cvTfidf > 0) {
                    score += Math.min(vt.tfidf, cvTfidf);
                    matchedTerms.push(vt.term);
                }
            });

            const titleWords = tokenize((vacancy.title || '').toLowerCase());
            const cvTitleWords = tokenize((cv.jobTitle || '').toLowerCase());
            const titleOverlap = titleWords.filter(w => cvTitleWords.includes(w)).length;
            if (titleOverlap > 0) {
                score *= 1 + titleOverlap * 0.3;
            }

            const maxPossibleScore = vacancyTerms.reduce((sum, t) => sum + t.tfidf, 0) * 1.5;
            const normalized = maxPossibleScore > 0 ? Math.min(100, Math.round((score / maxPossibleScore) * 100)) : 0;

            return {
                ...(cv.toObject() as unknown as Record<string, unknown>),
                matchScore: normalized,
                matchReason: matchedTerms.length > 0
                    ? `Matcht op: ${matchedTerms.slice(0, 6).join(', ')}`
                    : 'Geen specifieke match',
            };
        })
        .filter(c => c.matchScore >= 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

        console.log('TF-IDF Matching - Found', matched.length, 'matches');
        return NextResponse.json({
            success: true,
            vacancy: { _id: vacancy._id, title: vacancy.title },
            matches: matched,
        });
    } catch (err) {
        console.error('Error matching CVs:', err);
        return NextResponse.json({ success: false, message: 'Failed to match CVs' }, { status: 500 });
    }
}
