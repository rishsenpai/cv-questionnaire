/**
 * Shared CV text extraction (PDF / .docx)
 * Used by both the manual /api/parse-cv endpoint and the cron Drive-sync flow.
 * Returns { text, error } instead of throwing so batch callers can skip bad files.
 */

let pdfParse;
try {
    pdfParse = require('pdf-parse');
} catch (e) {
    pdfParse = null;
}

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function isPdf(fileName, fileType) {
    return fileType === PDF_MIME || (fileName && fileName.toLowerCase().endsWith('.pdf'));
}

function isDocx(fileName, fileType) {
    return fileType === DOCX_MIME || (fileName && fileName.toLowerCase().endsWith('.docx'));
}

async function extractText({ buffer, fileName, fileType }) {
    if (!buffer || !buffer.length) {
        return { text: '', error: 'noFile' };
    }

    let text = '';

    if (isPdf(fileName, fileType)) {
        if (!pdfParse) {
            return { text: '', error: 'pdfParserUnavailable' };
        }
        try {
            const data = await pdfParse(buffer, { max: 0 });
            text = data.text || '';
        } catch (err) {
            console.error('PDF extract failed:', err.message);
            return { text: '', error: 'parseFailed' };
        }
    } else if (isDocx(fileName, fileType)) {
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(buffer);
            const documentXml = zip.readAsText('word/document.xml');
            text = documentXml
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        } catch (err) {
            console.error('DOCX extract failed:', err.message);
            return { text: '', error: 'parseFailed' };
        }
    } else {
        return { text: '', error: 'unsupported' };
    }

    if (!text || text.trim().length < 50) {
        return { text, error: 'tooShort' };
    }

    return { text, error: null };
}

module.exports = {
    extractText,
    PDF_MIME,
    DOCX_MIME,
    isPdf,
    isDocx
};
