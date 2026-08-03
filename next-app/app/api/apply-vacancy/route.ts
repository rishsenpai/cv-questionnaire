import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import MatchEvent from '@/models/MatchEvent';
import { getTransporter } from '@/lib/server/mailer';
import { ingestCvFromBuffer } from '@/lib/server/cvIngestion';
import { fetchCvBlob } from '@/lib/server/blobStorage';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { escapeHtml, decodeBase64Limited } from '@/lib/server/security';
import { isHiddenVacancy } from '@/lib/country';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@beyondjobs.nl';

interface VacancyEmail {
    title: string;
    location?: string;
    employmentType?: string;
    isRemote?: boolean;
    matchScore?: number;
    count?: number;
}

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'apply-vacancy', limit: 20, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        await connectDB();
        const body = await req.json();
        const {
            cvId,
            vacancyId,
            vacancy: legacyVacancy,
            applicantName,
            applicantEmail,
            fileName,
            fileType,
            fileData,
        } = body || {};

        let resolvedCv: { _id: mongoose.Types.ObjectId; fullName: string; email?: string; phone?: string; location?: string; jobTitle?: string; fileUrl?: string; fileData?: string; fileName?: string; fileType?: string } | null = null;
        let attachmentBuffer: Buffer | null = null;
        let attachmentFileName: string | null = null;
        let attachmentFileType: string | null = null;

        const loadCvDoc = async (id: string) => {
            const cv = await CV.findById(id).select('_id fullName email phone location jobTitle fileUrl fileData fileName fileType');
            if (!cv) return null;
            return {
                _id: cv._id as mongoose.Types.ObjectId,
                fullName: cv.fullName,
                email: cv.email,
                phone: cv.phone,
                location: cv.location,
                jobTitle: cv.jobTitle,
                fileUrl: cv.fileUrl,
                fileData: cv.fileData,
                fileName: cv.fileName,
                fileType: cv.fileType,
            };
        };

        if (cvId && mongoose.Types.ObjectId.isValid(cvId)) {
            resolvedCv = await loadCvDoc(cvId);
        }

        if (!resolvedCv && fileData && fileName) {
            // Groottelimiet uit de gedecodeerde payload (niet uit het client-fileSize-veld,
            // dat weggelaten kon worden om de cap te omzeilen).
            const { buffer, tooLarge } = decodeBase64Limited(fileData, MAX_FILE_BYTES);
            if (tooLarge) {
                return NextResponse.json({ success: false, message: 'CV is te groot (max 10MB)' }, { status: 413 });
            }
            if (!buffer) {
                return NextResponse.json({ success: false, message: 'Ongeldig CV-bestand' }, { status: 400 });
            }
            attachmentBuffer = buffer;
            attachmentFileName = fileName;
            attachmentFileType = fileType || 'application/octet-stream';

            const result = await ingestCvFromBuffer({
                buffer,
                fileName,
                fileType: fileType || 'application/octet-stream',
                fileSize: buffer.length,
                isInternal: false,
                lang: 'nl',
            });
            if (result.cvId) {
                resolvedCv = await loadCvDoc(result.cvId);
            } else if (result.existingCvId) {
                resolvedCv = await loadCvDoc(result.existingCvId);
            } else {
                return NextResponse.json(
                    { success: false, message: `CV verwerken mislukt: ${result.reason || 'onbekend'}` },
                    { status: 400 },
                );
            }
        }

        if (!attachmentBuffer && resolvedCv) {
            try {
                if (resolvedCv.fileUrl) {
                    attachmentBuffer = await fetchCvBlob(resolvedCv.fileUrl);
                } else if (resolvedCv.fileData) {
                    attachmentBuffer = Buffer.from(resolvedCv.fileData, 'base64');
                }
                attachmentFileName = resolvedCv.fileName || `CV_${resolvedCv.fullName.replace(/\s+/g, '_')}.bin`;
                attachmentFileType = resolvedCv.fileType || 'application/octet-stream';
            } catch (err) {
                console.error('CV attachment fetch failed:', err instanceof Error ? err.message : err);
            }
        }

        const fallbackName = (applicantName || '').trim();
        const fallbackEmail = (applicantEmail || '').trim().toLowerCase();

        if (!resolvedCv && !(fallbackName && fallbackEmail)) {
            return NextResponse.json(
                { success: false, message: 'Geef een CV mee of vul naam en e-mail in' },
                { status: 400 },
            );
        }

        let vacancyForEmail: VacancyEmail | null = null;
        let vacancyEmployerId: mongoose.Types.ObjectId | undefined;
        if (vacancyId && mongoose.Types.ObjectId.isValid(vacancyId)) {
            const v = await Vacancy.findById(vacancyId).select('title location employmentType isRemote employerId country description');
            if (v && isHiddenVacancy(v)) {
                // Verborgen landen (NL): solliciteren geblokkeerd, zelfde
                // "niet gevonden" als de detailpagina.
                return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
            }
            if (v) {
                vacancyForEmail = {
                    title: v.title,
                    location: v.location,
                    employmentType: v.employmentType,
                    isRemote: v.isRemote,
                };
                vacancyEmployerId = v.employerId as mongoose.Types.ObjectId | undefined;
                Vacancy.findByIdAndUpdate(vacancyId, { $inc: { applicationCount: 1 } }).catch(err => {
                    console.error('applicationCount inc failed:', err instanceof Error ? err.message : err);
                });
            }
        }
        if (!vacancyForEmail && legacyVacancy && legacyVacancy.title) {
            vacancyForEmail = {
                title: legacyVacancy.title,
                location: legacyVacancy.location,
                employmentType: legacyVacancy.employmentType,
                isRemote: legacyVacancy.isRemote,
                matchScore: legacyVacancy.matchScore,
                count: legacyVacancy.count,
            };
        }
        if (!vacancyForEmail) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 400 });
        }

        const candidateName = resolvedCv?.fullName || fallbackName;
        const candidateEmail = resolvedCv?.email || fallbackEmail;
        const candidatePhone = resolvedCv?.phone || '';
        const candidateLocation = resolvedCv?.location || '';
        const candidateRole = resolvedCv?.jobTitle || '';

        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Nieuwe Sollicitatie</h2>
    <p>Een kandidaat wil solliciteren op een vacature.</p>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Kandidaat</h3>
        <p><strong>Naam:</strong> ${escapeHtml(candidateName) || '—'}</p>
        <p><strong>Email:</strong> ${escapeHtml(candidateEmail) || '—'}</p>
        ${candidatePhone ? `<p><strong>Telefoon:</strong> ${escapeHtml(candidatePhone)}</p>` : ''}
        ${candidateLocation ? `<p><strong>Locatie:</strong> ${escapeHtml(candidateLocation)}</p>` : ''}
        ${candidateRole ? `<p><strong>Huidige/Gewenste functie:</strong> ${escapeHtml(candidateRole)}</p>` : ''}
    </div>
    <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border: 1px solid #90cdf4; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2b6cb0;">Vacature</h3>
        <p><strong>Functie:</strong> ${escapeHtml(vacancyForEmail.title)}</p>
        ${vacancyForEmail.location ? `<p><strong>Locatie:</strong> ${escapeHtml(vacancyForEmail.location)}</p>` : ''}
        ${vacancyForEmail.employmentType ? `<p><strong>Dienstverband:</strong> ${escapeHtml(vacancyForEmail.employmentType)}</p>` : ''}
        ${vacancyForEmail.isRemote ? '<p><strong>Remote:</strong> Ja</p>' : ''}
        ${vacancyForEmail.matchScore ? `<p><strong>Match score:</strong> ${vacancyForEmail.matchScore}%</p>` : ''}
    </div>
    <p style="margin-top: 20px; color: #718096; font-size: 14px;">
        ${resolvedCv ? `CV ID: ${resolvedCv._id}<br>` : ''}
        Gesolliciteerd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
    </p>
    <p style="margin-top: 20px;">
        <a href="${baseUrl}/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk in Admin Panel
        </a>
    </p>
