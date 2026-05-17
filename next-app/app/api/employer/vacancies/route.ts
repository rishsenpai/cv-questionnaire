import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import Employer from '@/models/Employer';
import { requireEmployer } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';
import { runAutoMatchForVacancy } from '@/lib/server/autoMatch';
import { getTransporter } from '@/lib/server/mailer';

const APPLICATIONS_EMAIL = process.env.APPLICATIONS_EMAIL || 'info@jobparsing.com';

// Plan-gating verwijderd: alle ingelogde werkgevers (basic/advanced/premium)
// kunnen vacatures plaatsen. Het is de kerntaak van het werkgeverportal.

export async function GET(req: NextRequest) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;
    try {
        await connectDB();
        // Ook gepauzeerde (isActive=false) vacatures meenemen zodat werkgever ze kan beheren.
        const vacancies = await Vacancy.find({ employerId: auth.employerId })
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
        const normalizedTitle = String(title).trim();

        // Dedup: weiger een vacature met dezelfde titel (case-insensitive) voor dezelfde werkgever
        // tenzij `force: true` meegegeven is. Voorkomt dat dezelfde vacature 10x in de queue belandt.
        if (!body?.force) {
            const dup = await Vacancy.findOne({
                employerId: auth.employerId,
                title: { $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
            }).select('_id title isActive createdAt');
            if (dup) {
                return NextResponse.json({
                    success: false,
                    message: 'Je hebt al een vacature met deze titel. Bevestig om opnieuw te plaatsen.',
                    duplicate: {
                        _id: String(dup._id),
                        title: dup.title,
                        isActive: dup.isActive,
                        createdAt: dup.createdAt,
                    },
                }, { status: 409 });
            }
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
            title: normalizedTitle,
            company: company ? String(company).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            location: location ? String(location).trim() : undefined,
            requirements: requirements ? String(requirements).trim() : undefined,
            employmentType: employmentType ? String(employmentType).trim() : undefined,
            isRemote: Boolean(isRemote),
            salary,
            source: 'employer',
            isActive: true,
            fullText,
            postedAt: new Date(),
        });

        const vacancyId = String(vacancy._id);

        // Embedding genereren → daarna auto-match draaien (sequentieel zodat
        // auto-match de vers gegenereerde embedding kan gebruiken).
        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            generateVacancyEmbedding(vacancyId)
                .then(() => runAutoMatchForVacancy(vacancyId))
                .then(result => {
                    console.log(`autoMatch klaar voor "${vacancy.title}":`, result);
                })
                .catch(err => {
                    console.error('embedding/autoMatch faalde:', err instanceof Error ? err.message : err);
                });
        }

        // Admin-notificatie (fire-and-forget)
        notifyAdminOfNewVacancy(auth.employerId, vacancy).catch(err => {
            console.error('admin notify faalde:', err instanceof Error ? err.message : err);
        });

        return NextResponse.json({
            success: true,
            message: 'Vacature aangemaakt',
            data: { _id: vacancyId, title: vacancy.title },
        });
    } catch (err) {
        console.error('Error creating vacancy:', err);
        return NextResponse.json({ success: false, message: 'Failed to create vacancy' }, { status: 500 });
    }
}

interface VacancyForEmail {
    _id: unknown;
    title: string;
    location?: string;
    employmentType?: string;
    description?: string;
    requirements?: string;
}

async function notifyAdminOfNewVacancy(employerId: unknown, vacancy: VacancyForEmail) {
    const employer = await Employer.findById(employerId).select('companyName username contactEmail');
    if (!employer) return;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const snippet = (vacancy.description || vacancy.requirements || '').slice(0, 400);
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Nieuwe werkgever-vacature</h2>
  <p><strong>${employer.companyName || employer.username}</strong> heeft zojuist een vacature geplaatst:</p>
  <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 18px;"><strong>${vacancy.title}</strong></p>
    ${vacancy.location ? `<p style="margin: 0; color: #475569;">📍 ${vacancy.location}</p>` : ''}
    ${vacancy.employmentType ? `<p style="margin: 0; color: #475569;">💼 ${vacancy.employmentType}</p>` : ''}
    ${snippet ? `<p style="margin: 12px 0 0 0; color: #475569; font-size: 14px;">${snippet}${snippet.length === 400 ? '…' : ''}</p>` : ''}
  </div>
  <p>Het systeem draait automatisch een AI-match (OpenAI embeddings) en plaatst voorgestelde CV's in je admin-portaal als <em>suggesties</em>. Bekijk + push:</p>
  <p>
    <a href="${baseUrl}/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Open admin
    </a>
  </p>
  <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
    Werkgever-contactemail: ${employer.contactEmail || '—'}
  </p>
</div>`;
    await getTransporter().sendMail({
        from: process.env.EMAIL_USER,
        to: APPLICATIONS_EMAIL,
        subject: `Nieuwe vacature van ${employer.companyName || employer.username}: ${vacancy.title}`,
        html,
    });
}
