import { NextRequest, NextResponse } from 'next/server';
import { searchJobs } from '@/lib/server/jsearch';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('query') || 'developer';
        const location = url.searchParams.get('location') || 'Netherlands';
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const datePosted = (url.searchParams.get('datePosted') || 'all') as
            'all' | 'today' | '3days' | 'week' | 'month';
        const remoteOnly = (url.searchParams.get('remoteOnly') || 'false') as 'true' | 'false';
        const employmentType = url.searchParams.get('employmentType') || '';

        const results = await searchJobs({ query, location, page, datePosted, remoteOnly, employmentType });
        return NextResponse.json(results);
    } catch (err) {
        console.error('Job search error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: 'Error searching jobs: ' + msg }, { status: 500 });
    }
}
