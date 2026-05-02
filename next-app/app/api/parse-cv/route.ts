import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/server/cvTextExtract';
import { parseCVWithAI } from '@/lib/server/embeddings';
import { parseMessages, type Language } from '@/lib/server/i18n';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
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

        const buffer = Buffer.from(fileData, 'base64');
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

        return NextResponse.json({
            success: true,
            data: parsedData,
            extractedTextLength: extractedText.length,
        });
    } catch (err) {
        console.error('Error in CV parsing:', err);
        const msg = err instanceof Error ? err.message : 'Error parsing CV';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
