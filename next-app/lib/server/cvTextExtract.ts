import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';

export const PDF_MIME = 'application/pdf';
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type ExtractError = 'noFile' | 'pdfParserUnavailable' | 'parseFailed' | 'unsupported' | 'tooShort';

export interface ExtractInput {
    buffer: Buffer;
    fileName?: string;
    fileType?: string;
}

export interface ExtractResult {
    text: string;
    error: ExtractError | null;
}

export function isPdf(fileName: string | undefined, fileType: string | undefined): boolean {
    return fileType === PDF_MIME || Boolean(fileName && fileName.toLowerCase().endsWith('.pdf'));
}

export function isDocx(fileName: string | undefined, fileType: string | undefined): boolean {
    return fileType === DOCX_MIME || Boolean(fileName && fileName.toLowerCase().endsWith('.docx'));
}

export async function extractText({ buffer, fileName, fileType }: ExtractInput): Promise<ExtractResult> {
    if (!buffer || !buffer.length) {
        return { text: '', error: 'noFile' };
    }

    let text = '';

    if (isPdf(fileName, fileType)) {
        try {
            const data = await pdfParse(buffer, { max: 0 });
            text = data.text || '';
        } catch (err) {
            console.error('PDF extract failed:', err instanceof Error ? err.message : err);
            return { text: '', error: 'parseFailed' };
        }
    } else if (isDocx(fileName, fileType)) {
        try {
            const zip = new AdmZip(buffer);
            const documentXml = zip.readAsText('word/document.xml');
            text = documentXml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        } catch (err) {
            console.error('DOCX extract failed:', err instanceof Error ? err.message : err);
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
