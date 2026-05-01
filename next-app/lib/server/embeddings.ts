import OpenAI from 'openai';
import crypto from 'crypto';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_TOKENS = 8000;

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

export interface ParsedCV {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    birthDate: string;
    languages: string;
    jobTitle: string;
    summary: string;
    experience: string;
    education: string;
    skills: string;
    achievements: string;
}

export interface ParsedVacancy {
    title: string;
    location: string;
    requirements: string;
}

export function generateTextHash(text: string): string | null {
    if (!text) return null;
    const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalizedText).digest('hex');
}

function generateMockEmbedding(text: string): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const embedding: number[] = [];
    for (let i = 0; i < 1536; i++) {
        const seed = hash + i * 31;
        embedding.push(Math.sin(seed) * 0.5);
    }
    return embedding;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for embedding');
    }
    if (process.env.NODE_ENV === 'test') {
        return generateMockEmbedding(text);
    }
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }
    const truncatedText = text.slice(0, MAX_TOKENS * 4);
    const response = await getOpenAI().embeddings.create({
        model: EMBEDDING_MODEL,
        input: truncatedText,
    });
    return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    const truncatedTexts = texts.map(t => (t || '').slice(0, MAX_TOKENS * 4));
    const response = await getOpenAI().embeddings.create({
        model: EMBEDDING_MODEL,
        input: truncatedTexts,
    });
    return response.data.map(item => item.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

export interface CVForEmbedding {
    jobTitle?: string;
    skills?: string;
    experience?: string;
    education?: string;
    languages?: string;
    summary?: string;
    achievements?: string;
    fullText?: string;
}

export function prepareCVText(cv: CVForEmbedding): string {
    const parts: string[] = [];
    if (cv.jobTitle) parts.push(`Functie: ${cv.jobTitle}`);
    if (cv.skills) parts.push(`Vaardigheden: ${cv.skills}`);
    if (cv.experience) parts.push(`Werkervaring: ${cv.experience}`);
    if (cv.education) parts.push(`Opleiding: ${cv.education}`);
    if (cv.languages) parts.push(`Talen: ${cv.languages}`);
    if (cv.summary) parts.push(`Samenvatting: ${cv.summary}`);
    if (cv.achievements) parts.push(`Prestaties: ${cv.achievements}`);
    if (parts.length === 0 && cv.fullText) return cv.fullText;
    return parts.join('\n\n');
}

export interface CVWithEmbedding {
    embedding?: number[];
    [key: string]: unknown;
}

export function findMatches<T extends CVWithEmbedding>(
    vacancyEmbedding: number[],
    cvs: T[],
    limit = 20,
): Array<T & { similarityScore: number }> {
    return cvs
        .filter(cv => cv.embedding && cv.embedding.length > 0)
        .map(cv => ({
            ...cv,
            similarityScore: cosineSimilarity(vacancyEmbedding, cv.embedding as number[]),
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
}

export async function parseCVWithAI(cvText: string, lang: 'en' | 'nl' | 'es' = 'en'): Promise<ParsedCV> {
    if (!cvText || cvText.trim().length < 50) {
        throw new Error('CV text is too short to parse');
    }
    if (process.env.NODE_ENV === 'test') {
        const suffix = crypto.createHash('sha256').update(cvText).digest('hex').slice(0, 8);
        return {
            fullName: `Test User ${suffix}`,
            email: 'test@example.com',
            phone: '+31612345678',
            location: 'Amsterdam, Netherlands',
            birthDate: '01/01/1990',
            languages: 'Dutch (native), English (fluent)',
            jobTitle: 'Software Developer',
            summary: 'Experienced developer with 5 years of experience.',
            experience: `Software Developer at TestCorp-${suffix} (2019-present)`,
            education: 'BSc Computer Science, University of Amsterdam',
            skills: 'JavaScript, Python, React, Node.js',
            achievements: 'Led team of 5 developers',
        };
    }
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `You are a CV/resume parser. Extract information from the CV text and return a JSON object.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no explanation
2. ALL values must be STRINGS (not arrays or objects)
3. If a field cannot be found, use empty string ""
4. Keep the original language of the CV content

Fields to extract (all as strings):
- fullName: Full name of the person
- email: Email address (look for @ symbol)
- phone: Phone number with country code if present
- location: City and/or Country
- birthDate: Date of birth as "dd/mm/yyyy" (convert from any format found)
- languages: Languages with proficiency, e.g. "Nederlands (moedertaal), Engels (vloeiend), Duits (basis)"
- jobTitle: Current or most recent job title/function
- summary: Professional summary in 2-3 sentences based on the CV content
- experience: Work history as readable text, format each job as "Title at Company (period): responsibilities" separated by newlines
- education: Education as readable text, format as "Degree - Institution (year)" separated by newlines
- skills: Comma-separated list of technical and soft skills
- achievements: Notable achievements, certifications, projects as comma-separated list

Example format for experience (as string, not array):
"Software Developer at TechCorp (2020-2023): Developed web apps, led team of 5\\nJunior Dev at StartupX (2018-2020): Built APIs"

Example format for education (as string, not array):
"MSc Computer Science - University of Amsterdam (2018)\\nBSc Informatica - HvA (2016)"`;

    void lang;
    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse this CV:\n\n${cvText.slice(0, 15000)}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
    });

    const content = (response.choices[0].message.content || '').trim();
    let jsonStr = content;
    if (content.startsWith('```')) {
        jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonStr) as ParsedCV;
}

export async function parseVacancyWithAI(vacancyText: string): Promise<ParsedVacancy> {
    if (!vacancyText || vacancyText.trim().length < 30) {
        throw new Error('Vacancy text is too short to parse');
    }
    if (process.env.NODE_ENV === 'test') {
        return {
            title: 'Software Developer',
            location: 'Amsterdam, Netherlands',
            requirements: 'Looking for experienced developer with JavaScript skills.',
        };
    }
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `You are a job vacancy parser. Extract information from the vacancy text and return a JSON object with the following fields. If a field cannot be found, make a reasonable inference or use an empty string.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

Fields to extract:
- title: Job title (e.g., "Senior Software Developer", "Marketing Manager")
- location: Work location (city, country, or "Remote")
- requirements: Full description of the job including requirements, responsibilities, qualifications, and any other relevant details. Combine all relevant information into one comprehensive text.

Keep the original language of the vacancy content.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse this vacancy:\n\n${vacancyText.slice(0, 15000)}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
    });

    const content = (response.choices[0].message.content || '').trim();
    let jsonStr = content;
    if (content.startsWith('```')) {
        jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonStr) as ParsedVacancy;
}
