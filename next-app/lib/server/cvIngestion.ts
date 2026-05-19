import CV from '@/models/CV';
import { extractText } from './cvTextExtract';
import { uploadCvBlob } from './blobStorage';
import {
    parseCVWithAI,
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from './embeddings';
import { linkCandidateByCvEmail } from './candidateCvLink';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type IngestSkipReason =
    | 'driveFileId-exists'
    | 'sameFileNameAndSize'
    | 'tooLarge'
    | 'noFile'
    | 'pdfParserUnavailable'
    | 'parseFailed'
    | 'unsupported'
    | 'tooShort'
    | 'aiParseFailed'
    | 'duplicateNameAndExperience';

export interface IngestResult {
    created?: boolean;
    cvId?: string;
    skipped?: boolean;
    reason?: IngestSkipReason;
    existingCvId?: string;
    existingCvName?: string;
}

export interface IngestOptions {
    buffer: Buffer;
    fileName: string;
    fileType: string;
    fileSize?: number;
    driveFileId?: string;
    isInternal?: boolean;
    lang?: 'en' | 'nl' | 'es';
}

function extractFirstExperience(experience: string | undefined): string {
    if (!experience) return '';
    return experience.split('\n')[0].trim().toLowerCase().substring(0, 100);
}

function fileNameToName(fileName: string | undefined): string {
    if (!fileName) return '';
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
}

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
        console.error(`embedCvAsync failed for ${cvId}:`, err instanceof Error ? err.message : err);
    }
}

export async function ingestCvFromBuffer({
    buffer,
    fileName,
    fileType,
    fileSize,
    driveFileId,
    isInternal = false,
    lang = 'nl',
}: IngestOptions): Promise<IngestResult> {
    if (driveFileId) {
        const exists = await CV.exists({ driveFileId });
        if (exists) return { skipped: true, reason: 'driveFileId-exists' };
    }

    const size = fileSize != null ? Number(fileSize) : (buffer ? buffer.length : 0);

    if (fileName && size) {
        const sameFile = await CV.findOne({ fileName, fileSize: size }).select('_id fullName');
        if (sameFile) {
            return {
                skipped: true,
                reason: 'sameFileNameAndSize',
                existingCvId: String(sameFile._id),
                existingCvName: sameFile.fullName,
            };
        }
    }

    if (size > MAX_FILE_BYTES) {
        return { skipped: true, reason: 'tooLarge' };
    }

    const { text, error } = await extractText({ buffer, fileName, fileType });
    if (error) {
        return { skipped: true, reason: error };
    }

    let parsed;
    try {
        parsed = await parseCVWithAI(text, lang);
    } catch (err) {
        console.error('parseCVWithAI failed:', err instanceof Error ? err.message : err);
        return { skipped: true, reason: 'aiParseFailed' };
    }

    const cvName = (parsed.fullName && parsed.fullName.trim()) || fileNameToName(fileName) || 'Onbekend';
    const firstExp = extractFirstExperience(parsed.experience);

    const existingByName = await CV.find({
        fullName: { $regex: new RegExp(`^${cvName.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).select('fullName experience');

    const duplicate = existingByName.find(cv => extractFirstExperience(cv.experience) === firstExp);
    if (duplicate) {
        return {
            skipped: true,
            reason: 'duplicateNameAndExperience',
            existingCvId: String(duplicate._id),
            existingCvName: duplicate.fullName,
        };
    }

    let fileUrl: string | undefined;
    try {
        fileUrl = await uploadCvBlob(buffer, fileName, fileType);
    } catch (err) {
        console.error('uploadCvBlob failed:', err instanceof Error ? err.message : err);
    }

    const cvData: Record<string, unknown> = {
        fullName: cvName,
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        birthDate: parsed.birthDate || '',
        languages: parsed.languages || '',
        jobTitle: parsed.jobTitle || '',
        summary: parsed.summary || '',
        experience: parsed.experience || '',
        education: parsed.education || '',
        skills: parsed.skills || '',
        achievements: parsed.achievements || '',
        fullText: text,
        fileName,
        fileType,
        fileSize: size,
        isInternal,
        emailSent: true,
    };
    if (fileUrl) cvData.fileUrl = fileUrl;
    if (driveFileId) cvData.driveFileId = driveFileId;
    const cv = new CV(cvData);
    const saved = await cv.save();

    if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
        embedCvAsync(String(saved._id)).catch(err => console.error('embedCvAsync error:', err.message));
    }

    // Reverse link: als er een Candidate-account bestaat met dezelfde email, koppel direct.
    if (parsed.email) {
        linkCandidateByCvEmail(String(saved._id), parsed.email).catch(err =>
            console.error('linkCandidateByCvEmail failed:', err instanceof Error ? err.message : err),
        );
    }

    return { created: true, cvId: String(saved._id) };
}
