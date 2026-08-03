// Promoot een 'suggested' CuratedMatch naar 'presented' en stuurt een
// notificatie. Voor werkgever-vacatures: anonieme mail naar werkgever-portaal.
// Voor admin/internal vacatures: mail naar admin-team met volledige
// kandidaatgegevens zodat het team zelf contact kan opnemen.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';
import { getTransporter } from '@/lib/server/mailer';

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@beyondjobs.nl';

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json().catch(() => ({}));
        const { adminNote, sendEmail = true } = body || {};

        const match = await CuratedMatch.findById(id);
        if (!match) return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        if (match.status !== 'suggested') {
            return NextResponse.json({ success: false, message: `Status is "${match.status}", alleen "suggested" kan gepromoot worden` }, { status: 400 });
        }
        // Vervulde vacatures kunnen geen nieuwe pushes meer ontvangen.
        const vacancyCheck = await Vacancy.findById(match.vacancyId).select('fulfilledAt title');
        if (vacancyCheck?.fulfilledAt) {
            return NextResponse.json({
                success: false,
                message: `Vacature "${vacancyCheck.title}" is gemarkeerd als vervuld. Heropen de vacature voordat je nog pushes uitvoert.`,
            }, { status: 409 });
        }

        match.status = 'presented';
        match.promotedAt = new Date();
        if (adminNote !== undefined) match.adminNote = adminNote;
        await match.save();

        let emailSent = false;
        if (sendEmail) {
            try {
                const vacancy = await Vacancy.findById(match.vacancyId).select('title employerId location');
                if (!vacancy) {
                    // niets te doen
                } else if (vacancy.employerId) {
                    // Werkgever-vacature → anoniem bericht naar werkgever-portaal
                    const employer = await Employer.findById(vacancy.employerId).select('contactEmail companyName username');
                    if (employer?.contactEmail) {
                        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
                        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Nieuwe match in je portaal</h2>
  <p>Hoi ${employer.companyName || employer.username},</p>
  <p>Er staat een nieuwe geanonimiseerde match klaar voor je vacature:</p>
  <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0;"><strong>${vacancy.title}</strong></p>
  </div>
  ${match.adminNote ? `<div style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 20px 0;"><p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;"><strong>Notitie van Jobparsing+</strong></p><p style="margin: 0; color: #475569;">${match.adminNote}</p></div>` : ''}
  <p>
    <a href="${baseUrl}/dashboard/company" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Open portaal
    </a>
  </p>
</div>`;
                        await getTransporter().sendMail({
                            from: process.env.EMAIL_USER,
                            to: employer.contactEmail,
                            replyTo: APPLICATIONS_EMAIL,
                            subject: `Nieuwe match voor vacature: ${vacancy.title}`,
                            html,
                        });
                        match.notifiedAt = new Date();
                        await match.save();
                        emailSent = true;
                    }
                } else {
                    // Admin/internal → email naar admin-team met FULL kandidaat-info
                    const cv = await CV.findById(match.cvId).select('fullName email phone jobTitle location');
                    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
                    const scorePart = match.matchScore !== undefined ? ` (${match.matchScore}% match)` : '';
                    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Admin push: kandidaat → vacature</h2>
  <p>Een AI-suggestie is gepromoot voor een interne vacature. Tijd om contact op te nemen met de kandidaat.</p>
  <div style="background: #ebf8ff; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Vacature:</strong> ${vacancy.title}${vacancy.location ? ` · ${vacancy.location}` : ''}</p>
    <p style="margin: 0;"><strong>Kandidaat:</strong> ${cv?.fullName || '—'}${scorePart}</p>
    ${cv?.jobTitle ? `<p style="margin: 8px 0 0 0; color: #475569;">Functie: ${cv.jobTitle}</p>` : ''}
    ${cv?.location ? `<p style="margin: 4px 0 0 0; color: #475569;">Locatie: ${cv.location}</p>` : ''}
    ${cv?.email ? `<p style="margin: 4px 0 0 0; color: #475569;">Email: <a href="mailto:${cv.email}">${cv.email}</a></p>` : ''}
    ${cv?.phone ? `<p style="margin: 4px 0 0 0; color: #475569;">Telefoon: ${cv.phone}</p>` : ''}
  </div>
  ${match.adminNote ? `<p style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b;"><strong>Admin notitie:</strong> ${match.adminNote}</p>` : ''}
  <p>
    <a href="${baseUrl}/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Open admin
    </a>
  </p>
</div>`;
                    await getTransporter().sendMail({
                        from: process.env.EMAIL_USER,
                        to: APPLICATIONS_EMAIL,
                        subject: `Admin-push: ${cv?.fullName || 'Kandidaat'} → ${vacancy.title}`,
                        html,
                    });
                    match.notifiedAt = new Date();
                    await match.save();
                    emailSent = true;
                }
            } catch (err) {
                console.error('promote notify failed:', err instanceof Error ? err.message : err);
            }
        }

        return NextResponse.json({ success: true, curatedMatch: match, emailSent });
    } catch (err) {
        console.error('promote error:', err);
        return NextResponse.json({ success: false, message: 'Promote mislukt' }, { status: 500 });
    }
}
