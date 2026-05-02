import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findOne({ _id: id, isActive: true })
            .select('-fileData -embedding');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacancy not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, vacancy });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
