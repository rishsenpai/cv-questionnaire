import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import { requireEmployer } from '@/lib/server/auth';

interface Params {
    params: Promise<{ cvId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan === 'basic') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Advanced of Premium voor favorieten' },
            { status: 403 },
        );
    }
    try {
        const { cvId } = await params;
        if (!mongoose.Types.ObjectId.isValid(cvId)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const employer = await Employer.findById(auth.employerId);
        if (!employer) {
            return NextResponse.json({ success: false, message: 'Employer not found' }, { status: 404 });
        }
        if (!employer.favorites) employer.favorites = [];
        const cvObjectId = new mongoose.Types.ObjectId(cvId);
        if (!employer.favorites.some(f => f.toString() === cvId)) {
            employer.favorites.push(cvObjectId);
            await employer.save();
        }
        return NextResponse.json({ success: true, message: 'Added to favorites' });
    } catch (err) {
        console.error('Error adding favorite:', err);
        return NextResponse.json({ success: false, message: 'Failed to add favorite' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan === 'basic') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Advanced of Premium voor favorieten' },
            { status: 403 },
        );
    }
    try {
        const { cvId } = await params;
        await connectDB();
        const employer = await Employer.findById(auth.employerId);
        if (employer && employer.favorites) {
            employer.favorites = employer.favorites.filter(f => f.toString() !== cvId);
            await employer.save();
        }
        return NextResponse.json({ success: true, message: 'Removed from favorites' });
    } catch (err) {
        console.error('Error removing favorite:', err);
        return NextResponse.json({ success: false, message: 'Failed to remove favorite' }, { status: 500 });
    }
}
