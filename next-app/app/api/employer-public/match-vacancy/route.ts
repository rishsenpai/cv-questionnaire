import { NextRequest, NextResponse, after } from 'next/server';
// Alleen de TfIdf-submodule importeren — niet de 'natural' barrel. Die barrel
// laadt SentimentAnalyzer → require('afinn-165'), en afinn-165 is ESM-only,
// wat op Vercel een ERR_REQUIRE_ESM geeft waardoor de hele route crasht (500
// HTML-pagina → client zag "Unexpected token '<'"). De submodule is pure CJS.
import { TfIdf } from 'natural/lib/natural/tfidf';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import EmployerLead from '@/models/EmployerLead';
import MatchEvent from '@/models/MatchEvent';
import { tokenize } from '@/lib/server/synonyms';
import { extractText } from '@/lib/server/cvTextExtract';
import { getTransporter } from '@/lib/server/mailer';
import { getClientIP } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { escapeHtml, decodeBase64Limited } from '@/lib/server/security';
import { visibleCvCountryQuery, isHiddenCv } from '@/lib/country';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@beyondjobs.nl';

interface AnonymousMatch {
    id: string;
    jobTitle: string;
    location: string;
    summary: string;
    topSkills: string[];
    matchScore: number;
    matchedTerms: string[];
}

function topSkillsFrom(skills: string | undefined): string[] {
    if (!skills) return [];
    return skills
        .split(/[,\n;]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8);
}

