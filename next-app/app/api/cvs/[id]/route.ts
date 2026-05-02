import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findById(id);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: cv });
    } catch (err) {
        console.error('Error fetching CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch CV' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findByIdAndDelete(id);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'CV deleted successfully' });
    } catch (err) {
        console.error('Error deleting CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to delete CV' }, { status: 500 });
    }
}

const ALLOWED_UPDATE_FIELDS = [
    'fullName', 'jobTitle', 'location', 'email', 'phone',
    'summary', 'experience', 'education', 'skills', 'fullText', 'languages',
] as const;

export async function PUT(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();

        const body = await req.json();
        const filtered: Record<string, unknown> = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (body[field] !== undefined) filtered[field] = body[field];
        }

        const cv = await CV.findByIdAndUpdate(id, { $set: filtered }, { new: true });
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'CV updated successfully', cv });
    } catch (err) {
        console.error('Error updating CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to update CV' }, { status: 500 });
    }
}
