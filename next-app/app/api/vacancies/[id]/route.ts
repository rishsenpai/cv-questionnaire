import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';

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
        // Haal company op voor sanitization, strip 'm uit de response
        const vacancy = await Vacancy.findOne({ _id: id, isActive: true, fulfilledAt: null })
            .select('-fileData -embedding -fullText');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacancy not found' }, { status: 404 });
        }

        Vacancy.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(err => {
            console.error('viewCount inc failed:', err instanceof Error ? err.message : err);
        });

        const sanitized = {
            ...vacancy.toObject(),
            description: sanitizeJobText(vacancy.description, vacancy.company),
            requirements: sanitizeJobText(vacancy.requirements, vacancy.company),
        };
        // GDPR-mask: bedrijfsidentiteit niet aan kandidaten tonen
        delete (sanitized as Record<string, unknown>).company;
        delete (sanitized as Record<string, unknown>).companyLogo;
        delete (sanitized as Record<string, unknown>).applyLink;

        return NextResponse.json({ success: true, vacancy: sanitized });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
