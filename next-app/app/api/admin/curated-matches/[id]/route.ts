import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const deleted = await CuratedMatch.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('curated-matches DELETE error:', err);
        return NextResponse.json({ success: false, message: 'Verwijderen mislukt' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json();
        const update: Record<string, unknown> = {};
        if (body.adminNote !== undefined) update.adminNote = body.adminNote;
        if (body.status && ['presented', 'viewed', 'contact-requested', 'rejected'].includes(body.status)) {
            update.status = body.status;
        }
        const doc = await CuratedMatch.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!doc) {
            return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        }
        return NextResponse.json({ success: true, curatedMatch: doc });
    } catch (err) {
        console.error('curated-matches PATCH error:', err);
        return NextResponse.json({ success: false, message: 'Update mislukt' }, { status: 500 });
    }
}
