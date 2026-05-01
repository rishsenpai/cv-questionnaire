import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import EmployerToken from '@/models/EmployerToken';
import Employer from '@/models/Employer';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { token } = body || {};

        const tokenData = await EmployerToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 },
            );
        }

        const employer = await Employer.findById(tokenData.employerId);
        if (!employer || !employer.isActive) {
            await EmployerToken.deleteOne({ token });
            return NextResponse.json({ success: false, message: 'Account inactive' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            plan: employer.plan || 'basic',
            companyName: employer.companyName,
        });
    } catch (err) {
        console.error('Verify error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
    }
}
