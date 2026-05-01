import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token } = body || {};
        if (await validateAdminToken(token)) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 },
        );
    } catch {
        return NextResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 },
        );
    }
}
