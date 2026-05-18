import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { searchAdzunaJobs } from '@/lib/server/adzuna';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        const body = await req.json();
        const { query = 'developer', location = '', pages = 1 } = body || {};

        if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
            return NextResponse.json(
                { success: false, message: 'ADZUNA_APP_ID of ADZUNA_APP_KEY niet geconfigureerd' },
                { status: 503 },
            );
        }

        await connectDB();

        let totalImported = 0;
        let totalReactivated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const maxPages = Math.min(pages, 10);

        for (let page = 1; page <= maxPages; page++) {
            try {
                const results = await searchAdzunaJobs({
                    query,
                    location,
                    page,
                    resultsPerPage: 50,
                    maxDaysOld: 30,
                });

                if (!results.success || !results.jobs || results.jobs.length === 0) {
                    console.log(`Page ${page}: No results`);
                    continue;
                }

                for (const job of results.jobs) {
                    try {
                        const existing = await Vacancy.findOne({
                            externalId: String(job.id),
                            source: 'adzuna',
                        });
                        const fullText = [job.title, job.company, job.description, job.location, job.category]
                            .filter(Boolean)
                            .join(' ');

                        if (existing) {
                            // Bestaande adzuna-record: alleen reactiveren als 'ie soft-deleted is.
                            // Anders skip — geen onnodige updates op active records.
                            if (existing.isActive === false) {
                                existing.isActive = true;
                                existing.title = job.title;
                                existing.company = job.company;
                                existing.location = job.location;
                                existing.description = job.description ? job.description.substring(0, 5000) : '';
                                existing.applyLink = job.applyLink;
                                existing.fullText = fullText;
                                await existing.save();
                                totalReactivated++;
                            } else {
                                totalSkipped++;
                            }
                            continue;
                        }

                        await Vacancy.create({
                            title: job.title,
                            company: job.company,
                            companyLogo: job.companyLogo ?? undefined,
                            description: job.description ? job.description.substring(0, 5000) : '',
                            location: job.location,
                            externalId: String(job.id),
                            source: 'adzuna',
                            applyLink: job.applyLink,
                            employmentType: job.employmentType,
                            isRemote: job.isRemote || false,
                            salary: job.salary,
                            postedAt: job.postedAt ? new Date(job.postedAt) : new Date(),
                            fullText,
                            isActive: true,
                        });
                        totalImported++;
                        console.log(`Imported: ${job.title} at ${job.company}`);
                    } catch (err) {
                        const e = err as { code?: number; message?: string };
                        if (e.code === 11000) {
                            totalSkipped++;
                        } else {
                            totalErrors++;
                            console.error('Error importing job:', e.message);
                        }
                    }
                }
                console.log(`Page ${page}: ${results.jobs.length} jobs processed`);
            } catch (pageErr) {
                console.error(`Error fetching page ${page}:`, pageErr instanceof Error ? pageErr.message : pageErr);
                totalErrors++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Import voltooid',
            stats: {
                imported: totalImported,
                reactivated: totalReactivated,
                skipped: totalSkipped,
                errors: totalErrors,
                query,
                location,
                pages,
            },
        });
    } catch (err) {
        console.error('Import vacancies error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: 'Fout bij importeren: ' + msg }, { status: 500 });
    }
}
