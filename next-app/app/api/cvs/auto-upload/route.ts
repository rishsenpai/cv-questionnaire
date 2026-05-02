import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { ingestCvFromBuffer } from '@/lib/server/cvIngestion';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const body = await req.json();
        const { fileName, fileType, fileSize, fileData, lang } = body || {};

        if (!fileData || !fileName) {
            return NextResponse.json(
                { success: false, message: 'fileName and fileData are required' },
                { status: 400 },
            );
        }

        let buffer: Buffer;
        try {
            buffer = Buffer.from(fileData, 'base64');
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid base64 fileData' },
                { status: 400 },
            );
        }

        const result = await ingestCvFromBuffer({
            buffer,
            fileName,
            fileType,
            fileSize: fileSize != null ? Number(fileSize) : buffer.length,
            isInternal: true,
            lang: lang === 'en' || lang === 'es' ? lang : 'nl',
        });

        if (result.created) {
            return NextResponse.json({
                success: true,
                status: 'created',
                cvId: result.cvId,
                fileName,
            });
        }

        return NextResponse.json({
            success: false,
            status: 'skipped',
            reason: result.reason,
            fileName,
            existingCvId: result.existingCvId,
            existingCvName: result.existingCvName,
        });
    } catch (err) {
        console.error('auto-upload error:', err);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
