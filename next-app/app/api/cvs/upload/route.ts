import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';
import { extractFirstExperience } from '@/lib/server/cvDocument';
import { uploadCvBlob } from '@/lib/server/blobStorage';
import {
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

async function embedCvAsync(cvId: string): Promise<void> {
    try {
        const cv = await CV.findById(cvId).select('+textHash +embedding');
        if (!cv) return;
        const textToEmbed = prepareCVText(cv);
        if (!textToEmbed || textToEmbed.trim().length < 50) return;
        const newHash = generateTextHash(textToEmbed);
        if (cv.textHash === newHash && cv.embedding && cv.embedding.length > 0) return;
        const embedding = await generateEmbedding(textToEmbed);
        await CV.findByIdAndUpdate(cvId, { embedding, textHash: newHash });
    } catch (err) {
        console.error('embedCvAsync (upload) failed:', err instanceof Error ? err.message : err);
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const body = await req.json();
        const {
            fullName, email, phone, jobTitle, location, summary, experience,
            education, skills, fullText, fileName, fileData, fileType, fileSize,
        } = body || {};

        if (!fileData) {
            return NextResponse.json({ success: false, message: 'File is required' }, { status: 400 });
        }
        if (fileSize > MAX_FILE_BYTES) {
            return NextResponse.json(
                { success: false, message: 'File size must be less than 10MB' },
                { status: 400 },
            );
        }

        const cvName = fullName || (fileName || '').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const nameLower = String(cvName).trim().toLowerCase();
        const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const firstExp = extractFirstExperience(experience);

        const existingCVs = await CV.find({
            fullName: { $regex: new RegExp(`^${escaped}$`, 'i') },
        });
        const duplicate = existingCVs.find(
            cv => extractFirstExperience(cv.experience) === firstExp,
        );

        if (duplicate) {
            return NextResponse.json(
                {
                    success: false,
                    message: `CV voor "${cvName}" met deze werkervaring bestaat al`,
                    duplicate: true,
                    existingCvId: String(duplicate._id),
                    existingCvName: duplicate.fullName,
                },
                { status: 409 },
            );
        }

        let fileUrl: string | undefined;
        try {
            const buffer = Buffer.from(fileData, 'base64');
            fileUrl = await uploadCvBlob(buffer, fileName, fileType);
        } catch (err) {
            console.error('uploadCvBlob (upload route) failed:', err instanceof Error ? err.message : err);
            return NextResponse.json(
                { success: false, message: 'File storage upload failed' },
                { status: 500 },
            );
        }

        const cv = await CV.create({
            fullName: cvName,
            email: email || '',
            phone: phone || '',
            jobTitle: jobTitle || '',
            location: location || '',
            summary: summary || '',
            experience: experience || '',
            education: education || '',
            skills: skills || '',
            fullText: fullText || '',
            fileName,
            fileUrl,
            fileType,
            fileSize,
            emailSent: true,
        });
        console.log(`CV file uploaded: ${cv.fullName} - ${fileName}`);

        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            embedCvAsync(String(cv._id)).catch(err => {
                console.error('Error generating embedding for CV:', err.message);
            });
        }

        return NextResponse.json({
            success: true,
            message: 'CV uploaded successfully',
            data: {
                _id: String(cv._id),
                fullName: cv.fullName,
                email: cv.email,
                jobTitle: cv.jobTitle,
                location: cv.location,
                fileName: cv.fileName,
                fileSize: cv.fileSize,
            },
        });
    } catch (err) {
        console.error('Error uploading CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to upload CV' }, { status: 500 });
    }
}
