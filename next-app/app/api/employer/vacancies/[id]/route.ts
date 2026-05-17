import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireEmployer } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findOneAndDelete({ _id: id, employerId: auth.employerId });
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Vacature verwijderd' });
    } catch (err) {
        console.error('Error deleting vacancy:', err);
        return NextResponse.json({ success: false, message: 'Failed to delete vacancy' }, { status: 500 });
    }
}

// PATCH: alleen isActive togglen (pauzeren / hervatten).
export async function PATCH(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json().catch(() => ({}));
        if (typeof body?.isActive !== 'boolean') {
            return NextResponse.json({ success: false, message: 'isActive (boolean) verplicht' }, { status: 400 });
        }
        const vacancy = await Vacancy.findOneAndUpdate(
            { _id: id, employerId: auth.employerId },
            { isActive: body.isActive },
            { new: true },
        ).select('_id title isActive');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: vacancy });
    } catch (err) {
        console.error('Error patching vacancy:', err);
        return NextResponse.json({ success: false, message: 'Failed to update vacancy' }, { status: 500 });
    }
}
