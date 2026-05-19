// Markeer een vacature als 'vervuld' (POST) of heropen 'm (DELETE).
// Vervulde vacatures worden uitgesloten in alle match-pipelines en
// verborgen op publieke jobseeker- en werkgever-dashboards. Ze blijven
// zichtbaar in admin met een 'Vervuld'-badge.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
    }
    await connectDB();
    const updated = await Vacancy.findByIdAndUpdate(
        id,
        { fulfilledAt: new Date() },
        { new: true },
    ).select('_id title fulfilledAt');
    if (!updated) {
        return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
    }
    return NextResponse.json({ success: true, fulfilledAt: updated.fulfilledAt });
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
    }
    await connectDB();
    const updated = await Vacancy.findByIdAndUpdate(
        id,
        { fulfilledAt: null },
        { new: true },
    ).select('_id title fulfilledAt');
    if (!updated) {
        return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
    }
    return NextResponse.json({ success: true, fulfilledAt: null });
}
