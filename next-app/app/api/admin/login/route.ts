import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminToken from '@/models/AdminToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body || {};
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return NextResponse.json(
                { success: false, message: 'Admin password not configured' },
                { status: 500 },
            );
        }

        if (password !== adminPassword) {
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
