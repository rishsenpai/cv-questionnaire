'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics-client';

// Auto-pageview op route-wissel. Mount één keer in app/layout.tsx.
// Skipt /admin (eigen analytics doel) en /api routes. Niet handmatig
// aan te roepen — gebruik trackEvent() direct voor custom events.
export function AnalyticsTracker() {
    const pathname = usePathname();
    useEffect(() => {
        if (!pathname) return;
        if (pathname.startsWith('/admin')) return;
        if (pathname.startsWith('/api')) return;
        trackEvent('pageview', { page: pathname });
    }, [pathname]);
    return null;
}
