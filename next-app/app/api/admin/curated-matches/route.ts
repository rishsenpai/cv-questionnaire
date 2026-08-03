import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';
import { getTransporter } from '@/lib/server/mailer';

export const maxDuration = 30;

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@beyondjobs.nl';

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const body = await req.json();
        const { vacancyId, cvId, adminNote, matchScore, sendEmail = true } = body || {};

        if (!vacancyId || !mongoose.Types.ObjectId.isValid(vacancyId)) {
            return NextResponse.json({ success: false, message: 'Ongeldig vacancyId' }, { status: 400 });
        }
        if (!cvId || !mongoose.Types.ObjectId.isValid(cvId)) {
            return NextResponse.json({ success: false, message: 'Ongeldig cvId' }, { status: 400 });
        }

        await connectDB();

        const vacancy = await Vacancy.findById(vacancyId).select('title employerId company location fulfilledAt');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }
        if (vacancy.fulfilledAt) {
            return NextResponse.json({
                success: false,
                message: `Vacature "${vacancy.title}" is gemarkeerd als vervuld. Heropen 'm eerst.`,
            }, { status: 409 });
        }
        // Geen werkgever = admin/internal vacature → email gaat naar het admin-team
        // i.p.v. naar een werkgever-portaal.

        const cv = await CV.findById(cvId).select('_id fullName email phone jobTitle location');
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV niet gevonden' }, { status: 404 });
        }

        const existing = await CuratedMatch.findOne({ vacancyId, cvId });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Deze CV is al aan deze vacature gekoppeld', existingId: String(existing._id) },
                { status: 409 },
            );
        }

        const curated = await CuratedMatch.create({
            vacancyId,
            cvId,
            employerId: vacancy.employerId, // undefined voor admin/internal — schema staat dit toe
            adminNote,
            matchScore,
            status: 'presented',
        });

        let emailSent = false;
        if (sendEmail) {
            try {
                const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
                if (vacancy.employerId) {
                    // Werkgever-vacature → bericht naar werkgever-portaal (anoniem)
                    const employer = await Employer.findById(vacancy.employerId).select('contactEmail companyName username');
                    if (employer?.contactEmail) {
                        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Nieuwe match in je portaal</h2>
  <p>Hoi ${employer.companyName || employer.username},</p>
  <p>Er staat een nieuwe geanonimiseerde match klaar voor je vacature:</p>
  <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0;"><strong>${vacancy.title}</strong></p>
  </div>
  ${adminNote ? `<div style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 20px 0;"><p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;"><strong>Notitie van Jobparsing+</strong></p><p style="margin: 0; color: #475569;">${adminNote}</p></div>` : ''}
  <p>Bekijk de match in je portaal:</p>
  <p>
    <a href="${baseUrl}/dashboard/company" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Open portaal
    </a>
  </p>
  <p style="color: #718096; font-size: 13px; margin-top: 20px;">
    Wil je in contact komen met deze kandidaat? Klik op &quot;Vraag contactgegevens aan&quot; in het portaal — wij regelen het verder.
  </p>
</div>`;
                        await getTransporter().sendMail({
                            from: process.env.EMAIL_USER,
                            to: employer.contactEmail,
                            replyTo: APPLICATIONS_EMAIL,
                            subject: `Nieuwe match voor vacature: ${vacancy.title}`,
                            html,
                        });
                        await CuratedMatch.findByIdAndUpdate(curated._id, { notifiedAt: new Date() });
                        emailSent = true;
                    }
                } else {
                    // Admin/internal vacature → bericht naar admin-team met FULL kandidaat-info
                    const scorePart = matchScore !== undefined ? ` (${matchScore}% match)` : '';
                    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Admin push: kandidaat → vacature</h2>
  <p>Een admin heeft een kandidaat gekoppeld aan een interne vacature. Tijd om contact op te nemen met de kandidaat.</p>
  <div style="background: #ebf8ff; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Vacature:</strong> ${vacancy.title}${vacancy.location ? ` · ${vacancy.location}` : ''}</p>
    <p style="margin: 0;"><strong>Kandidaat:</strong> ${cv.fullName || '—'}${scorePart}</p>
    ${cv.jobTitle ? `<p style="margin: 8px 0 0 0; color: #475569;">Functie: ${cv.jobTitle}</p>` : ''}
    ${cv.location ? `<p style="margin: 4px 0 0 0; color: #475569;">Locatie: ${cv.location}</p>` : ''}
    ${cv.email ? `<p style="margin: 4px 0 0 0; color: #475569;">Email: <a href="mailto:${cv.email}">${cv.email}</a></p>` : ''}
    ${cv.phone ? `<p style="margin: 4px 0 0 0; color: #475569;">Telefoon: ${cv.phone}</p>` : ''}
  </div>
  ${adminNote ? `<p style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b;"><strong>Admin notitie:</strong> ${adminNote}</p>` : ''}
  <p>
    <a href="${baseUrl}/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Open admin
    </a>
  </p>
</div>`;
                    await getTransporter().sendMail({
                        from: process.env.EMAIL_USER,
                        to: APPLICATIONS_EMAIL,
                        subject: `Admin-push: ${cv.fullName || 'Kandidaat'} → ${vacancy.title}`,
                        html,
                    });
                    await CuratedMatch.findByIdAndUpdate(curated._id, { notifiedAt: new Date() });
                    emailSent = true;
                }
            } catch (err) {
                console.error('Curated match notification failed:', err instanceof Error ? err.message : err);
            }
        }

        return NextResponse.json({
            success: true,
            curatedMatchId: String(curated._id),
            emailSent,
        });
    } catch (err) {
        console.error('curated-matches POST error:', err);
        return NextResponse.json({ success: false, message: 'Push mislukt' }, { status: 500 });
    }
}
