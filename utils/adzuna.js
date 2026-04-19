/**
 * Adzuna API Integration
 * API for searching Dutch job vacancies
 * Docs: https://developer.adzuna.com/docs/search
 */

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

/**
 * Search for jobs in the Netherlands
 * @param {Object} options - Search options
 * @param {string} options.query - Job search query (e.g., "software developer")
 * @param {string} options.location - Location within NL (e.g., "amsterdam")
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.resultsPerPage - Results per page (default: 20, max: 50)
 * @param {string} options.sortBy - Sort: "date", "salary", "relevance" (default)
 * @param {number} options.maxDaysOld - Max age of jobs in days
 * @returns {Promise<Object>} - Search results with jobs array
 */
async function searchAdzunaJobs(options = {}) {
    const {
        query = 'developer',
        location = '',
        page = 1,
        resultsPerPage = 20,
        sortBy = 'date',
        maxDaysOld = 30,
        country = 'nl'  // Netherlands
    } = options;

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
        throw new Error('ADZUNA_APP_ID or ADZUNA_APP_KEY not configured in .env');
    }

    // Build URL
    const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: resultsPerPage.toString(),
        what: query,
        sort_by: sortBy,
        max_days_old: maxDaysOld.toString()
    });

    if (location) {
        params.append('where', location);
    }

    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Adzuna API Error:', response.status, errorText);
            throw new Error(`Adzuna API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform the response to our format
        return {
            success: true,
            totalJobs: data.count || 0,
            page: page,
            jobs: (data.results || []).map(job => ({
                id: job.id,
                title: job.title,
                company: job.company?.display_name || 'Onbekend bedrijf',
                companyLogo: null,  // Adzuna doesn't provide logos
                location: job.location?.display_name || '',
                description: job.description || '',
                applyLink: job.redirect_url,
                employmentType: job.contract_type || job.contract_time || '',
                isRemote: false,
                salary: {
                    min: job.salary_min,
                    max: job.salary_max,
                    currency: 'EUR',
                    period: 'year'
                },
                postedAt: job.created,
                source: 'adzuna',
                category: job.category?.label || ''
            }))
        };
    } catch (error) {
        console.error('Adzuna API Error:', error.message);
        throw error;
    }
}

/**
 * Get all available job categories in Netherlands
 */
async function getAdzunaCategories() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    const url = `${ADZUNA_BASE_URL}/nl/categories?app_id=${appId}&app_key=${appKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Search jobs matching a CV profile
 * @param {Object} cvData - CV data with skills, jobTitle, etc.
 * @returns {Promise<Object>} - Matching jobs
 */
async function findAdzunaJobsForCV(cvData) {
    // Build search query from CV data
    const queryParts = [];

    if (cvData.jobTitle) {
        queryParts.push(cvData.jobTitle);
    }

    if (cvData.skills) {
        // Extract first few skills
        const skills = cvData.skills.split(',').slice(0, 2).map(s => s.trim());
        queryParts.push(...skills);
    }

    const query = queryParts.slice(0, 3).join(' ') || 'developer';
    const location = cvData.location || '';

    return searchAdzunaJobs({
        query,
        location,
        maxDaysOld: 14,  // Recent jobs
        resultsPerPage: 20
    });
}

module.exports = {
    searchAdzunaJobs,
    getAdzunaCategories,
    findAdzunaJobsForCV
};
