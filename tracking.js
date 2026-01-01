// Jobparsing Analytics Tracking Script
(function() {
    // Generate or get session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('jp_session');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem('jp_session', sessionId);
        }
        return sessionId;
    }

    // Detect browser client-side (for browsers that hide in UA like Brave)
    function detectBrowser() {
        // Brave has a special API
        if (navigator.brave && navigator.brave.isBrave) {
            return 'Brave';
        }
        return null; // Let server detect from UA
    }

    // Track event
    async function trackEvent(eventType, metadata = {}) {
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType,
                    page: window.location.pathname,
                    referrer: document.referrer,
                    language: localStorage.getItem('preferredLanguage') || 'nl',
                    sessionId: getSessionId(),
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height
                    },
                    detectedBrowser: detectBrowser(),
                    metadata
                })
            });
        } catch (error) {
            console.error('Tracking error:', error);
        }
    }

    // Track pageview on load
    trackEvent('pageview');

    // Expose tracking function globally
    window.jpTrack = trackEvent;
})();
