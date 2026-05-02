import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const cvs = await CV.find().select('-fileData').sort({ createdAt: -1 });
        return NextResponse.json({ success: true, count: cvs.length, data: cvs });
    } catch (err) {
        console.error('Error fetching CVs:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch CVs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const body = await req.json();
        const { fullName, email } = body || {};

        if (!fullName || !email) {
            return NextResponse.json(
                { success: false, message: 'Name and email are required' },
                { status: 400 },
            );
        }

        const cv = await CV.create({
            fullName,
            email,
            phone: body.phone,
            location: body.location,
            birthDate: body.birthDate,
            jobTitle: body.jobTitle,
            summary: body.summary,
            languages: body.languages,
            experience: body.experience,
            education: body.education,
            skills: body.skills,
            achievements: body.achievements,
            emailSent: true,
        });

        console.log(`CV manually added: ${cv.fullName} (${cv.email})`);
        return NextResponse.json({ success: true, message: 'CV added successfully', data: cv });
    } catch (err) {
        console.error('Error creating CV:', err);
        return NextResponse.json({ success: false, message: 'Failed to create CV' }, { status: 500 });
    }
}
