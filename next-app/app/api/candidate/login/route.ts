import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import CandidateToken from '@/models/CandidateToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';
import { linkCvsByEmail } from '@/lib/server/candidateCvLink';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { email, password } = body || {};

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password required' },
                { status: 400 },
            );
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const candidate = await Candidate.findOne({ email: normalizedEmail, isActive: true });

        if (!candidate) {
            console.warn(`[SECURITY] Failed candidate login for unknown email: ${normalizedEmail} from IP: ${getClientIP(req)}`);
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 },
            );
        }

        if (candidate.isLocked()) {
            const minutesLeft = candidate.getLockTimeRemaining();
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

        const isValidPassword = await candidate.checkPassword(password);
        if (!isValidPassword) {
            await candidate.incLoginAttempts();
            const attemptsLeft = 5 - (candidate.failedLoginAttempts + 1);
            console.warn(`[SECURITY] Failed candidate login: ${normalizedEmail} from IP: ${getClientIP(req)} (${attemptsLeft} attempts left)`);
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

        await candidate.resetLoginAttempts();
        console.log(`[SECURITY] Candidate login successful: ${candidate.email} from IP: ${getClientIP(req)}`);

        // Eventueel sinds vorige login geüploade CVs alsnog koppelen.
        try {
            await linkCvsByEmail(candidate._id as import('mongoose').Types.ObjectId, candidate.email);
        } catch (err) {
            console.error('linkCvsByEmail (login) failed:', err instanceof Error ? err.message : err);
        }

        const token = generateToken();
        await CandidateToken.findOneAndUpdate(
            { candidateId: candidate._id },
            { token, candidateId: candidate._id, expires: new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MS) },
            { upsert: true, new: true },
        );

        return NextResponse.json({
            success: true,
            token,
            candidate: {
                email: candidate.email,
                fullName: candidate.fullName,
            },
        });
    } catch (err) {
        console.error('Candidate login error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 });
    }
}
