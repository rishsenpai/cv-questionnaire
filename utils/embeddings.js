const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_TOKENS = 8000; // Safe limit for embedding model

/**
 * Generate embedding for text using OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector (1536 dimensions)
 */
async function generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for embedding');
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

module.exports = {
    generateEmbedding,
    generateEmbeddings,
    cosineSimilarity,
    prepareCVText,
    findMatches,
    EMBEDDING_MODEL
};
