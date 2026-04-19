/**
 * JSearch API Integration
 * API for searching job vacancies from LinkedIn, Indeed, Glassdoor, etc.
 * Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */

const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

/**
 * Search for jobs based on query and location
 * @param {Object} options - Search options
 * @param {string} options.query - Job search query (e.g., "software developer")
 * @param {string} options.location - Location (e.g., "Netherlands", "Amsterdam")
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.numPages - Number of pages to fetch (default: 1)
 * @param {string} options.datePosted - Filter: "all", "today", "3days", "week", "month"
 * @param {string} options.remoteOnly - Filter: "true" for remote jobs only
 * @param {string} options.employmentType - Filter: "FULLTIME", "PARTTIME", "CONTRACTOR", "INTERN"
 * @returns {Promise<Object>} - Search results with jobs array
 */
async function searchJobs(options = {}) {
    const {
        query = 'developer',
        location = 'Netherlands',
        page = 1,
        numPages = 1,
        datePosted = 'all',
        remoteOnly = 'false',
        employmentType = ''
    } = options;

    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
        throw new Error('RAPIDAPI_KEY not configured in .env');
    }

    const params = new URLSearchParams({
        query: `${query} in ${location}`,
        page: page.toString(),
        num_pages: numPages.toString(),
        date_posted: datePosted
    });

    if (remoteOnly === 'true') {
        params.append('remote_jobs_only', 'true');
    }

    if (employmentType) {
        params.append('employment_types', employmentType);
    }

    const url = `https://${JSEARCH_API_HOST}/search?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': JSEARCH_API_HOST
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('JSearch API Error:', response.status, errorText);
            throw new Error(`JSearch API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform the response to a cleaner format
        return {
            success: true,
            totalJobs: data.data?.length || 0,
            jobs: (data.data || []).map(job => ({
                id: job.job_id,
                title: job.job_title,
                company: job.employer_name,
                companyLogo: job.employer_logo,
                location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
                isRemote: job.job_is_remote,
                employmentType: job.job_employment_type,
                description: job.job_description,
                highlights: job.job_highlights,
                applyLink: job.job_apply_link,
                postedAt: job.job_posted_at_datetime_utc,
                salary: {
                    min: job.job_min_salary,
                    max: job.job_max_salary,
                    currency: job.job_salary_currency,
                    period: job.job_salary_period
                },
                source: job.job_publisher
            }))
        };
    } catch (error) {
        console.error('JSearch API Error:', error.message);
        throw error;
    }
}

/**
 * Get detailed information about a specific job
 * @param {string} jobId - The job ID from search results
 * @returns {Promise<Object>} - Job details
 */
async function getJobDetails(jobId) {
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
        throw new Error('RAPIDAPI_KEY not configured in .env');
    }

    const url = `https://${JSEARCH_API_HOST}/job-details?job_id=${encodeURIComponent(jobId)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': JSEARCH_API_HOST
            }
        });

        if (!response.ok) {
            throw new Error(`JSearch API error: ${response.status}`);
        }

        const data = await response.json();
        const job = data.data?.[0];

        if (!job) {
            return { success: false, error: 'Job not found' };
        }

        return {
            success: true,
            job: {
                id: job.job_id,
                title: job.job_title,
                company: job.employer_name,
                companyLogo: job.employer_logo,
                companyWebsite: job.employer_website,
                location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
                isRemote: job.job_is_remote,
                employmentType: job.job_employment_type,
                description: job.job_description,
                qualifications: job.job_highlights?.Qualifications || [],
                responsibilities: job.job_highlights?.Responsibilities || [],
                benefits: job.job_highlights?.Benefits || [],
                applyLink: job.job_apply_link,
                postedAt: job.job_posted_at_datetime_utc,
                salary: {
                    min: job.job_min_salary,
                    max: job.job_max_salary,
                    currency: job.job_salary_currency,
                    period: job.job_salary_period
                },
                source: job.job_publisher
            }
        };
    } catch (error) {
        console.error('JSearch API Error:', error.message);
        throw error;
    }
}

/**
 * Search jobs that match a CV profile
 * @param {Object} cvData - CV data with skills, jobTitle, etc.
 * @param {string} location - Preferred location
 * @returns {Promise<Object>} - Matching jobs
 */
async function findJobsForCV(cvData, location = 'Netherlands') {
    // Build search query from CV data
    const queryParts = [];

    if (cvData.jobTitle) {
        queryParts.push(cvData.jobTitle);
    }

    if (cvData.skills) {
        // Extract first few skills
        const skills = cvData.skills.split(',').slice(0, 3).map(s => s.trim());
        queryParts.push(...skills);
    }

    const query = queryParts.slice(0, 3).join(' ') || 'developer';

    return searchJobs({
        query,
        location: cvData.location || location,
        datePosted: 'week',  // Recent jobs
        numPages: 1
    });
}

module.exports = {
    searchJobs,
    getJobDetails,
    findJobsForCV
};
