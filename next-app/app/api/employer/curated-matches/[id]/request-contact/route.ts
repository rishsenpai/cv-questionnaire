import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import CV from '@/models/CV';
import { requireEmployer } from '@/lib/server/auth';
import { getTransporter } from '@/lib/server/mailer';

export const maxDuration = 30;

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@beyondjobs.nl';

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json().catch(() => ({}));
        const note = (body?.note || '').toString().slice(0, 1000);

        const match = await CuratedMatch.findOne({ _id: id, employerId: auth.employerId });
        if (!match) {
            return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        }

        match.status = 'contact-requested';
        match.contactRequestedAt = new Date();
        await match.save();

        try {
            const [employer, vacancy, cv] = await Promise.all([
                Employer.findById(auth.employerId).select('companyName username contactEmail'),
                Vacancy.findById(match.vacancyId).select('title location'),
                CV.findById(match.cvId).select('fullName jobTitle location'),
            ]);

            const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Werkgever wil contact met kandidaat</h2>
  <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Werkgever</h3>
    <p><strong>Bedrijf:</strong> ${employer?.companyName || '—'}</p>
    <p><strong>Username:</strong> ${employer?.username || '—'}</p>
    <p><strong>Contact:</strong> ${employer?.contactEmail || '—'}</p>
  </div>
  <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border: 1px solid #90cdf4; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #2b6cb0;">Vacature</h3>
    <p><strong>Titel:</strong> ${vacancy?.title || '—'}</p>
  </div>
  <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Kandidaat (CV)</h3>
    <p><strong>Naam:</strong> ${cv?.fullName || '—'}</p>
    <p><strong>Functie:</strong> ${cv?.jobTitle || '—'}</p>
    <p><strong>CV ID:</strong> ${match.cvId}</p>
  </div>
  ${note ? `<div style="background: #fff; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;"><p><strong>Notitie van werkgever:</strong></p><p>${note.replace(/\n/g, '<br>')}</p></div>` : ''}
  <p style="color: #718096; font-size: 13px;">
    CuratedMatch ID: ${match._id}<br>
    ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
  </p>
</div>`;
            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: APPLICATIONS_EMAIL,
                replyTo: employer?.contactEmail || undefined,
                subject: `Contact-aanvraag: ${employer?.companyName || 'Werkgever'} → ${cv?.fullName || 'kandidaat'} (${vacancy?.title || ''})`,
                html,
            });
        } catch (err) {
            console.error('Contact-request email failed:', err instanceof Error ? err.message : err);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('request-contact error:', err);
        return NextResponse.json({ success: false, message: 'Aanvraag mislukt' }, { status: 500 });
    }
}
