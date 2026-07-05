import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import AdminToken from '@/models/AdminToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rateLimit';

// Constant-time vergelijking zodat de responstijd niets over het wachtwoord
// prijsgeeft. Lengtes-mismatch valt bewust vóór timingSafeEqual (dat gooit bij
// ongelijke buffergroottes).
function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
    try {
        // Rem online brute-force tegen het statische admin-wachtwoord af.
        const limited = await enforceRateLimit(req, { name: 'admin-login', limit: 10, windowMs: 15 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const { password } = body || {};
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return NextResponse.json(
                { success: false, message: 'Admin password not configured' },
                { status: 500 },
            );
        }

        if (typeof password !== 'string' || !safeEqual(password, adminPassword)) {
            console.warn(`[SECURITY] Failed admin login attempt from IP: ${getClientIP(req)}`);
            return NextResponse.json(
                { success: false, message: 'Invalid password' },
                { status: 401 },
            );
        }

        await connectDB();
        const token = generateToken();
        await AdminToken.create({
            token,
            expires: new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MS),
        });
        console.log(`[SECURITY] Admin login successful from IP: ${getClientIP(req)}`);
        return NextResponse.json({ success: true, token });
    } catch (err) {
        console.error('Admin login error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 });
    }
}
