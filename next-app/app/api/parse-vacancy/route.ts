import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/server/cvTextExtract';
import { parseVacancyWithAI } from '@/lib/server/embeddings';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { decodeBase64Limited } from '@/lib/server/security';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'parse-vacancy', limit: 15, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const body = await req.json();
        const { fileData, fileType, fileName } = body || {};

        if (!fileData) {
            return NextResponse.json({ success: false, message: 'Geen bestand aangeleverd' }, { status: 400 });
        }
        if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
            return NextResponse.json({ success: false, message: 'AI parsing is niet geconfigureerd' }, { status: 503 });
        }

        const { buffer, tooLarge } = decodeBase64Limited(fileData, MAX_FILE_BYTES);
        if (tooLarge) {
            return NextResponse.json({ success: false, message: 'Bestand te groot (max 10MB)' }, { status: 413 });
        }
        if (!buffer) {
            return NextResponse.json({ success: false, message: 'Geen bestand aangeleverd' }, { status: 400 });
        }
        const { text: extractedText, error } = await extractText({ buffer, fileName, fileType });

        if (error === 'unsupported') {
            return NextResponse.json({ success: false, message: 'Upload een PDF of Word (.docx) bestand' }, { status: 400 });
        }
        if (error === 'parseFailed') {
            return NextResponse.json({ success: false, message: 'Fout bij het lezen van bestand' }, { status: 400 });
        }
        if (!extractedText || extractedText.trim().length < 30) {
            return NextResponse.json({ success: false, message: 'Kon niet genoeg tekst uit het bestand halen' }, { status: 400 });
        }

        console.log(`Parsing vacancy with AI: ${extractedText.length} characters extracted`);
        const parsedData = await parseVacancyWithAI(extractedText);

        return NextResponse.json({
            success: true,
            data: parsedData,
            extractedTextLength: extractedText.length,
        });
    } catch (err) {
        console.error('Error in vacancy parsing:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Fout bij analyseren vacature' }, { status: 500 });
    }
}
