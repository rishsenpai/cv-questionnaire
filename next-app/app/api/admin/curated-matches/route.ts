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

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@jobparsing.com';

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

        const vacancy = await Vacancy.findById(vacancyId).select('title employerId company');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }
        if (!vacancy.employerId) {
            return NextResponse.json(
                { success: false, message: 'Vacature heeft geen werkgever — kan niet pushen' },
                { status: 400 },
            );
        }

        const cv = await CV.findById(cvId).select('_id fullName');
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
            employerId: vacancy.employerId,
            adminNote,
            matchScore,
            status: 'presented',
        });

        let emailSent = false;
        if (sendEmail) {
            try {
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
