import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { getTransporter } from '@/lib/server/mailer';
import { enforceRateLimit } from '@/lib/server/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'request-recruiter', limit: 20, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const { cvId } = body || {};

        if (cvId && mongoose.Types.ObjectId.isValid(cvId)) {
            await connectDB();
            const cv = await CV.findById(cvId);
            if (cv) {
                cv.recruiterRequested = true;
                cv.recruiterRequestedAt = new Date();
                await cv.save();
                console.log(`Recruiter requested for CV: ${cvId} (${cv.fullName})`);

                const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
                const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #764ba2;">📞 Recruiter Aangevraagd</h2>
    <p>Een kandidaat wil graag persoonlijk geholpen worden door een recruiter van BeyondJobs.</p>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Kandidaat Gegevens</h3>
        <p><strong>Naam:</strong> ${cv.fullName}</p>
        <p><strong>Email:</strong> ${cv.email || 'Niet opgegeven'}</p>
        <p><strong>Telefoon:</strong> ${cv.phone || 'Niet opgegeven'}</p>
        <p><strong>Locatie:</strong> ${cv.location || 'Niet opgegeven'}</p>
        <p><strong>Huidige/Gewenste functie:</strong> ${cv.jobTitle || 'Niet opgegeven'}</p>
    </div>
    <p style="margin-top: 20px; color: #718096; font-size: 14px;">
        CV ID: ${cvId}<br>
        Aangevraagd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
    </p>
    <p style="margin-top: 20px;">
        <a href="${baseUrl}/admin" style="background: #764ba2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk in Admin Panel
        </a>
    </p>
</div>`;

                await getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: process.env.RECIPIENT_EMAIL,
                    subject: `📞 Recruiter aangevraagd: ${cv.fullName}`,
                    html,
                });
                console.log(`Recruiter request email sent for CV: ${cvId} (${cv.fullName})`);
            }
        }

        return NextResponse.json({ success: true, message: 'Recruiter request received' });
    } catch (err) {
        console.error('Error saving recruiter request:', err);
        return NextResponse.json({ success: true, message: 'Request logged' });
    }
}
