import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;
        const search = url.searchParams.get('search') || '';
        const source = url.searchParams.get('source') || '';

        const query: Record<string, unknown> = { isActive: true };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ];
        }
        if (source) query.source = source;

        const total = await Vacancy.countDocuments(query);
        const vacancies = await Vacancy.find(query)
            .select('-fileData -embedding -fullText')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            vacancies,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
