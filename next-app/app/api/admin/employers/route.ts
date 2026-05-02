import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const employers = await Employer.find().select('-password').sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: employers });
    } catch (err) {
        console.error('Error fetching employers:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch employers' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const body = await req.json();
        const { username, password, companyName, contactEmail, plan, isActive } = body || {};

        if (!username || !password || !companyName) {
            return NextResponse.json(
                { success: false, message: 'Username, password and company name required' },
                { status: 400 },
            );
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 8 characters with at least one letter and one number' },
                { status: 400 },
            );
        }

        const existing = await Employer.findOne({ username: String(username).toLowerCase() });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
        }

        const employer = await Employer.create({
            username,
            password,
            companyName,
            contactEmail,
            plan: plan || 'basic',
            isActive: isActive !== false,
        });

        return NextResponse.json({
            success: true,
            message: 'Employer created',
            data: {
                _id: String(employer._id),
                username: employer.username,
                companyName: employer.companyName,
                plan: employer.plan,
            },
        });
    } catch (err) {
        const e = err as { code?: number; message?: string };
        console.error('Error creating employer:', err);
        return NextResponse.json(
            {
                success: false,
                message: e.code === 11000 ? 'Username already exists' : `Failed to create employer: ${e.message}`,
            },
            { status: 500 },
        );
    }
}
