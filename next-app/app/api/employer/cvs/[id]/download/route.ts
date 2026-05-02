import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireEmployer } from '@/lib/server/auth';
import { generateWordCVBuffer } from '@/lib/server/cvDocument';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;

    try {
        if (auth.plan === 'basic') {
            return NextResponse.json(
                { success: false, message: 'Upgrade naar Advanced of Premium om CVs te downloaden' },
                { status: 403 },
            );
        }
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findById(id);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }
        if (cv.isInternal) {
            return NextResponse.json({ success: false, message: 'Dit CV is niet beschikbaar' }, { status: 403 });
        }
        if (cv.fileData) {
            return NextResponse.json({
                success: true,
                data: { fileName: cv.fileName, fileType: cv.fileType, fileData: cv.fileData },
            });
        }
        const wordBuffer = await generateWordCVBuffer({
            fullName: cv.fullName,
            email: cv.email,
            phone: cv.phone,
            location: cv.location,
            birthDate: cv.birthDate,
            jobTitle: cv.jobTitle,
            summary: cv.summary,
            languages: cv.languages,
            experience: cv.experience,
            education: cv.education,
            skills: cv.skills,
            achievements: cv.achievements,
        });
        return NextResponse.json({
            success: true,
            data: {
                fileName: `CV_${(cv.fullName || 'Applicant').replace(/\s+/g, '_')}.docx`,
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileData: wordBuffer.toString('base64'),
            },
        });
    } catch (err) {
        console.error('Error downloading CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to download CV' }, { status: 500 });
    }
}
