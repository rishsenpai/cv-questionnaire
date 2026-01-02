const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_TOKENS = 8000; // Safe limit for embedding model

/**
 * Generate a hash from text for deduplication
 * Uses SHA-256 for fast, collision-resistant hashing
 * @param {string} text - Text to hash
 * @returns {string} - Hex hash of the text
 */
function generateTextHash(text) {
    if (!text) return null;
    // Normalize text: trim, lowercase, remove extra whitespace
    const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalizedText).digest('hex');
}

/**
 * Generate a deterministic mock embedding based on text hash (for tests)
 * @param {string} text - Text to create mock embedding for
 * @returns {number[]} - Mock embedding vector (1536 dimensions)
 */
function generateMockEmbedding(text) {
    // Create a simple hash from the text for deterministic results
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Generate deterministic "embedding" based on hash
    const embedding = [];
    for (let i = 0; i < 1536; i++) {
        // Use hash + index to generate pseudo-random but deterministic values
        const seed = hash + i * 31;
        embedding.push(Math.sin(seed) * 0.5);
    }
    return embedding;
}

/**
 * Generate embedding for text using OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector (1536 dimensions)
 */
async function generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for embedding');
    }

    // Use mock embeddings in test mode to avoid API costs
    if (process.env.NODE_ENV === 'test') {
        console.log('Test mode: using mock embedding');
        return generateMockEmbedding(text);
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    // Truncate text if too long (rough estimate: 4 chars per token)
    const truncatedText = text.slice(0, MAX_TOKENS * 4);

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: truncatedText
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error.message);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddings(texts) {
    if (!texts || texts.length === 0) {
        return [];
    }

    const truncatedTexts = texts.map(text =>
        (text || '').slice(0, MAX_TOKENS * 4)
    );

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: truncatedTexts
        });

        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error('Error generating embeddings:', error.message);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) {
        return 0;
    }

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

/**
 * Prepare CV text for embedding
 * Combines relevant fields into a single searchable text
 * @param {Object} cv - CV document
 * @returns {string} - Combined text for embedding
 */
function prepareCVText(cv) {
    const parts = [];

    if (cv.jobTitle) parts.push(`Functie: ${cv.jobTitle}`);
    if (cv.skills) parts.push(`Vaardigheden: ${cv.skills}`);
    if (cv.experience) parts.push(`Werkervaring: ${cv.experience}`);
    if (cv.education) parts.push(`Opleiding: ${cv.education}`);
    if (cv.languages) parts.push(`Talen: ${cv.languages}`);
    if (cv.summary) parts.push(`Samenvatting: ${cv.summary}`);
    if (cv.achievements) parts.push(`Prestaties: ${cv.achievements}`);

    // Use fullText as fallback if structured fields are empty
    if (parts.length === 0 && cv.fullText) {
        return cv.fullText;
    }

    return parts.join('\n\n');
}

/**
 * Find matching CVs for a vacancy using embeddings
 * @param {number[]} vacancyEmbedding - Vacancy embedding vector
 * @param {Array} cvs - Array of CV documents with embeddings
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Sorted array of CVs with similarity scores
 */
function findMatches(vacancyEmbedding, cvs, limit = 20) {
    const scored = cvs
        .filter(cv => cv.embedding && cv.embedding.length > 0)
        .map(cv => ({
            ...cv,
            similarityScore: cosineSimilarity(vacancyEmbedding, cv.embedding)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    return scored;
}

/**
 * Parse CV text using GPT to extract structured fields
 * @param {string} cvText - Raw text extracted from CV
 * @param {string} lang - Language for response (en, nl, es)
 * @returns {Promise<Object>} - Structured CV data
 */
async function parseCVWithAI(cvText, lang = 'en') {
    if (!cvText || cvText.trim().length < 50) {
        throw new Error('CV text is too short to parse');
    }

    // Use mock response in test mode to avoid API costs
    if (process.env.NODE_ENV === 'test') {
        console.log('Test mode: using mock CV parsing');
        return {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '+31612345678',
            location: 'Amsterdam, Netherlands',
            birthDate: '01/01/1990',
            languages: 'Dutch (native), English (fluent)',
            jobTitle: 'Software Developer',
            summary: 'Experienced developer with 5 years of experience.',
            experience: 'Software Developer at TestCorp (2019-present)',
            education: 'BSc Computer Science, University of Amsterdam',
            skills: 'JavaScript, Python, React, Node.js',
            achievements: 'Led team of 5 developers'
        };
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `You are a CV/resume parser. Extract information from the CV text and return a JSON object with the following fields. If a field cannot be found, use an empty string.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

Fields to extract:
- fullName: Full name of the person
- email: Email address
- phone: Phone number (include country code if present)
- location: City, Country or address
- birthDate: Date of birth in format dd/mm/yyyy (convert from any format)
- languages: Languages spoken with proficiency levels
- jobTitle: Current or most recent job title
- summary: Professional summary or objective (2-3 sentences)
- experience: Work experience with dates, companies, and responsibilities
- education: Education history with institutions and dates
- skills: Technical and soft skills
- achievements: Notable achievements, certifications, or projects

Keep the original language of the CV content for experience, education, skills, etc.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Parse this CV:\n\n${cvText.slice(0, 15000)}` }
            ],
            temperature: 0.1,
            max_tokens: 4000
        });

        const content = response.choices[0].message.content.trim();

        // Try to parse JSON, handling potential markdown code blocks
        let jsonStr = content;
        if (content.startsWith('```')) {
            jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        return parsed;
    } catch (error) {
        console.error('Error parsing CV with AI:', error.message);
        throw error;
    }
}

/**
 * Parse vacancy text using GPT to extract structured fields
 * @param {string} vacancyText - Raw text extracted from vacancy document
 * @returns {Promise<Object>} - Structured vacancy data
 */
async function parseVacancyWithAI(vacancyText) {
    if (!vacancyText || vacancyText.trim().length < 30) {
        throw new Error('Vacancy text is too short to parse');
    }

    // Use mock response in test mode to avoid API costs
    if (process.env.NODE_ENV === 'test') {
        console.log('Test mode: using mock vacancy parsing');
        return {
            title: 'Software Developer',
            location: 'Amsterdam, Netherlands',
            requirements: 'Looking for experienced developer with JavaScript skills.'
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

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Parse this vacancy:\n\n${vacancyText.slice(0, 15000)}` }
            ],
            temperature: 0.1,
            max_tokens: 4000
        });

        const content = response.choices[0].message.content.trim();

        // Try to parse JSON, handling potential markdown code blocks
        let jsonStr = content;
        if (content.startsWith('```')) {
            jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        return parsed;
    } catch (error) {
        console.error('Error parsing vacancy with AI:', error.message);
        throw error;
    }
}

module.exports = {
    generateEmbedding,
    generateEmbeddings,
    generateTextHash,
    cosineSimilarity,
    prepareCVText,
    findMatches,
    parseCVWithAI,
    parseVacancyWithAI,
    EMBEDDING_MODEL
};
