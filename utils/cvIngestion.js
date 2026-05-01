/**
 * Headless CV ingestion: takes a buffer from an external source (Google Drive today,
 * potentially other sources later) and persists a CV document using the same
 * parsing pipeline as the manual admin-upload flow.
 *
 * Mirrors the logic of POST /api/cvs/upload (server.js:4048) — deduplication,
 * fallback fullName, async embedding — but without HTTP/admin-auth concerns.
 */

const CV = require('../models/CV');
const { extractText } = require('./cvTextExtract');
const {
    parseCVWithAI,
    generateEmbedding,
    generateTextHash,
    prepareCVText
} = require('./embeddings');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, mirrors server.js:4070

function extractFirstExperience(experience) {
    if (!experience) return '';
    return experience.split('\n')[0].trim().toLowerCase().substring(0, 100);
}

function fileNameToName(fileName) {
    if (!fileName) return '';
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
}

async function embedCvAsync(cvId) {
    try {
        const cv = await CV.findById(cvId).select('+textHash');
        if (!cv) return;
        const textToEmbed = prepareCVText(cv);
        if (!textToEmbed || textToEmbed.trim().length < 50) return;
        const newHash = generateTextHash(textToEmbed);
        if (cv.textHash === newHash && cv.embedding && cv.embedding.length > 0) return;
        const embedding = await generateEmbedding(textToEmbed);
        await CV.findByIdAndUpdate(cvId, { embedding, textHash: newHash });
    } catch (err) {
        console.error(`embedCvAsync failed for ${cvId}:`, err.message);
    }
}

/**
 * Ingest a CV from a raw buffer.
 * @param {object} opts
 * @param {Buffer} opts.buffer
 * @param {string} opts.fileName
 * @param {string} opts.fileType    MIME type
 * @param {number} opts.fileSize
 * @param {string} [opts.driveFileId] Optional Drive file id (enables dedup-by-fileId for the cron path; manual admin uploads pass nothing)
 * @param {boolean} [opts.isInternal=true] Whether the CV is "internal" (admin/cron) vs candidate-submitted
 * @param {string} [opts.lang='nl']
 * @returns {Promise<{created?: boolean, cvId?: string, skipped?: boolean, reason?: string}>}
 */
async function ingestCvFromBuffer({ buffer, fileName, fileType, fileSize, driveFileId, isInternal = true, lang = 'nl' }) {
    // Cheap dedup first — avoid AI costs for already-known Drive files.
    if (driveFileId) {
        const exists = await CV.exists({ driveFileId });
        if (exists) {
            return { skipped: true, reason: 'driveFileId-exists' };
        }
    }

    const size = fileSize != null ? Number(fileSize) : (buffer ? buffer.length : 0);

    // Cheap content-identity dedup: same filename + exact byte size is almost certainly
    // the same file. Catches re-uploads of the same batch without paying for extract+GPT.
    if (fileName && size) {
        const sameFile = await CV.findOne({ fileName, fileSize: size }).select('_id fullName');
        if (sameFile) {
            return {
                skipped: true,
                reason: 'sameFileNameAndSize',
                existingCvId: String(sameFile._id),
                existingCvName: sameFile.fullName
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
        console.error('parseCVWithAI failed:', err.message);
        return { skipped: true, reason: 'aiParseFailed' };
    }

    const cvName = (parsed.fullName && parsed.fullName.trim()) || fileNameToName(fileName) || 'Onbekend';
    const firstExp = extractFirstExperience(parsed.experience);

    // Secondary dedup: same person + same first-experience line already stored
    // (handles Drive copies/re-uploads where driveFileId is different but content is identical).
    const existingByName = await CV.find({
        fullName: { $regex: new RegExp(`^${cvName.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).select('fullName experience');

    const duplicate = existingByName.find(cv => extractFirstExperience(cv.experience) === firstExp);
    if (duplicate) {
        return {
            skipped: true,
            reason: 'duplicateNameAndExperience',
            existingCvId: String(duplicate._id),
            existingCvName: duplicate.fullName
        };
    }

    const cvData = {
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
        fileData: buffer.toString('base64'),
        fileType,
        fileSize: size,
        isInternal,
        emailSent: true
    };
    if (driveFileId) cvData.driveFileId = driveFileId;
    const cv = new CV(cvData);

    const saved = await cv.save();

    // Fire-and-forget embedding (gated like server.js:4126).
    if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'test') {
        embedCvAsync(saved._id).catch(err => console.error('embedCvAsync error:', err.message));
    }

    return { created: true, cvId: String(saved._id) };
}

module.exports = {
    ingestCvFromBuffer,
    MAX_FILE_BYTES
};
