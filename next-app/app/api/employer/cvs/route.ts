import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireEmployer } from '@/lib/server/auth';
import { synonyms, getWordWithSynonyms } from '@/lib/server/synonyms';
import { visibleCvCountryQuery, isHiddenCv } from '@/lib/country';

export const maxDuration = 30;

function extractRelevantYearsExperience(
    experience: string | undefined,
    jobTitle: string | undefined,
    expandedSearchTerms: Set<string>,
): number | null {
    if (!experience && !jobTitle) return null;
    const fullText = `${jobTitle || ''} ${experience || ''}`;

    if (expandedSearchTerms.size === 0) {
        const yearMatches = fullText.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches && yearMatches.length >= 2) {
            const years = yearMatches.map(y => parseInt(y, 10)).sort((a, b) => a - b);
            const totalYears = Math.min(new Date().getFullYear(), years[years.length - 1]) - years[0];
            return totalYears > 0 && totalYears < 50 ? totalYears : null;
        }
        return null;
    }

    const jobEntryPattern = /(.{10,500}?)(\b(19|20)\d{2}\b\s*[-–—]\s*(\b(19|20)\d{2}\b|[Pp]resent|[Hh]eden|[Nn]u|[Cc]urrent))/g;
    const entries: Array<{ text: string; startYear: number; endYear: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = jobEntryPattern.exec(fullText)) !== null) {
        const entryText = m[1] + m[2];
        const yearMatch = entryText.match(/\b(19|20)(\d{2})\b\s*[-–—]\s*(\b(19|20)(\d{2})\b|[Pp]resent|[Hh]eden|[Nn]u|[Cc]urrent)/);
        if (yearMatch) {
            const startYear = parseInt(yearMatch[1] + yearMatch[2], 10);
            let endYear = new Date().getFullYear();
            if (yearMatch[4] && yearMatch[5]) {
                endYear = parseInt(yearMatch[4] + yearMatch[5], 10);
            }
            entries.push({ text: entryText.toLowerCase(), startYear, endYear });
        }
    }

    if (entries.length === 0) {
        const textLower = fullText.toLowerCase();
        const hasRelevant = Array.from(expandedSearchTerms).some(t => textLower.includes(t));
        if (hasRelevant) {
            const yearMatches = fullText.match(/\b(19|20)\d{2}\b/g);
            if (yearMatches && yearMatches.length >= 2) {
                const years = yearMatches.map(y => parseInt(y, 10)).sort((a, b) => a - b);
                const totalYears = Math.min(new Date().getFullYear(), years[years.length - 1]) - years[0];
                return totalYears > 0 && totalYears < 50 ? totalYears : null;
            }
        }
        return null;
    }

    let relevantYears = 0;
    entries.forEach(entry => {
        const hasRelevant = Array.from(expandedSearchTerms).some(t => entry.text.includes(t));
        if (hasRelevant) {
            const years = Math.min(new Date().getFullYear(), entry.endYear) - entry.startYear;
            if (years > 0) relevantYears += years;
        }
    });

    return relevantYears > 0 ? relevantYears : null;
}

export async function GET(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;

    try {
        await connectDB();
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';
        const jobTitle = url.searchParams.get('jobTitle') || '';
        const location = url.searchParams.get('location') || '';

        // NL-CV's zijn verborgen voor werkgevers (zie HIDDEN_CV_COUNTRIES).
        const query: Record<string, unknown> = { isInternal: { $ne: true }, ...visibleCvCountryQuery() };
        const andConditions: Array<Record<string, unknown>> = [];

        if (search) {
            const words = search.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            if (words.length > 0) {
                const searchAndConditions = words.map(word => {
                    const wordPattern = getWordWithSynonyms(word).join('|');
                    const wordRegex = new RegExp(wordPattern, 'i');
                    return {
                        $or: [
                            { fullText: wordRegex },
                            { jobTitle: wordRegex },
                            { skills: wordRegex },
                        ],
                    };
                });
                query.$or = [
                    { $and: searchAndConditions },
                    { fullName: new RegExp(search, 'i') },
                ];
            }
        }

        if (jobTitle) {
            const words = jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            if (words.length > 0) {
                words.forEach(word => {
                    const wordPattern = getWordWithSynonyms(word).join('|');
                    andConditions.push({ jobTitle: new RegExp(wordPattern, 'i') });
                });
            }
        }

        if (location) {
            query.location = new RegExp(location, 'i');
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        const cvs = (await CV.find(query).select('-fileData').sort({ createdAt: -1 }))
            // Vangnet voor CV's zonder gebackfilld country-veld.
            .filter(cv => !isHiddenCv(cv));
        const plan = auth.plan;
        const hasFullAccess = plan === 'advanced' || plan === 'premium';

        const searchTerms = [search, jobTitle].filter(Boolean).join(' ').toLowerCase();
        const expandedSearchTerms = new Set<string>();
        searchTerms.split(/\s+/).forEach(term => {
            if (term.length > 2) {
                expandedSearchTerms.add(term);
                const list = synonyms[term];
                if (list) list.forEach(syn => expandedSearchTerms.add(syn));
            }
        });

        const sanitized = cvs.map(cv => {
            const obj = cv.toObject() as unknown as Record<string, unknown> & { fullName: string; location?: string | null };
            obj.yearsExperience = extractRelevantYearsExperience(
                cv.experience,
                cv.jobTitle,
                expandedSearchTerms,
            );
            if (!hasFullAccess) {
                obj.email = '••••••@••••••';
                obj.phone = '•••••••••••';
                obj.fullName = obj.fullName.split(' ')[0] + ' ••••••';
                obj.location = obj.location ? obj.location.split(',')[0] + ', ••••••' : null;
                obj.experience = null;
                obj.summary = null;
                obj.skills = null;
                // Zonder deze extra strip lekte de betaalmuur: fullText bevat de
                // volledige ruwe CV-tekst (naam, e-mail, telefoon, adres) en fileUrl
                // is een directe download van het originele CV. birthDate/education/
                // achievements/fileName (vaak "CV_Voornaam_Achternaam.pdf") deanonimiseren
                // de kandidaat eveneens. Alleen premium/advanced mag deze zien.
                delete obj.fullText;
                delete obj.fileUrl;
                delete obj.birthDate;
                delete obj.education;
                delete obj.achievements;
                delete obj.fileName;
            }
            return obj;
        });

        return NextResponse.json({
            success: true,
            count: sanitized.length,
            plan,
            data: sanitized,
        });
    } catch (err) {
        console.error('Error fetching CVs for employer:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch CVs' }, { status: 500 });
    }
}
