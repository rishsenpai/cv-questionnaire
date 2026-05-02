import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';

interface Params {
    params: Promise<{ name: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { name: rawName } = await params;
        const decoded = decodeURIComponent(rawName);
        const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`^${escaped}$`, 'i');

        await connectDB();
        const vacancies = await Vacancy.find({
            isActive: true,
            company: nameRegex,
        }).select('-fileData -embedding -fullText').sort({ createdAt: -1 });

        if (vacancies.length === 0) {
            return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
        }

        const first = vacancies[0];
        const locations = Array.from(new Set(vacancies.map(v => v.location).filter(Boolean))) as string[];
        const sources = Array.from(new Set(vacancies.map(v => v.source).filter(Boolean))) as string[];
        const verified = sources.includes('adzuna');

        return NextResponse.json({
            success: true,
            company: {
                name: first.company,
                logo: first.companyLogo || null,
                openJobs: vacancies.length,
                locations,
                primaryLocation: locations[0] || 'Locatie onbekend',
                sources,
                verified,
            },
            vacancies,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
