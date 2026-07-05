import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import BackupContact from '@/models/BackupContact';
import {
    generateCVHTML,
    generateWordCVBuffer,
    extractFirstExperience,
    type CVFormData,
} from '@/lib/server/cvDocument';
import { getTransporter } from '@/lib/server/mailer';
import { errorMessages, type Language } from '@/lib/server/i18n';
import {
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';
import { linkCandidateByCvEmail } from '@/lib/server/candidateCvLink';
import { enforceRateLimit } from '@/lib/server/rateLimit';

export const maxDuration = 60;

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
        console.error('embedCvAsync (submit-cv) failed:', err instanceof Error ? err.message : err);
    }
}

export async function POST(req: NextRequest) {
    try {
        // Onauth endpoint dat DB-records aanmaakt, e-mail stuurt en (async) embeddings
        // genereert → begrens tegen massale CV-spam.
        const limited = await enforceRateLimit(req, { name: 'submit-cv', limit: 20, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const formData = await req.json() as CVFormData & { language?: Language };
        const lang: Language = formData.language && ['en', 'nl', 'es'].includes(formData.language)
            ? formData.language
            : 'en';
        const t = errorMessages[lang];

        if (!formData.fullName || !formData.email) {
            return NextResponse.json(
                { success: false, message: t.requiredFields },
                { status: 400 },
            );
        }

        await connectDB();

        const nameLower = formData.fullName.trim().toLowerCase();
        const firstExp = extractFirstExperience(formData.experience);
        const escapedName = nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingCVs = await CV.find({
            fullName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        });
        const duplicateCv = existingCVs.find(
            cv => extractFirstExperience(cv.experience) === firstExp,
        );

        if (duplicateCv) {
            // Terugkerende kandidaat: geen nieuw CV aanmaken, maar direct naar
            // de matches van het bestaande CV sturen i.p.v. blokkeren.
            return NextResponse.json(
                {
                    success: true,
                    duplicate: true,
                    message: t.duplicateCV,
                    cvId: String(duplicateCv._id),
                },
                { status: 200 },
            );
        }

        const cv = await CV.create({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            birthDate: formData.birthDate,
            jobTitle: formData.jobTitle,
            summary: formData.summary,
            languages: formData.languages,
            experience: formData.experience,
            education: formData.education,
            skills: formData.skills,
            achievements: formData.achievements,
            emailSent: false,
        });
        console.log(`CV saved to database with ID: ${cv._id}`);

        try {
            await BackupContact.findOneAndUpdate(
                { email: formData.email.toLowerCase().trim() },
                { status: 'cv_submitted', cvId: cv._id },
            );
        } catch {
            // ignore — backup contact may not exist
        }

        if (mongoose.connection.readyState === 1) {
            const cvHTML = generateCVHTML(formData);
            const wordBuffer = await generateWordCVBuffer(formData);

            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.RECIPIENT_EMAIL,
                subject: `New CV Submission: ${formData.fullName}`,
                html: cvHTML,
                replyTo: formData.email,
                attachments: [{
                    filename: `CV_${(formData.fullName || 'Applicant').replace(/\s+/g, '_')}.docx`,
                    content: wordBuffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                }],
            });

            await CV.findByIdAndUpdate(cv._id, { emailSent: true });
        }

        console.log(`CV received from ${formData.fullName} (${formData.email})`);

        if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
            embedCvAsync(String(cv._id)).catch(err => {
                console.error('Error generating embedding for submitted CV:', err.message);
            });
        }

        // Koppel direct aan een Candidate-account met dezelfde email (indien aanwezig).
        if (formData.email) {
            linkCandidateByCvEmail(String(cv._id), formData.email).catch(err =>
                console.error('linkCandidateByCvEmail (submit-cv) failed:', err instanceof Error ? err.message : err),
            );
        }

        return NextResponse.json({
            success: true,
            message: 'CV submitted successfully!',
            cvId: String(cv._id),
        });
    } catch (err) {
        console.error('Error submitting CV:', err);
        return NextResponse.json(
            { success: false, message: 'Failed to submit CV. Please try again.' },
            { status: 500 },
        );
    }
}
