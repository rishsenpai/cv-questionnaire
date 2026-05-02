import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';

interface CompanyAggregate {
    _id: string;
    openJobs: number;
    locations: string[];
    sectors: string[];
    sources: string[];
    sampleLogo?: string | null;
}

export async function GET() {
    try {
        await connectDB();

        const result = await Vacancy.aggregate<CompanyAggregate>([
            { $match: { isActive: true, company: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$company',
                    openJobs: { $sum: 1 },
                    locations: { $addToSet: '$location' },
                    sectors: { $addToSet: '$source' },
                    sources: { $addToSet: '$source' },
                    sampleLogo: { $first: '$companyLogo' },
                },
            },
            { $sort: { openJobs: -1 } },
            { $limit: 200 },
        ]);

        const companies = result.map(c => ({
            name: c._id,
            openJobs: c.openJobs,
            location: c.locations.find(Boolean) || 'Locatie onbekend',
            sector: c.sources.includes('adzuna') ? 'Externe Bronnen' : 'Lokaal',
            verified: c.sources.includes('adzuna'),
            logo: c.sampleLogo || null,
        }));

        return NextResponse.json({ success: true, companies });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
