import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

function getToken(): string {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
    return token;
}

function extFromFileName(fileName: string | undefined): string {
    if (!fileName) return 'bin';
    const m = fileName.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : 'bin';
}

export async function uploadCvBlob(
    buffer: Buffer,
    fileName: string,
    fileType: string,
): Promise<string> {
    const ext = extFromFileName(fileName);
    const pathname = `cvs/${randomUUID()}.${ext}`;
    const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: fileType || 'application/octet-stream',
        token: getToken(),
    });
    return blob.url;
}

export async function fetchCvBlob(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Blob fetch failed: ${res.status} ${res.statusText}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}
