import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';
import {
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';

export const maxDuration = 300;

interface EmbeddingProgress {
    active: boolean;
    current: number;
    total: number;
    currentName: string;
    failed: number;
    startedAt: Date;
}

async function persistProgress(progress: EmbeddingProgress): Promise<void> {
    try {
        await SyncState.findOneAndUpdate(
            { key: 'embedding:progress' },
            { value: progress },
            { upsert: true, new: true },
        );
    } catch (err) {
        console.error('persistProgress error:', err instanceof Error ? err.message : err);
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json(
            { success: false, message: 'OPENAI_API_KEY is niet geconfigureerd' },
            { status: 503 },
        );
    }

    try {
        await connectDB();
        const cvsWithoutEmbedding = await CV.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } },
                { embedding: null },
            ],
        }).select('-fileData');

        if (cvsWithoutEmbedding.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Alle CV's hebben al embeddings",
                processed: 0,
                total: 0,
            });
        }

        const total = cvsWithoutEmbedding.length;
        const progress: EmbeddingProgress = {
            active: true,
            current: 0,
            total,
            currentName: '',
            failed: 0,
            startedAt: new Date(),
        };
        await persistProgress(progress);

        // Process in background (within function timeout window).
        // Vercel Fluid Compute keeps the work running even after we return —
        // 300s is plenty for ~hundreds of embeddings at ~200ms apart.
        (async () => {
            for (const cv of cvsWithoutEmbedding) {
                progress.currentName = cv.fullName || 'Onbekend';
                try {
                    const textToEmbed = prepareCVText(cv);
                    if (textToEmbed && textToEmbed.trim().length >= 50) {
                        const textHash = generateTextHash(textToEmbed);
                        const embedding = await generateEmbedding(textToEmbed);
                        await CV.findByIdAndUpdate(cv._id, { embedding, textHash });
                        progress.current++;
                        console.log(`Embedding ${progress.current}/${total}: ${cv.fullName}`);
                    } else {
                        progress.current++;
                        console.log(`Skipped (insufficient text): ${cv.fullName}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    progress.failed++;
                    progress.current++;
                    console.error(`Failed embedding for ${cv.fullName}:`, err instanceof Error ? err.message : err);
                }
                await persistProgress(progress);
            }
            progress.active = false;
            await persistProgress(progress);
            console.log(`Embedding generation complete: ${progress.current - progress.failed} success, ${progress.failed} failed`);
        })();

        return NextResponse.json({
            success: true,
            message: `Embedding generatie gestart voor ${total} CV's`,
            processing: total,
        });
    } catch (err) {
        console.error('Error starting embedding generation:', err);
        return NextResponse.json({ success: false, message: 'Failed to start embedding generation' }, { status: 500 });
    }
}
