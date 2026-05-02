export interface DeviceInfo {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    os?: string;
    osVersion?: string;
}

export interface BrowserInfo {
    name?: string;
    version?: string;
}

export interface GeoInfo {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
}

export function isBot(userAgent: string | null | undefined): boolean {
    if (!userAgent) return false;
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /crawling/i,
        /googlebot/i, /bingbot/i, /yandex/i, /baidu/i,
        /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
        /slackbot/i, /telegrambot/i, /whatsapp/i,
        /pingdom/i, /uptimerobot/i, /statuscake/i,
        /lighthouse/i, /pagespeed/i, /gtmetrix/i,
        /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
        /vercel/i, /curl/i, /wget/i, /python/i, /axios/i, /node-fetch/i,
    ];
    return botPatterns.some(p => p.test(userAgent));
}

export function parseUserAgent(userAgent: string | null | undefined): { device: DeviceInfo; browser: BrowserInfo } {
    if (!userAgent) return { device: { type: 'unknown' }, browser: {} };
    const ua = userAgent.toLowerCase();
    const device: DeviceInfo = { type: 'desktop' };
    const browser: BrowserInfo = {};

    if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
        device.type = 'tablet';
    } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi/i.test(ua)) {
        device.type = 'mobile';
    }

    if (/windows nt 10/i.test(ua)) {
        device.os = 'Windows';
        device.osVersion = '10/11';
    } else if (/windows nt/i.test(ua)) {
        device.os = 'Windows';
        const match = ua.match(/windows nt ([\d.]+)/i);
        device.osVersion = match ? match[1] : undefined;
    } else if (/macintosh|mac os x/i.test(ua)) {
        device.os = 'macOS';
        const match = ua.match(/mac os x ([\d_]+)/i);
        device.osVersion = match ? match[1].replace(/_/g, '.') : undefined;
    } else if (/iphone|ipad|ipod/i.test(ua)) {
        device.os = 'iOS';
        const match = ua.match(/os ([\d_]+)/i);
        device.osVersion = match ? match[1].replace(/_/g, '.') : undefined;
    } else if (/android/i.test(ua)) {
        device.os = 'Android';
        const match = ua.match(/android ([\d.]+)/i);
        device.osVersion = match ? match[1] : undefined;
    } else if (/linux/i.test(ua)) {
        device.os = 'Linux';
    }

    if (/edg\//i.test(ua)) {
        browser.name = 'Edge';
        const match = ua.match(/edg\/([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/brave/i.test(ua)) {
        browser.name = 'Brave';
        const match = ua.match(/brave\/([\d.]+)/i) || ua.match(/chrome\/([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/opr\/|opera/i.test(ua)) {
        browser.name = 'Opera';
        const match = ua.match(/(?:opr|opera)[\/\s]([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
        browser.name = 'Chrome';
        const match = ua.match(/(?:chrome|crios)\/([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/safari/i.test(ua) && !/chrome|chromium/i.test(ua)) {
        browser.name = 'Safari';
        const match = ua.match(/version\/([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/firefox|fxios/i.test(ua)) {
        browser.name = 'Firefox';
        const match = ua.match(/(?:firefox|fxios)\/([\d.]+)/i);
        browser.version = match ? match[1].split('.')[0] : undefined;
    } else if (/msie|trident/i.test(ua)) {
        browser.name = 'IE';
        const match = ua.match(/(?:msie |rv:)([\d.]+)/i);
        browser.version = match ? match[1] : undefined;
    }

    return { device, browser };
}

export async function getGeoFromIP(ip: string): Promise<GeoInfo | null> {
    try {
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return { country: 'Local', countryCode: 'LO', city: 'Localhost' };
        }
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon`);
        const data = await response.json();
        if (data.status === 'success') {
            return {
                country: data.country,
                countryCode: data.countryCode,
                region: data.region,
                city: data.city,
                lat: data.lat,
                lon: data.lon,
            };
        }
    } catch (err) {
        console.error('Geolocation error:', err);
    }
    return null;
}
