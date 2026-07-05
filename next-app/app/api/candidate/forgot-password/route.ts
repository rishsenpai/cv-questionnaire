import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import { createResetToken, sendPasswordResetEmail, getBaseUrl } from '@/lib/server/passwordReset';
import { getClientIP } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rateLimit';

// Generieke melding: nooit prijsgeven of een e-mailadres wel/niet bestaat.
const GENERIC_MESSAGE = 'Als dit e-mailadres bij ons bekend is, ontvang je een e-mail met een herstellink.';

export async function POST(req: NextRequest) {
    try {
        // Begrens: voorkomt reset-mail-bombardement van een slachtoffer + enumeratie.
        const limited = await enforceRateLimit(req, { name: 'candidate-forgot-pw', limit: 10, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        await connectDB();
        const body = await req.json();
        const { email } = body || {};

        if (!email || !validator.isEmail(String(email))) {
            // Ook bij ongeldige input dezelfde melding (geen enumeratie).
            return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const candidate = await Candidate.findOne({ email: normalizedEmail, isActive: true });

        if (candidate) {
            const rawToken = await createResetToken('candidate', candidate._id as import('mongoose').Types.ObjectId);
            const resetUrl = `${getBaseUrl()}/wachtwoord-herstellen?token=${rawToken}&type=candidate`;
            try {
                await sendPasswordResetEmail({
                    to: candidate.email,
                    resetUrl,
                    displayName: candidate.fullName,
                });
                console.log(`[SECURITY] Password reset requested for candidate: ${candidate.email} from IP: ${getClientIP(req)}`);
            } catch (mailErr) {
                console.error('Failed to send candidate reset email:', mailErr instanceof Error ? mailErr.message : mailErr);
            }
        } else {
            console.warn(`[SECURITY] Password reset for unknown candidate email: ${normalizedEmail} from IP: ${getClientIP(req)}`);
        }

        return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    } catch (err) {
        console.error('Candidate forgot-password error:', err instanceof Error ? err.message : err);
        // Ook bij fouten generieke melding teruggeven.
        return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }
}
