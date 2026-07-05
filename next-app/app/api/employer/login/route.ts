import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import EmployerToken from '@/models/EmployerToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'employer-login', limit: 20, windowMs: 15 * 60 * 1000 });
        if (limited) return limited;

        await connectDB();
        const body = await req.json();
        const { username, password } = body || {};

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password required' },
                { status: 400 },
            );
        }

        const employer = await Employer.findOne({ username: String(username).toLowerCase(), isActive: true });

        if (!employer) {
            console.warn(`[SECURITY] Failed employer login attempt for unknown user: ${username} from IP: ${getClientIP(req)}`);
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        if (employer.isLocked()) {
            const minutesLeft = employer.getLockTimeRemaining();
            console.warn(`[SECURITY] Login attempt on locked account: ${username} from IP: ${getClientIP(req)}`);
            return NextResponse.json(
                {
                    success: false,
                    message: `Account is locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
                    locked: true,
                    minutesRemaining: minutesLeft,
                },
                { status: 423 },
            );
        }

        const isValidPassword = await employer.checkPassword(password);
        if (!isValidPassword) {
            await employer.incLoginAttempts();
            const attemptsLeft = 5 - (employer.failedLoginAttempts + 1);
            console.warn(`[SECURITY] Failed employer login attempt for user: ${username} from IP: ${getClientIP(req)} (${attemptsLeft} attempts left)`);
            return NextResponse.json(
                {
                    success: false,
                    message: attemptsLeft > 0
                        ? `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
                        : 'Account locked due to too many failed attempts. Try again in 15 minutes.',
                },
                { status: 401 },
            );
        }

        await employer.resetLoginAttempts();
        console.log(`[SECURITY] Employer login successful: ${employer.companyName} from IP: ${getClientIP(req)}`);

        const token = generateToken();
        const expires = new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MS);

        await EmployerToken.findOneAndUpdate(
            { employerId: employer._id },
            { token, employerId: employer._id, expires },
            { upsert: true, new: true },
        );

        return NextResponse.json({
            success: true,
            token,
            employer: {
                companyName: employer.companyName,
                plan: employer.plan || 'basic',
            },
        });
    } catch (err) {
        console.error('Employer login error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 });
    }
}
