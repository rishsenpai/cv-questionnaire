import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';
import { runAutoMatchForVacancy } from '@/lib/server/autoMatch';

interface Params {
    params: Promise<{ id: string }>;
}

const CONTENT_FIELDS = ['title', 'description', 'requirements'] as const;

// GET: vooringevulde waardes voor de edit-modal.
export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findById(id)
            .select('_id title description requirements location company employmentType isRemote salary source applyLink country isActive fulfilledAt')
            .lean();
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: vacancy });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}

// PATCH: admin bewerkt vacature. Re-embeddet + draait autoMatch opnieuw
// als title/description/requirements wijzigen (anders blijft matching stale).
export async function PATCH(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json().catch(() => ({}));

        const existing = await Vacancy.findById(id)
            .select('_id title description requirements location company employmentType isRemote salary applyLink isActive');
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        const updates: Record<string, unknown> = {};
        const allowedScalar = ['title', 'description', 'requirements', 'location', 'company', 'employmentType', 'applyLink'] as const;
        for (const key of allowedScalar) {
            if (typeof body[key] === 'string') {
                const trimmed = body[key].trim();
                if (key === 'title' && !trimmed) {
                    return NextResponse.json({ success: false, message: 'Titel mag niet leeg zijn' }, { status: 400 });
                }
                updates[key] = trimmed || undefined;
            }
        }
        if (typeof body.isRemote === 'boolean') updates.isRemote = body.isRemote;
        if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
        if (body.salary !== undefined) {
            if (body.salary === null) {
                updates.salary = undefined;
            } else if (typeof body.salary === 'object') {
                updates.salary = {
                    min: body.salary.min ? Number(body.salary.min) : undefined,
                    max: body.salary.max ? Number(body.salary.max) : undefined,
                    currency: body.salary.currency || 'SRD',
                    period: body.salary.period || 'month',
                };
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: false, message: 'Geen wijzigingen meegegeven' }, { status: 400 });
        }

        const existingObj = existing.toObject() as unknown as Record<string, unknown>;
        const contentChanged = CONTENT_FIELDS.some(f =>
            updates[f] !== undefined && updates[f] !== existingObj[f],
        );

        if (contentChanged) {
            const next = { ...existingObj, ...updates };
            updates.fullText = [next.title, next.company, next.description, next.requirements, next.location]
                .filter(Boolean)
                .join(' ');
        }

        const vacancy = await Vacancy.findByIdAndUpdate(id, updates, { new: true })
            .select('_id title description requirements location company employmentType isRemote salary applyLink isActive');

        // Fire-and-forget re-embed + autoMatch zodat matching consistent blijft.
        if (contentChanged && (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test')) {
            generateVacancyEmbedding(id)
                .then(() => runAutoMatchForVacancy(id))
                .catch(err => console.error('admin edit re-embed/match failed:', err instanceof Error ? err.message : err));
        }

        return NextResponse.json({ success: true, data: vacancy, contentChanged });
    } catch (err) {
        console.error('admin vacancy PATCH error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid vacancy id' }, { status: 400 });
        }
        await connectDB();
        await Vacancy.findByIdAndUpdate(id, { isActive: false });
        return NextResponse.json({ success: true, message: 'Vacature verwijderd' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
