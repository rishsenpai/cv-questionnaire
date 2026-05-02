import { NextRequest, NextResponse } from 'next/server';
import { getJobDetails } from '@/lib/server/jsearch';

export const maxDuration = 30;

interface Params {
    params: Promise<{ jobId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { jobId } = await params;
        const result = await getJobDetails(jobId);
        return NextResponse.json(result);
    } catch (err) {
        console.error('Job details error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: 'Error fetching job details: ' + msg }, { status: 500 });
    }
}
