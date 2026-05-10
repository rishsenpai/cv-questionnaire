// Promoot een 'suggested' CuratedMatch naar 'presented' en stuurt de
// werkgever een notificatie-mail (zelfde template als handmatige push).

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import { requireAdmin } from '@/lib/server/auth';
import { getTransporter } from '@/lib/server/mailer';

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@jobparsing.com';

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

        match.status = 'presented';
        match.promotedAt = new Date();
        if (adminNote !== undefined) match.adminNote = adminNote;
        await match.save();

        let emailSent = false;
        if (sendEmail) {
            try {
                const [vacancy, employer] = await Promise.all([
                    Vacancy.findById(match.vacancyId).select('title'),
                    Employer.findById(match.employerId).select('contactEmail companyName username'),
                ]);
                if (vacancy && employer?.contactEmail) {
                    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
                    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Nieuwe match in je portaal</h2>
  <p>Hoi ${employer.companyName || employer.username},</p>
  <p>Er staat een nieuwe geanonimiseerde match klaar voor je vacature:</p>
  <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0;"><strong>${vacancy.title}</strong></p>
  </div>
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
