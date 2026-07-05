import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import { createResetToken, sendPasswordResetEmail, getBaseUrl } from '@/lib/server/passwordReset';
import { getClientIP } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rateLimit';

// Generieke melding: nooit prijsgeven of een account wel/niet bestaat.
const GENERIC_MESSAGE = 'Als dit account bij ons bekend is, ontvang je een e-mail met een herstellink.';

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'employer-forgot-pw', limit: 10, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        await connectDB();
        const body = await req.json();
        // Werkgever logt in met gebruikersnaam, maar mag hier ook z'n contact-e-mail invullen.
        const { identifier } = body || {};

        if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
            return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
        }

        const value = identifier.toLowerCase().trim();
        const employer = await Employer.findOne({
            isActive: true,
            $or: [{ username: value }, { contactEmail: value }],
        });

        if (employer && employer.contactEmail) {
            const rawToken = await createResetToken('employer', employer._id as import('mongoose').Types.ObjectId);
            const resetUrl = `${getBaseUrl()}/wachtwoord-herstellen?token=${rawToken}&type=employer`;
            try {
                await sendPasswordResetEmail({
                    to: employer.contactEmail,
                    resetUrl,
                    displayName: employer.companyName,
                });
                console.log(`[SECURITY] Password reset requested for employer: ${employer.username} from IP: ${getClientIP(req)}`);
            } catch (mailErr) {
                console.error('Failed to send employer reset email:', mailErr instanceof Error ? mailErr.message : mailErr);
            }
        } else if (employer && !employer.contactEmail) {
            // Account bestaat maar heeft geen contact-e-mail: kan niet automatisch herstellen.
            console.warn(`[SECURITY] Password reset requested but no contactEmail for employer: ${employer.username}`);
        } else {
            console.warn(`[SECURITY] Password reset for unknown employer: ${value} from IP: ${getClientIP(req)}`);
        }

        return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    } catch (err) {
        console.error('Employer forgot-password error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }
}
