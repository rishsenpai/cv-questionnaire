import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { getTransporter } from '@/lib/server/mailer';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { escapeHtml } from '@/lib/server/security';

interface Interest {
    title: string;
    location: string;
    count: number;
}

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'send-interests', limit: 20, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const { cvId, interests } = body || {};

        if (!cvId || !interests || !Array.isArray(interests) || interests.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Missing cvId or interests' },
                { status: 400 },
            );
        }

        await connectDB();
        const cv = await CV.findById(cvId);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        const interestsHtml = (interests as Interest[]).map(i => `
                <li style="padding: 8px 0; border-bottom: 1px solid #c6f6d5;">
                    <strong>${escapeHtml(i.title)}</strong><br>
                    📍 ${escapeHtml(i.location)} • ${Number(i.count) || 0} vacature${Number(i.count) > 1 ? 's' : ''}
                </li>`).join('');

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #38a169;">Nieuwe Kandidaat Interesse</h2>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Kandidaat Gegevens</h3>
        <p><strong>Naam:</strong> ${cv.fullName}</p>
        <p><strong>Email:</strong> ${cv.email || 'Niet opgegeven'}</p>
        <p><strong>Telefoon:</strong> ${cv.phone || 'Niet opgegeven'}</p>
        <p><strong>Locatie:</strong> ${cv.location || 'Niet opgegeven'}</p>
        <p><strong>Huidige/Gewenste functie:</strong> ${cv.jobTitle || 'Niet opgegeven'}</p>
    </div>
    <div style="background: #f0fff4; padding: 20px; border-radius: 8px; border: 1px solid #9ae6b4;">
        <h3 style="margin-top: 0; color: #276749;">Geselecteerde Interesses</h3>
        <p>De kandidaat heeft interesse in de volgende vacatures:</p>
        <ul style="list-style: none; padding: 0;">${interestsHtml}</ul>
    </div>
    <p style="margin-top: 20px; color: #718096; font-size: 14px;">
        CV ID: ${cvId}<br>
        Ontvangen: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
    </p>
    <p style="margin-top: 20px;">
        <a href="${baseUrl}/admin" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekijk in Admin Panel
        </a>
    </p>
</div>`;

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.RECIPIENT_EMAIL,
            subject: `🎯 Nieuwe interesse: ${cv.fullName}`,
            html,
        });
        console.log(`Interest email sent for CV: ${cvId} (${cv.fullName}) - ${interests.length} interests`);

        return NextResponse.json({ success: true, message: 'Interests sent successfully' });
    } catch (err) {
        console.error('Error sending interests:', err);
        return NextResponse.json({ success: false, message: 'Failed to send interests' }, { status: 500 });
    }
}
