// Client-side analytics helper. Fire-and-forget — we logken nooit
// errors die de gebruikersflow blokkeren. Server filtert bots,
// localhost en doet IP-geo lookup, dus client hoeft alleen 'sessionId'
// + screen + minimal metadata mee te sturen.

const SESSION_KEY = 'jp_session_id';

export type AnalyticsEventType =
    | 'pageview'
    | 'cv_submission'
    | 'cv_upload'
    | 'cv_manual'
    | 'vacancy_search'
    | 'vacancy_match'
    | 'language_change'
    | 'high_match';

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

interface TrackPayload {
    page?: string;
    metadata?: Record<string, unknown>;
}

export function trackEvent(eventType: AnalyticsEventType, payload: TrackPayload = {}) {
    if (typeof window === 'undefined') return;
    const body = {
        eventType,
        page: payload.page ?? window.location.pathname,
        referrer: document.referrer || undefined,
        language: navigator.language,
        sessionId: getSessionId(),
        screen: { width: window.screen.width, height: window.screen.height },
        metadata: payload.metadata,
    };
    // sendBeacon overleeft page unload; valt terug op fetch keepalive.
    try {
        const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
        if (navigator.sendBeacon?.('/api/analytics/track', blob)) return;
    } catch {
        // beacon faalde — gewoon fetch
    }
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
    }).catch(() => {});
}