export async function POST(req: NextRequest) {
    try {
        // Onauth endpoint dat een TF-IDF over de héle CV-collectie draait (CPU) en
        // een notificatiemail stuurt → begrens het aantal verzoeken per IP.
        const limited = await enforceRateLimit(req, { name: 'match-vacancy', limit: 20, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const {
            vacancyText: rawText,
            vacancyTitle,
            companyName,
            contactName,
            email,
            phone,
            fileName,
            fileType,
            fileData,
        } = body || {};

        let vacancyText = (rawText || '').toString().trim();

        if (!vacancyText && fileData) {
            const { buffer, tooLarge } = decodeBase64Limited(fileData, MAX_FILE_BYTES);
            if (tooLarge) {
                return NextResponse.json({ success: false, message: 'Bestand te groot (max 10MB)' }, { status: 413 });
            }
            if (!buffer) {
                return NextResponse.json({ success: false, message: 'Ongeldig bestand' }, { status: 400 });
            }
            const { text, error } = await extractText({ buffer, fileName, fileType });
            if (error) {
                return NextResponse.json({ success: false, message: `Tekstextractie mislukt: ${error}` }, { status: 400 });
            }
            vacancyText = text;
        }

        if (!vacancyText || vacancyText.length < 30) {
            return NextResponse.json(
                { success: false, message: 'Plak de vacaturetekst (minimaal 30 karakters) of upload een PDF/DOCX' },
                { status: 400 },
            );
        }

        if (!email && !phone) {
            return NextResponse.json(
                { success: false, message: 'Vul een e-mailadres of telefoonnummer in zodat we contact kunnen opnemen' },
                { status: 400 },
            );
        }

        await connectDB();

        // NL-CV's zijn verborgen voor werkgevers: DB-filter op het country-veld,
        // plus isHiddenCv() als vangnet voor CV's zonder gebackfilld country.
        const cvs = (await CV.find({ isInternal: { $ne: true }, ...visibleCvCountryQuery() })
            .select('-fileData -embedding'))
            .filter(cv => !isHiddenCv(cv));

        const tfidf = new TfIdf();
        tfidf.addDocument(tokenize(vacancyText, true));

        cvs.forEach(cv => {
            const text = `${cv.jobTitle || ''} ${cv.jobTitle || ''} ${cv.skills || ''} ${cv.skills || ''} ${cv.fullText || ''} ${cv.experience || ''}`;
            tfidf.addDocument(tokenize(text, true));
        });

        const vacancyTerms: Array<{ term: string; tfidf: number }> = [];
        tfidf.listTerms(0).slice(0, 30).forEach(item => {
            vacancyTerms.push({ term: item.term, tfidf: item.tfidf });
        });

        const detectedTitle = vacancyTitle || vacancyText.split('\n')[0].slice(0, 100);

        const scored = cvs.map((cv, index) => {
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

            const titleWords = tokenize(detectedTitle.toLowerCase());
            const cvTitleWords = tokenize((cv.jobTitle || '').toLowerCase());
            const titleOverlap = titleWords.filter(w => cvTitleWords.includes(w)).length;
            if (titleOverlap > 0) {
                score *= 1 + titleOverlap * 0.3;
            }

            const maxPossibleScore = vacancyTerms.reduce((sum, t) => sum + t.tfidf, 0) * 1.5;
            const normalized = maxPossibleScore > 0 ? Math.min(100, Math.round((score / maxPossibleScore) * 100)) : 0;

            return { cv, score: normalized, matchedTerms };
        })
        .filter(r => r.score >= 30)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

        const matches: AnonymousMatch[] = scored.map(({ cv, score, matchedTerms }) => ({
            id: String(cv._id),
            jobTitle: cv.jobTitle || 'Onbekende functie',
            location: cv.location || 'Locatie onbekend',
            summary: (cv.summary || '').slice(0, 220),
            topSkills: topSkillsFrom(cv.skills),
            matchScore: score,
            matchedTerms: matchedTerms.slice(0, 6),
        }));

        let leadId: string | null = null;
        try {
            const lead = await EmployerLead.create({
                companyName,
                contactName,
                email,
                phone,
                vacancyTitle: detectedTitle,
                vacancyText: vacancyText.slice(0, 50000),
                fileName,
                matchCount: matches.length,
                topScore: matches[0]?.matchScore,
                ipAddress: getClientIP(req),
                userAgent: req.headers.get('user-agent') || undefined,
            });
            leadId = String(lead._id);
        } catch (err) {
            console.error('EmployerLead create failed:', err instanceof Error ? err.message : err);
        }

        try {
            const top = scored.slice(0, 5);
            if (top.length > 0) {
                await MatchEvent.insertMany(
                    top.map(t => ({
                        cvId: t.cv._id,
                        cvFullName: t.cv.fullName,
                        vacancyTitle: detectedTitle,
                        score: t.score,
                        matchType: 'TF-IDF' as const,
                        source: 'employer-public' as const,
                        employerLeadId: leadId || undefined,
                    })),
                    { ordered: false },
                );
            }
        } catch (err) {
            console.error('MatchEvent log (employer-public) failed:', err instanceof Error ? err.message : err);
        }

        // De notificatie-mail draait ná de response (next/server `after`). Zo kan
        // een trage/hangende SMTP-verbinding de functie nooit over maxDuration
        // duwen — wat op Vercel een HTML 504-pagina zou opleveren en de client
        // met "Unexpected token '<'" liet crashen.
        after(async () => {
        try {
            const matchSummary = matches.slice(0, 5)
                .map((m, i) => `${i + 1}. ${escapeHtml(m.jobTitle)} - ${escapeHtml(m.location)} (${m.matchScore}%)`)
                .join('<br>');
            const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Nieuwe werkgever-aanvraag</h2>
    <p>Een werkgever heeft via de publieke matching tool een vacature ingediend.</p>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Werkgever</h3>
        ${companyName ? `<p><strong>Bedrijf:</strong> ${escapeHtml(companyName)}</p>` : ''}
        ${contactName ? `<p><strong>Contactpersoon:</strong> ${escapeHtml(contactName)}</p>` : ''}
        ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ''}
        ${phone ? `<p><strong>Telefoon:</strong> ${escapeHtml(phone)}</p>` : ''}
    </div>
    <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border: 1px solid #90cdf4; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2b6cb0;">Vacature</h3>
        <p><strong>Titel:</strong> ${escapeHtml(detectedTitle)}</p>
        <p><strong>Aantal matches:</strong> ${matches.length}</p>
        <p><strong>Top score:</strong> ${matches[0]?.matchScore || 0}%</p>
    </div>
    <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Top 5 matches</h3>
        <p>${matchSummary || 'Geen matches'}</p>
    </div>
    <p style="margin-top: 20px; color: #718096; font-size: 14px;">
        Lead ID: ${leadId || '—'}<br>
        ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
    </p>
</div>`;
            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: APPLICATIONS_EMAIL,
                replyTo: email || undefined,
                subject: `Werkgever-aanvraag: ${companyName || contactName || email || 'Onbekend'} → ${detectedTitle}`,
                html,
            });
        } catch (err) {
            console.error('Employer lead email failed:', err instanceof Error ? err.message : err);
        }
        });

        return NextResponse.json({
            success: true,
            leadId,
            vacancyTitle: detectedTitle,
            totalCvs: cvs.length,
            matches,
            terms: vacancyTerms.slice(0, 10).map(t => t.term),
        });
    } catch (err) {
        console.error('employer-public match-vacancy error:', err);
        return NextResponse.json({ success: false, message: 'Matching mislukt' }, { status: 500 });
    }
}
