import { NextRequest, NextResponse } from 'next/server';
import natural from 'natural';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';
import { tokenize } from '@/lib/server/synonyms';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const body = await req.json();
        const { vacancyText } = body || {};
        if (!vacancyText || String(vacancyText).trim().length < 3) {
            return NextResponse.json(
                { success: false, message: 'Voer een vacature tekst in (minimaal 3 karakters)' },
                { status: 400 },
            );
        }

        const cvs = await CV.find().select('-fileData');
        console.log('Test Matching - Processing', cvs.length, 'CVs');

        const tfidf = new natural.TfIdf();
        tfidf.addDocument(tokenize(vacancyText, true));

        cvs.forEach(cv => {
            const text = `${cv.jobTitle || ''} ${cv.jobTitle || ''} ${cv.skills || ''} ${cv.skills || ''} ${cv.fullText || ''} ${cv.experience || ''}`;
            tfidf.addDocument(tokenize(text, true));
        });

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

            const vacancyTitle = String(vacancyText).split('\n')[0].toLowerCase();
            const titleWords = tokenize(vacancyTitle);
            const cvTitleWords = tokenize((cv.jobTitle || '').toLowerCase());
            const titleOverlap = titleWords.filter(w => cvTitleWords.includes(w)).length;
            if (titleOverlap > 0) {
                score *= 1 + titleOverlap * 0.3;
            }

            const maxPossibleScore = vacancyTerms.reduce((sum, t) => sum + t.tfidf, 0) * 1.5;
            const normalized = maxPossibleScore > 0 ? Math.min(100, Math.round((score / maxPossibleScore) * 100)) : 0;

            return {
                _id: String(cv._id),
                fullName: cv.fullName,
                jobTitle: cv.jobTitle,
                skills: cv.skills,
                location: cv.location,
                matchScore: normalized,
                matchedTerms: matchedTerms.slice(0, 8),
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        return NextResponse.json({
            success: true,
            vacancyTerms: vacancyTerms.slice(0, 15).map(t => t.term),
            totalCVs: cvs.length,
            matches: matched,
        });
    } catch (err) {
        console.error('Test matching error:', err);
        return NextResponse.json({ success: false, message: 'Test matching failed' }, { status: 500 });
    }
}