</div>`;

        // CuratedMatch aanmaken zodat werkgever de sollicitatie ook in z'n portaal ziet
        // (status 'contact-requested' — admin moet contact alsnog opzetten).
        // Voor internal vacatures: employerId blijft undefined, alleen admin ziet het.
        let curatedMatchId: mongoose.Types.ObjectId | null = null;
        if (resolvedCv && vacancyId && mongoose.Types.ObjectId.isValid(vacancyId)) {
            try {
                const existing = await CuratedMatch.findOne({ vacancyId, cvId: resolvedCv._id });
                if (existing) {
                    // Alleen upgraden als de match nog niet voorbij contact-requested is.
                    if (['suggested', 'presented', 'viewed'].includes(existing.status)) {
                        existing.status = 'contact-requested';
                        existing.contactRequestedAt = new Date();
                        await existing.save();
                    }
                    curatedMatchId = existing._id as mongoose.Types.ObjectId;
                } else {
                    const created = await CuratedMatch.create({
                        vacancyId,
                        cvId: resolvedCv._id,
                        employerId: vacancyEmployerId,
                        status: 'contact-requested',
                        source: 'apply',
                        contactRequestedAt: new Date(),
                    });
                    curatedMatchId = created._id as mongoose.Types.ObjectId;
                }
            } catch (err) {
                console.error('CuratedMatch upsert (apply) failed:', err instanceof Error ? err.message : err);
            }

            // MatchEvent log met cross-link naar de curated match.
            try {
                await MatchEvent.create({
                    cvId: resolvedCv._id,
                    cvFullName: resolvedCv.fullName,
                    vacancyId,
                    vacancyTitle: vacancyForEmail.title,
                    score: vacancyForEmail.matchScore || 0,
                    matchType: 'AI Semantic',
                    source: 'apply',
                    curatedMatchId: curatedMatchId || undefined,
                });
            } catch (err) {
                console.error('MatchEvent log (apply) failed:', err instanceof Error ? err.message : err);
            }
        }

        const recipients = Array.from(new Set([
            APPLICATIONS_EMAIL,
            ...(process.env.RECIPIENT_EMAIL ? [process.env.RECIPIENT_EMAIL] : []),
        ].filter(Boolean)));

        const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
        if (attachmentBuffer && attachmentFileName) {
            attachments.push({
                filename: attachmentFileName,
                content: attachmentBuffer,
                contentType: attachmentFileType || 'application/octet-stream',
            });
        }

        try {
            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: recipients,
                replyTo: candidateEmail || undefined,
                subject: `Sollicitatie: ${candidateName || candidateEmail || 'Onbekend'} → ${vacancyForEmail.title}`,
                html,
                attachments,
            });
            console.log(`Application email sent to ${recipients.join(', ')}: ${candidateName} → ${vacancyForEmail.title}${attachments.length ? ' (with CV)' : ' (no CV)'}`);
        } catch (err) {
            console.error('Application email failed:', err instanceof Error ? err.message : err);
        }

        // candidateEmail NIET teruggeven: deze route is onauth en accepteert een
        // willekeurige cvId. Het echoën van het e-mailadres maakte e-mail-harvesting
        // mogelijk (publieke search-cvs lekt CV-ids → apply-vacancy gaf het adres terug).
        return NextResponse.json({
            success: true,
            message: 'Sollicitatie verzonden',
            cvId: resolvedCv ? String(resolvedCv._id) : null,
        });
    } catch (err) {
        console.error('Error applying to vacancy:', err);
        return NextResponse.json(
            { success: false, message: 'Sollicitatie versturen mislukt' },
            { status: 500 },
        );
    }
}
