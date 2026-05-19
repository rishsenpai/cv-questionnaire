import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';
import { runAutoMatchForVacancy } from '@/lib/server/autoMatch';

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

        // Optioneel filter op vervuld-status. ?fulfilled=open (default) toont
        // alleen niet-vervulde, ?fulfilled=fulfilled alleen vervulde, ?fulfilled=all alles.
        const fulfilledFilter = url.searchParams.get('fulfilled') || 'open';
        if (fulfilledFilter === 'fulfilled') query.fulfilledAt = { $ne: null };
        else if (fulfilledFilter === 'open') query.fulfilledAt = null;
        // 'all' = geen filter

        const total = await Vacancy.countDocuments(query);
        const vacancies = await Vacancy.find(query)
            .select('_id title company location source employerId country createdAt isActive fulfilledAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Tel open suggesties én al-gepushte matches per vacature in één aggregate.
        // Pushed = alle non-rejected, non-suggested statussen (presented, viewed, contact-*).
        const vacancyIds = vacancies.map(v => v._id);
        const matchCounts = vacancyIds.length > 0
            ? await CuratedMatch.aggregate([
                { $match: { vacancyId: { $in: vacancyIds }, status: { $ne: 'rejected' } } },
                { $group: { _id: { vacancyId: '$vacancyId', status: '$status' }, count: { $sum: 1 } } },
            ])
            : [];
        const countMap = new Map<string, { suggested: number; pushed: number }>();
        for (const c of matchCounts) {
            const vid = String(c._id.vacancyId);
            const entry = countMap.get(vid) || { suggested: 0, pushed: 0 };
            if (c._id.status === 'suggested') entry.suggested += c.count;
            else entry.pushed += c.count;
            countMap.set(vid, entry);
        }
        const enriched = vacancies.map(v => {
            const counts = countMap.get(String(v._id)) || { suggested: 0, pushed: 0 };
            return { ...v, suggestionCount: counts.suggested, pushedCount: counts.pushed };
        });

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
            employerId,
        } = body || {};

        if (!title || !String(title).trim()) {
            return NextResponse.json({ success: false, message: 'Titel is verplicht' }, { status: 400 });
        }

        // Optioneel: koppel aan een werkgever (admin upload-namens flow)
        let resolvedEmployerId: mongoose.Types.ObjectId | undefined;
        let employerCompany: string | undefined;
        if (employerId) {
            if (!mongoose.Types.ObjectId.isValid(employerId)) {
                return NextResponse.json({ success: false, message: 'Ongeldig employerId' }, { status: 400 });
            }
            const employer = await Employer.findById(employerId).select('companyName');
            if (!employer) {
                return NextResponse.json({ success: false, message: 'Werkgever niet gevonden' }, { status: 404 });
            }
            resolvedEmployerId = employer._id as mongoose.Types.ObjectId;
            employerCompany = employer.companyName;
        }

        const finalCompany = (company ? String(company).trim() : undefined) || employerCompany;
        const fullText = [title, finalCompany, description, requirements, location].filter(Boolean).join(' ');
        const salary = (salaryMin || salaryMax) ? {
            min: salaryMin ? Number(salaryMin) : undefined,
            max: salaryMax ? Number(salaryMax) : undefined,
            currency: salaryCurrency || 'SRD',
            period: salaryPeriod || 'month',
        } : undefined;

        const vacancy = await Vacancy.create({
            employerId: resolvedEmployerId,
            title: String(title).trim(),
            company: finalCompany,
            location: location ? String(location).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            requirements: requirements ? String(requirements).trim() : undefined,
            employmentType: employmentType ? String(employmentType).trim() : undefined,
            isRemote: Boolean(isRemote),
            salary,
            // Als admin namens een werkgever plaatst → markeer als 'employer' zodat
            // het in de admin-lijst dezelfde badge krijgt en auto-match draait.
            source: resolvedEmployerId ? 'employer' : 'internal',
            isActive: true,
            fullText,
            postedAt: new Date(),
        });

        const vacancyId = String(vacancy._id);

        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            const chain = generateVacancyEmbedding(vacancyId);
            if (resolvedEmployerId) {
                // Auto-match alleen zinvol als er een werkgever-eigenaar is
                chain.then(() => runAutoMatchForVacancy(vacancyId)).catch(err => {
                    console.error('embedding/autoMatch faalde:', err instanceof Error ? err.message : err);
                });
            } else {
                chain.catch(err => console.error('embed error:', err.message));
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Vacature aangemaakt',
            data: { _id: vacancyId, title: vacancy.title },
        });
    } catch (err) {
        console.error('Admin vacancy create error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
