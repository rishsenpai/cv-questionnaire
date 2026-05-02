import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireEmployer } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';

// Plan-gating verwijderd: alle ingelogde werkgevers (basic/advanced/premium)
// kunnen vacatures plaatsen. Het is de kerntaak van het werkgeverportal.

export async function GET(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    try {
        await connectDB();
        const vacancies = await Vacancy.find({ employerId: auth.employerId, isActive: true })
            .select('-fileData -embedding')
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
    try {
        await connectDB();
        const body = await req.json();
        const {
            title, description, location, requirements,
            company, employmentType, isRemote,
            salaryMin, salaryMax, salaryCurrency, salaryPeriod,
        } = body || {};
        if (!title || !String(title).trim()) {
            return NextResponse.json({ success: false, message: 'Vacaturetitel is verplicht' }, { status: 400 });
        }

        const fullText = [title, company, description, requirements, location].filter(Boolean).join(' ');
        const salary = (salaryMin || salaryMax) ? {
            min: salaryMin ? Number(salaryMin) : undefined,
            max: salaryMax ? Number(salaryMax) : undefined,
            currency: salaryCurrency || 'SRD',
            period: salaryPeriod || 'month',
        } : undefined;

        const vacancy = await Vacancy.create({
            employerId: auth.employerId,
            title: String(title).trim(),
            company: company ? String(company).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            location: location ? String(location).trim() : undefined,
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
