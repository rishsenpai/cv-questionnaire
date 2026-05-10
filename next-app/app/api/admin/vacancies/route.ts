import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';

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
            .limit(limit)
            .lean();

        // Tel open suggesties per vacature in één aggregate
        const vacancyIds = vacancies.map(v => v._id);
        const suggestionCounts = vacancyIds.length > 0
            ? await CuratedMatch.aggregate([
                { $match: { vacancyId: { $in: vacancyIds }, status: 'suggested' } },
                { $group: { _id: '$vacancyId', count: { $sum: 1 } } },
            ])
            : [];
        const countMap = new Map(suggestionCounts.map(s => [String(s._id), s.count]));
        const enriched = vacancies.map(v => ({
            ...v,
            suggestionCount: countMap.get(String(v._id)) || 0,
        }));

        return NextResponse.json({
            success: true,
            vacancies: enriched,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const body = await req.json();
        const {
            title, company, location, description, requirements,
            employmentType, isRemote, salaryMin, salaryMax, salaryCurrency, salaryPeriod,
        } = body || {};

        if (!title || !String(title).trim()) {
            return NextResponse.json({ success: false, message: 'Titel is verplicht' }, { status: 400 });
        }

        const fullText = [title, company, description, requirements, location].filter(Boolean).join(' ');
        const salary = (salaryMin || salaryMax) ? {
            min: salaryMin ? Number(salaryMin) : undefined,
            max: salaryMax ? Number(salaryMax) : undefined,
            currency: salaryCurrency || 'SRD',
            period: salaryPeriod || 'month',
        } : undefined;

        const vacancy = await Vacancy.create({
            title: String(title).trim(),
            company: company ? String(company).trim() : undefined,
            location: location ? String(location).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            requirements: requirements ? String(requirements).trim() : undefined,
            employmentType: employmentType ? String(employmentType).trim() : undefined,
            isRemote: Boolean(isRemote),
            salary,
            source: 'internal',
            isActive: true,
            fullText,
            postedAt: new Date(),
        });

        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            generateVacancyEmbedding(String(vacancy._id)).catch(err => console.error('embed error:', err.message));
        }

        return NextResponse.json({
            success: true,
            message: 'Vacature aangemaakt',
            data: { _id: String(vacancy._id), title: vacancy.title },
        });
    } catch (err) {
        console.error('Admin vacancy create error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
