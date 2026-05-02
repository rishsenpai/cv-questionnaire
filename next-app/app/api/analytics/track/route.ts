import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Analytics from '@/models/Analytics';
import { getClientIP } from '@/lib/server/auth';
import { isBot, parseUserAgent, getGeoFromIP } from '@/lib/server/analytics';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { eventType, page, referrer, language, sessionId, screen, detectedBrowser, metadata } = body || {};
        const ip = getClientIP(req);
        const userAgent = req.headers.get('user-agent') || '';

        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return NextResponse.json({ success: true, skipped: 'localhost' });
        }
        if (isBot(userAgent)) {
            return NextResponse.json({ success: true, skipped: 'bot' });
        }

        const geo = await getGeoFromIP(ip);
        const { device, browser } = parseUserAgent(userAgent);
        if (detectedBrowser) browser.name = detectedBrowser;

        await Analytics.create({
            eventType,
            page,
            referrer,
            userAgent,
            device,
            browser,
            screen: screen ? { width: screen.width, height: screen.height } : undefined,
            language,
            sessionId,
            metadata,
            geo: geo ? { ip, ...geo } : { ip },
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Analytics track error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
