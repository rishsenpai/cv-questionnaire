import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { visibleCvCountryQuery, isHiddenCv } from '@/lib/country';

export const maxDuration = 30;

interface AnonymousMatch {
    id: string;
    jobTitle: string;
    location: string;
    summary: string;
    topSkills: string[];
    matchScore: number;
}

function topSkillsFrom(skills: string | undefined): string[] {
    if (!skills) return [];
    return skills
        .split(/[,\n;]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8);
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
    try {
        // Onauth endpoint dat CV-data (geanonimiseerd) teruggeeft → begrens
        // scraping van de hele kandidatenpool.
        const limited = await enforceRateLimit(req, { name: 'search-cvs', limit: 40, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const url = new URL(req.url);
        const q = (url.searchParams.get('q') || '').trim();
        const location = (url.searchParams.get('location') || '').trim();

        if (!q && !location) {
            return NextResponse.json({ success: false, message: 'Geef een zoekterm op' }, { status: 400 });
        }

        await connectDB();

        // NL-CV's zijn verborgen voor werkgevers (zie HIDDEN_CV_COUNTRIES).
        const filter: Record<string, unknown> = { isInternal: { $ne: true }, ...visibleCvCountryQuery() };
        const orConditions: Array<Record<string, unknown>> = [];
        if (q) {
            const safe = escapeRegex(q);
            const re = new RegExp(safe, 'i');
            orConditions.push({ jobTitle: re });
            orConditions.push({ skills: re });
            orConditions.push({ summary: re });
            orConditions.push({ experience: re });
        }
        if (orConditions.length > 0) filter.$or = orConditions;
        if (location) {
            filter.location = new RegExp(escapeRegex(location), 'i');
        }

        const cvs = (await CV.find(filter)
            .select('_id jobTitle location summary skills experience country')
            .limit(50)
            .lean())
            // Vangnet voor CV's zonder gebackfilld country-veld.
            .filter(cv => !isHiddenCv(cv));

        const qLower = q.toLowerCase();
        const qTerms = qLower.split(/\s+/).filter(Boolean);

        const scored: AnonymousMatch[] = cvs.map(cv => {
            let score = 0;
            const fields: Array<{ value: string; weight: number }> = [
                { value: (cv.jobTitle || '').toLowerCase(), weight: 40 },
                { value: (cv.skills || '').toLowerCase(), weight: 30 },
                { value: (cv.summary || '').toLowerCase(), weight: 15 },
                { value: (cv.experience || '').toLowerCase(), weight: 15 },
            ];
            for (const term of qTerms) {
                for (const f of fields) {
                    if (f.value.includes(term)) score += f.weight;
                }
            }
            const normalized = Math.min(100, score);
            return {
                id: String(cv._id),
                jobTitle: cv.jobTitle || 'Onbekende functie',
                location: cv.location || 'Locatie onbekend',
                summary: (cv.summary || '').slice(0, 220),
                topSkills: topSkillsFrom(cv.skills),
                matchScore: normalized,
            };
        })
        .filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

        return NextResponse.json({
            success: true,
            query: q,
            location,
            totalCvs: cvs.length,
            matches: scored,
        });
    } catch (err) {
        console.error('search-cvs error:', err);
        return NextResponse.json({ success: false, message: 'Zoeken mislukt' }, { status: 500 });
    }
}
