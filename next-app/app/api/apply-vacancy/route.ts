import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { getTransporter } from '@/lib/server/mailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { cvId, vacancy } = body || {};

        if (!cvId || !vacancy) {
            return NextResponse.json(
                { success: false, message: 'Missing cvId or vacancy' },
                { status: 400 },
            );
        }

        await connectDB();
        const cv = await CV.findById(cvId);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #667eea;">✉️ Nieuwe Sollicitatie</h2>
    <p>Een kandidaat wil solliciteren op een vacature.</p>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Kandidaat Gegevens</h3>
        <p><strong>Naam:</strong> ${cv.fullName}</p>
        <p><strong>Email:</strong> ${cv.email || 'Niet opgegeven'}</p>
        <p><strong>Telefoon:</strong> ${cv.phone || 'Niet opgegeven'}</p>
        <p><strong>Locatie:</strong> ${cv.location || 'Niet opgegeven'}</p>
        <p><strong>Huidige/Gewenste functie:</strong> ${cv.jobTitle || 'Niet opgegeven'}</p>
    </div>
    <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border: 1px solid #90cdf4; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2b6cb0;">Vacature Details</h3>
        <p><strong>Functie:</strong> ${vacancy.title}</p>
        <p><strong>Locatie:</strong> ${vacancy.location}</p>
        <p><strong>Aantal vacatures:</strong> ${vacancy.count}</p>
        <p><strong>Match score:</strong> ${vacancy.matchScore}%</p>
        ${vacancy.employmentType ? `<p><strong>Dienstverband:</strong> ${vacancy.employmentType}</p>` : ''}
        ${vacancy.isRemote ? '<p><strong>Remote:</strong> Ja</p>' : ''}
    </div>
    <p style="margin-top: 20px; color: #718096; font-size: 14px;">
        CV ID: ${cvId}<br>
        Gesolliciteerd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
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
            subject: `✉️ Sollicitatie: ${cv.fullName} → ${vacancy.title}`,
            html,
        });
        console.log(`Application email sent: ${cv.fullName} → ${vacancy.title}`);

        return NextResponse.json({ success: true, message: 'Application sent successfully' });
    } catch (err) {
        console.error('Error applying to vacancy:', err);
        return NextResponse.json(
            { success: false, message: 'Failed to send application' },
            { status: 500 },
        );
    }
}
