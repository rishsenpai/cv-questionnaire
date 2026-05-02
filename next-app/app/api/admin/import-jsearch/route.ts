import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { searchJobs } from '@/lib/server/jsearch';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.RAPIDAPI_KEY) {
        return NextResponse.json(
            { success: false, message: 'RAPIDAPI_KEY niet geconfigureerd' },
            { status: 503 },
        );
    }

    try {
        const body = await req.json();
        const queriesInput: unknown = body.queries;
        const location: string = (body.location || 'Suriname').trim();
        const datePosted = (body.datePosted || 'all') as 'all' | 'today' | '3days' | 'week' | 'month';

        let queries: string[] = [];
        if (Array.isArray(queriesInput)) {
            queries = queriesInput.map(String).map(q => q.trim()).filter(Boolean);
        } else if (typeof queriesInput === 'string') {
            queries = queriesInput.split(',').map(q => q.trim()).filter(Boolean);
        }
        if (queries.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Geef minstens één zoekterm' },
                { status: 400 },
            );
        }
        if (queries.length > 20) {
            return NextResponse.json(
                { success: false, message: 'Max 20 zoektermen per import (rate limit)' },
                { status: 400 },
            );
        }

        await connectDB();

        let totalImported = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const perQuery: Array<{ query: string; jobs: number; imported: number; skipped: number }> = [];
        const newIds: string[] = [];

        for (const query of queries) {
            try {
                const result = await searchJobs({
                    query,
                    location,
                    page: 1,
                    numPages: 1,
                    datePosted,
                });

                let imported = 0;
                let skipped = 0;
                for (const job of result.jobs) {
                    try {
                        const exists = await Vacancy.findOne({
                            externalId: String(job.id),
                            source: 'jsearch',
                        });
                        if (exists) {
                            skipped++;
                            continue;
                        }

                        const fullText = [
                            job.title,
                            job.company,
                            job.description,
                            job.location,
                        ].filter(Boolean).join(' ');

                        const created = await Vacancy.create({
                            title: job.title,
                            company: job.company,
                            companyLogo: job.companyLogo ?? undefined,
                            description: job.description ? String(job.description).substring(0, 5000) : '',
                            location: job.location,
                            externalId: String(job.id),
                            source: 'jsearch',
                            applyLink: job.applyLink,
                            employmentType: job.employmentType,
                            isRemote: Boolean(job.isRemote),
                            salary: job.salary && (job.salary.min || job.salary.max) ? {
                                min: job.salary.min ?? undefined,
                                max: job.salary.max ?? undefined,
                                currency: job.salary.currency ?? undefined,
                                period: job.salary.period ?? undefined,
                            } : undefined,
                            postedAt: job.postedAt ? new Date(job.postedAt) : new Date(),
                            fullText,
                            isActive: true,
                        });
                        imported++;
                        newIds.push(String(created._id));
                    } catch (err) {
                        const e = err as { code?: number; message?: string };
                        if (e.code === 11000) {
                            skipped++;
                        } else {
                            totalErrors++;
                            console.error(`JSearch import error for job:`, e.message);
                        }
                    }
                }

                totalImported += imported;
                totalSkipped += skipped;
                perQuery.push({ query, jobs: result.jobs.length, imported, skipped });
            } catch (err) {
                console.error(`JSearch query "${query}" failed:`, err instanceof Error ? err.message : err);
                totalErrors++;
                perQuery.push({ query, jobs: 0, imported: 0, skipped: 0 });
            }
        }

        // Fire-and-forget embeddings voor de zojuist toegevoegde vacatures.
        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            for (const id of newIds) {
                generateVacancyEmbedding(id).catch(err => console.error('JSearch embed error:', err.message));
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Import voltooid',
            stats: {
                imported: totalImported,
                skipped: totalSkipped,
                errors: totalErrors,
                queriesUsed: queries.length,
                perQuery,
            },
        });
    } catch (err) {
        console.error('JSearch import error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: 'Fout bij importeren: ' + msg }, { status: 500 });
    }
}
