import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        // Server-side paginatie + search. Bij 4000+ CVs liep een ongepagineerde
        // response zelfs met slim projectie tegen Vercel response-limieten aan;
        // bovendien duurde de sort op een grote dataset onnodig lang per call.
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
        const search = (url.searchParams.get('search') || '').trim();
        const skip = (page - 1) * limit;

        const query: Record<string, unknown> = {};
        if (search) {
            const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { fullName: re },
                { email: re },
                { jobTitle: re },
                { location: re },
            ];
        }

        const [total, cvs] = await Promise.all([
            CV.countDocuments(query),
            CV.find(query)
                .select('_id fullName email phone jobTitle location fileName isInternal country createdAt emailSent recruiterRequested')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            count: cvs.length,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            data: cvs,
        });
    } catch (err) {
        console.error('Error fetching CVs:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch CVs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const body = await req.json();
        const { fullName, email } = body || {};

        if (!fullName || !email) {
            return NextResponse.json(
                { success: false, message: 'Name and email are required' },
                { status: 400 },
            );
        }

        const cv = await CV.create({
            fullName,
            email,
            phone: body.phone,
            location: body.location,
            birthDate: body.birthDate,
            jobTitle: body.jobTitle,
            summary: body.summary,
            languages: body.languages,
            experience: body.experience,
            education: body.education,
            skills: body.skills,
            achievements: body.achievements,
            emailSent: true,
        });

        console.log(`CV manually added: ${cv.fullName} (${cv.email})`);
        return NextResponse.json({ success: true, message: 'CV added successfully', data: cv });
    } catch (err) {
        console.error('Error creating CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to create CV' }, { status: 500 });
    }
}
