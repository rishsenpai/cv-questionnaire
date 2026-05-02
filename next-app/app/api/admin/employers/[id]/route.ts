import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid employer id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json();
        const { companyName, contactEmail, plan, isActive, password } = body || {};

        const employer = await Employer.findById(id);
        if (!employer) {
            return NextResponse.json({ success: false, message: 'Employer not found' }, { status: 404 });
        }

        if (companyName) employer.companyName = companyName;
        if (contactEmail !== undefined) employer.contactEmail = contactEmail;
        if (plan !== undefined) employer.plan = plan;
        if (isActive !== undefined) employer.isActive = isActive;
        if (password) {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                return NextResponse.json(
                    { success: false, message: 'Password must be at least 8 characters with at least one letter and one number' },
                    { status: 400 },
                );
            }
            employer.password = password;
        }

        await employer.save();
        return NextResponse.json({ success: true, message: 'Employer updated' });
    } catch (err) {
        console.error('Error updating employer:', err);
        return NextResponse.json({ success: false, message: 'Failed to update employer' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid employer id' }, { status: 400 });
        }
        await connectDB();
        await Employer.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Employer deleted' });
    } catch (err) {
        console.error('Error deleting employer:', err);
        return NextResponse.json({ success: false, message: 'Failed to delete employer' }, { status: 500 });
    }
}
