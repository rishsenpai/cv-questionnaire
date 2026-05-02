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
            { success: false, message: 'Upgrade naar Advanced of Premium voor notities' },
            { status: 403 },
        );
    }
    try {
        const body = await req.json();
        const { text } = body || {};
        if (!text || !String(text).trim()) {
            return NextResponse.json({ success: false, message: 'Note text is required' }, { status: 400 });
        }
        const { cvId } = await params;
        if (!mongoose.Types.ObjectId.isValid(cvId)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const employer = await Employer.findById(auth.employerId);
        if (!employer) {
            return NextResponse.json({ success: false, message: 'Employer not found' }, { status: 404 });
        }
        if (!employer.notes) employer.notes = [];
        const trimmed = String(text).trim();
        const existing = employer.notes.findIndex(n => n.cvId.toString() === cvId);
        if (existing >= 0) {
            employer.notes[existing].text = trimmed;
            employer.notes[existing].updatedAt = new Date();
        } else {
            employer.notes.push({
                cvId: new mongoose.Types.ObjectId(cvId),
                text: trimmed,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        await employer.save();
        return NextResponse.json({ success: true, message: 'Note saved' });
    } catch (err) {
        console.error('Error saving note:', err);
        return NextResponse.json({ success: false, message: 'Failed to save note' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan === 'basic') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Advanced of Premium voor notities' },
            { status: 403 },
        );
    }
    try {
        const { cvId } = await params;
        await connectDB();
        const employer = await Employer.findById(auth.employerId);
        if (employer && employer.notes) {
            employer.notes = employer.notes.filter(n => n.cvId.toString() !== cvId);
            await employer.save();
        }
        return NextResponse.json({ success: true, message: 'Note deleted' });
    } catch (err) {
        console.error('Error deleting note:', err);
        return NextResponse.json({ success: false, message: 'Failed to delete note' }, { status: 500 });
    }
}
