import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import CandidateToken from '@/models/CandidateToken';
import PasswordResetToken from '@/models/PasswordResetToken';
import { consumeResetToken } from '@/lib/server/passwordReset';
import { getClientIP } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { token, password } = body || {};

        if (!token || !password) {
            return NextResponse.json(
                { success: false, message: 'Token en wachtwoord zijn verplicht.' },
                { status: 400 },
            );
        }

        if (String(password).length < 8) {
            return NextResponse.json(
                { success: false, message: 'Wachtwoord moet minimaal 8 tekens zijn.' },
                { status: 400 },
            );
        }

        const tokenDoc = await consumeResetToken(String(token), 'candidate');
        if (!tokenDoc) {
            return NextResponse.json(
                { success: false, message: 'Deze herstellink is ongeldig of verlopen. Vraag een nieuwe aan.' },
                { status: 400 },
            );
        }

        const candidate = await Candidate.findById(tokenDoc.userId);
        if (!candidate || !candidate.isActive) {
            await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
            return NextResponse.json(
                { success: false, message: 'Account niet gevonden.' },
                { status: 400 },
            );
        }

        // Nieuw wachtwoord; pre('save') hasht het en de account-lock wordt opgeheven.
        candidate.password = String(password);
        candidate.failedLoginAttempts = 0;
        candidate.lockUntil = null;
        await candidate.save();

        // Token verbruiken + alle bestaande sessies ongeldig maken.
        await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
        await CandidateToken.deleteMany({ candidateId: candidate._id });

        console.log(`[SECURITY] Candidate password reset completed: ${candidate.email} from IP: ${getClientIP(req)}`);
        return NextResponse.json({ success: true, message: 'Je wachtwoord is opnieuw ingesteld. Je kunt nu inloggen.' });
    } catch (err) {
        console.error('Candidate reset-password error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Wachtwoord opnieuw instellen mislukt.' }, { status: 500 });
    }
}
