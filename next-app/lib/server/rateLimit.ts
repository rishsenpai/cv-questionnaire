import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import RateLimit from '@/models/RateLimit';
import { getClientIP } from '@/lib/server/auth';

export interface RateLimitOptions {
    // Logische naam van het endpoint, bv. 'admin-login'. Onderdeel van de sleutel.
    name: string;
    // Maximaal aantal requests binnen het venster.
    limit: number;
    // Venster in milliseconden.
    windowMs: number;
    // Extra sleutel-onderdeel bovenop het IP (bv. een e-mailadres bij login).
    extraKey?: string;
}

// Vaste-venster limiter, gebacked door MongoDB (werkt over serverless-instances).
// Retourneert een 429-NextResponse als het budget op is, anders null (doorgaan).
export async function enforceRateLimit(
    req: NextRequest,
    opts: RateLimitOptions,
): Promise<NextResponse | null> {
    // Rate limiting uit in test-mode — anders worden de Playwright-suites geflaked
    // (conform de bestaande afspraak dat limiting in NODE_ENV=test uit staat).
    if (process.env.NODE_ENV === 'test') return null;

    const ip = getClientIP(req);
    const now = Date.now();
    // Bucket-grens op het venster afronden zodat alle requests in hetzelfde
    // venster dezelfde sleutel delen.
    const bucket = Math.floor(now / opts.windowMs);
    const key = `${opts.name}:${ip}:${opts.extraKey ?? ''}:${bucket}`;
    const expiresAt = new Date((bucket + 1) * opts.windowMs);

    try {
        await connectDB();
        const doc = await RateLimit.findOneAndUpdate(
            { key },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
            { upsert: true, new: true },
        );
        if (doc.count > opts.limit) {
            const retryAfter = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
            return NextResponse.json(
                { success: false, message: 'Te veel verzoeken. Probeer het later opnieuw.' },
                { status: 429, headers: { 'Retry-After': String(retryAfter) } },
            );
        }
        return null;
    } catch (err) {
        // Fail-open: een DB-hik mag legitiem verkeer niet blokkeren.
        console.error('enforceRateLimit error:', err instanceof Error ? err.message : err);
        return null;
    }
}
