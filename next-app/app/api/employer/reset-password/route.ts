import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import EmployerToken from '@/models/EmployerToken';
import PasswordResetToken from '@/models/PasswordResetToken';
import { consumeResetToken } from '@/lib/server/passwordReset';
import { getClientIP } from '@/lib/server/auth';

// Zelfde eis als bij werkgever-registratie: min. 8 tekens, letter én cijfer.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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

        if (!PASSWORD_RULE.test(String(password))) {
            return NextResponse.json(
                { success: false, message: 'Wachtwoord moet minimaal 8 tekens zijn, met een letter én een cijfer.' },
                { status: 400 },
            );
        }

        const tokenDoc = await consumeResetToken(String(token), 'employer');
        if (!tokenDoc) {
            return NextResponse.json(
                { success: false, message: 'Deze herstellink is ongeldig of verlopen. Vraag een nieuwe aan.' },
                { status: 400 },
            );
        }

        const employer = await Employer.findById(tokenDoc.userId);
        if (!employer || !employer.isActive) {
            await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
            return NextResponse.json(
                { success: false, message: 'Account niet gevonden.' },
                { status: 400 },
            );
        }

        // Nieuw wachtwoord; pre('save') hasht het en de account-lock wordt opgeheven.
        employer.password = String(password);
        employer.failedLoginAttempts = 0;
        employer.lockUntil = null;
        await employer.save();

        // Token verbruiken + alle bestaande sessies ongeldig maken.
        await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
        await EmployerToken.deleteMany({ employerId: employer._id });

        console.log(`[SECURITY] Employer password reset completed: ${employer.username} from IP: ${getClientIP(req)}`);
        return NextResponse.json({ success: true, message: 'Je wachtwoord is opnieuw ingesteld. Je kunt nu inloggen.' });
    } catch (err) {
        console.error('Employer reset-password error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Wachtwoord opnieuw instellen mislukt.' }, { status: 500 });
    }
}
