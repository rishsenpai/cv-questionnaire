import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import CandidateToken from '@/models/CandidateToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';
import { linkCvsByEmail } from '@/lib/server/candidateCvLink';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { notifySignup } from '@/lib/server/signupNotify';

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'candidate-register', limit: 10, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        await connectDB();
        const body = await req.json();
        const { email, password, fullName, phone, location } = body || {};

        if (!email || !password || !fullName) {
            return NextResponse.json(
                { success: false, message: 'Email, password and full name are required' },
                { status: 400 },
            );
        }

        if (!validator.isEmail(String(email))) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address' },
                { status: 400 },
            );
        }

        if (String(password).length < 8) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 8 characters' },
                { status: 400 },
            );
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await Candidate.findOne({ email: normalizedEmail });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Email is already registered' },
                { status: 409 },
            );
        }

        const candidate = await Candidate.create({
            email: normalizedEmail,
            password,
            fullName: String(fullName).trim(),
            phone: phone ? String(phone).trim() : undefined,
            location: location ? String(location).trim() : undefined,
        });

        // Eerder ingediende CVs met dezelfde email koppelen aan dit account.
        try {
            const linked = await linkCvsByEmail(candidate._id as import('mongoose').Types.ObjectId, normalizedEmail);
            if (linked > 0) console.log(`[candidate] linked ${linked} CV(s) to ${normalizedEmail}`);
        } catch (err) {
            console.error('linkCvsByEmail (register) failed:', err instanceof Error ? err.message : err);
        }

        const token = generateToken();
        await CandidateToken.create({
            token,
            candidateId: candidate._id,
            expires: new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MS),
        });

        console.log(`[SECURITY] Candidate registered: ${candidate.email} from IP: ${getClientIP(req)}`);

        // Bewust geen await: notificatie mag de registratie niet vertragen.
        notifySignup({
            type: 'candidate',
            name: candidate.fullName,
            email: candidate.email,
            phone: candidate.phone,
        });

        return NextResponse.json({
            success: true,
            token,
            candidate: {
                email: candidate.email,
                fullName: candidate.fullName,
            },
        });
    } catch (err) {
        console.error('Candidate register error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
    }
}
