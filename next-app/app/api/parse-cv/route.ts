import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/server/cvTextExtract';
import { parseCVWithAI } from '@/lib/server/embeddings';
import { parseMessages, type Language } from '@/lib/server/i18n';
import {
    extractEmail,
    extractPhone,
    isValidEmail,
    isValidNLOrSRPhone,
    formatPhone,
} from '@/lib/contactExtract';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { decodeBase64Limited } from '@/lib/server/security';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        // Onauth endpoint dat OpenAI aanroept → rem spam af (kostenbescherming).
        const limited = await enforceRateLimit(req, { name: 'parse-cv', limit: 15, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const { fileData, fileType, fileName, language } = body || {};
        const lang: Language = language && ['en', 'nl', 'es'].includes(language) ? language : 'en';
        const t = parseMessages[lang];

        if (!fileData) {
            return NextResponse.json({ success: false, message: t.noFile }, { status: 400 });
        }
        if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
            return NextResponse.json({ success: false, message: t.aiNotConfigured }, { status: 503 });
        }

        // Harde groottelimiet vóór allocatie (vertrouwt niet op een fileSize-veld).
        const { buffer, tooLarge } = decodeBase64Limited(fileData, MAX_FILE_BYTES);
        if (tooLarge) {
            return NextResponse.json({ success: false, message: 'Bestand te groot (max 10MB)' }, { status: 413 });
        }
        if (!buffer) {
            return NextResponse.json({ success: false, message: t.noFile }, { status: 400 });
        }
        const { text: extractedText, error: extractErr } = await extractText({ buffer, fileName, fileType });

        if (extractErr === 'pdfParserUnavailable') {
            return NextResponse.json({ success: false, message: 'PDF parsing not available' }, { status: 500 });
        }
        if (extractErr === 'unsupported') {
            return NextResponse.json({ success: false, message: t.unsupportedFormat }, { status: 400 });
        }
        if (extractErr === 'parseFailed') {
            return NextResponse.json({ success: false, message: t.parseError }, { status: 400 });
        }
        if (extractErr === 'tooShort') {
            return NextResponse.json({ success: false, message: t.textTooShort }, { status: 400 });
        }

        console.log(`Parsing CV with AI: ${extractedText.length} characters extracted`);
        const parsedData = await parseCVWithAI(extractedText, lang);

        // Backfill: AI mist soms email/telefoon of geeft een onbruikbaar nummer.
        // Regex de ruwe tekst als de AI-waarde leeg of ongeldig is.
        if (!parsedData.email || !isValidEmail(parsedData.email)) {
            const found = extractEmail(extractedText);
            if (found) parsedData.email = found;
        }
        if (!parsedData.phone || !isValidNLOrSRPhone(parsedData.phone)) {
            const found = extractPhone(extractedText);
            if (found) parsedData.phone = found;
            else if (parsedData.phone) parsedData.phone = formatPhone(parsedData.phone);
        } else {
            parsedData.phone = formatPhone(parsedData.phone);
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            extractedTextLength: extractedText.length,
        });
    } catch (err) {
        // Geen err.message naar de client: kan interne OpenAI/infra-details lekken.
        console.error('Error in CV parsing:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Error parsing CV' }, { status: 500 });
    }
}
