// Admin markeert dat de contactgegevens zijn gedeeld met de werkgever.
// Werkgever ziet status 'contact-shared' + datum + optionele notitie in portaal.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json().catch(() => ({}));
        const note = (body?.note || '').toString().slice(0, 1000).trim();

        const match = await CuratedMatch.findById(id);
        if (!match) {
            return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        }
        // Alleen vanaf contact-requested kan admin contact-shared markeren.
        if (match.status !== 'contact-requested') {
            return NextResponse.json(
                { success: false, message: `Status is "${match.status}", alleen "contact-requested" kan naar contact-shared` },
                { status: 400 },
            );
        }

        match.status = 'contact-shared';
        match.contactSharedAt = new Date();
        if (note) match.contactSharedNote = note;
        await match.save();

        return NextResponse.json({ success: true, curatedMatch: match });
    } catch (err) {
        console.error('share-contact error:', err);
        return NextResponse.json({ success: false, message: 'Markeren mislukt' }, { status: 500 });
    }
}
