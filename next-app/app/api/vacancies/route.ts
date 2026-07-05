import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';
import { visibleVacancyCountryQuery, isHiddenVacancy } from '@/lib/country';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const skip = (page - 1) * limit;
        const search = url.searchParams.get('search') || '';
        const location = url.searchParams.get('location') || '';
        const source = url.searchParams.get('source') || '';

        // Sluit verborgen landen (NL) uit — Surinaamse kandidaten mogen niet op
        // NL-vacatures solliciteren. Backfilld country-veld gaat via de DB-query;
        // nog niet-gelabelde vacatures vangen we hieronder af met isHiddenVacancy().
        const query: Record<string, unknown> = { isActive: true, fulfilledAt: null, ...visibleVacancyCountryQuery() };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (location) query.location = { $regex: location, $options: 'i' };
        if (source) query.source = source;

        const total = await Vacancy.countDocuments(query);
        // Company laden voor sanitization, daarna strippen uit response.
        const vacancies = (await Vacancy.find(query)
            .select('-fileData -embedding -fullText')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit))
            // Safety-net voor vacatures zonder gebackfilld country-veld: leid het land
            // af uit locatie/omschrijving en filter NL alsnog weg.
            .filter(v => !isHiddenVacancy(v));

        const sanitized = vacancies.map(v => {
            const obj = v.toObject() as unknown as Record<string, unknown>;
            obj.description = sanitizeJobText(v.description, v.company);
            obj.requirements = sanitizeJobText(v.requirements, v.company);
            // Anoniem: bedrijfsnaam altijd verbergen — kandidaat solliciteert via JobParsing.
            delete obj.company;
            delete obj.companyLogo;
            delete obj.applyLink;
            // Internal vacatures (geen employerId) krijgen een vlag zodat de UI
            // 'via JobParsing' kan tonen.
            if (!v.employerId) {
                obj.viaJobParsing = true;
            }
            return obj;
        });

        return NextResponse.json({
            success: true,
            vacancies: sanitized,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
