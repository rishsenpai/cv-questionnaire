// Gedeelde server-side beveiligingshelpers.

// Escape van user-input vóór interpolatie in HTML (met name notificatie-emails).
// Voorkomt dat een ingezonden naam/bericht als markup of link wordt gerenderd
// in de mailclient van de ontvanger (content-spoofing / phishing).
export function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Escape van een string die letterlijk in een RegExp gebruikt wordt, zodat
// user-input geen regex-metatekens (ReDoS / onbedoelde matches) kan injecteren.
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface DecodeResult {
    buffer: Buffer | null;
    tooLarge: boolean;
}

// Decodeer base64 naar een Buffer met een harde groottelimiet. De byte-grootte
// wordt eerst uit de base64-lengte berekend zodat we een te grote payload
// weigeren vóór we 'm in het geheugen alloceren. Vertrouwt NIET op een los
// meegestuurd fileSize-veld (dat kan de client weglaten om de cap te omzeilen).
export function decodeBase64Limited(fileData: unknown, maxBytes: number): DecodeResult {
    if (typeof fileData !== 'string' || fileData.length === 0) {
        return { buffer: null, tooLarge: false };
    }
    // Ruwe schatting van de gedecodeerde grootte: 4 base64-tekens = 3 bytes.
    const approxBytes = Math.floor((fileData.length * 3) / 4);
    if (approxBytes > maxBytes) {
        return { buffer: null, tooLarge: true };
    }
    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length > maxBytes) {
        return { buffer: null, tooLarge: true };
    }
    return { buffer, tooLarge: false };
}
