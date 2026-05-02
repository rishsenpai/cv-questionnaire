import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireEmployer } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';

export async function GET(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan !== 'premium') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Premium voor vacature matching' },
            { status: 403 },
        );
    }
    try {
        await connectDB();
        const vacancies = await Vacancy.find({ employerId: auth.employerId, isActive: true })
            .select('-fileData')
            .sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: vacancies });
    } catch (err) {
        console.error('Error fetching vacancies:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch vacancies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.plan !== 'premium') {
        return NextResponse.json(
            { success: false, message: 'Upgrade naar Premium voor vacature matching' },
            { status: 403 },
        );
    }
    try {
        await connectDB();
        const body = await req.json();
        const { title, description, location, requirements, fullText, fileName, fileData, fileType } = body || {};
        if (!title) {
            return NextResponse.json({ success: false, message: 'Vacature titel is verplicht' }, { status: 400 });
        }
        const vacancy = await Vacancy.create({
            employerId: auth.employerId,
            title,
            description,
            location,
            requirements,
            fullText: fullText || `${title} ${description || ''} ${requirements || ''}`,
            fileName,
            fileData,
            fileType,
        });

        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            generateVacancyEmbedding(String(vacancy._id)).catch(err => {
                console.error('Error generating embedding for vacancy:', err.message);
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Vacature aangemaakt',
            data: { _id: String(vacancy._id), title: vacancy.title },
        });
    } catch (err) {
        console.error('Error creating vacancy:', err);
        return NextResponse.json({ success: false, message: 'Failed to create vacancy' }, { status: 500 });
    }
}
