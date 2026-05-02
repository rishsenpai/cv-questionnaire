import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import { requireEmployer } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan === 'basic') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Advanced of Premium voor notities' },
            { status: 403 },
        );
    }
    try {
        await connectDB();
        const employer = await Employer.findById(auth.employerId);
        return NextResponse.json({ success: true, data: employer?.notes || [] });
    } catch (err) {
        console.error('Error fetching notes:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch notes' }, { status: 500 });
    }
}
