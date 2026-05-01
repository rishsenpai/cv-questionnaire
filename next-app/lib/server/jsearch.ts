const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

export interface JSearchSalary {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
    period?: string | null;
}

export interface JSearchJob {
    id: string;
    title: string;
    company: string;
    companyLogo?: string | null;
    location: string;
    isRemote?: boolean;
    employmentType?: string;
    description?: string;
    highlights?: unknown;
    applyLink?: string;
    postedAt?: string;
    salary: JSearchSalary;
    source?: string;
}

export interface SearchOptions {
    query?: string;
    location?: string;
    page?: number;
    numPages?: number;
    datePosted?: 'all' | 'today' | '3days' | 'week' | 'month';
    remoteOnly?: 'true' | 'false';
    employmentType?: string;
}

export interface SearchResult {
    success: true;
    totalJobs: number;
    jobs: JSearchJob[];
}

export async function searchJobs(options: SearchOptions = {}): Promise<SearchResult> {
    const {
        query = 'developer',
        location = 'Netherlands',
        page = 1,
        numPages = 1,
        datePosted = 'all',
        remoteOnly = 'false',
        employmentType = '',
    } = options;

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) throw new Error('RAPIDAPI_KEY not configured in .env');

    const params = new URLSearchParams({
        query: `${query} in ${location}`,
        page: page.toString(),
        num_pages: numPages.toString(),
        date_posted: datePosted,
    });
    if (remoteOnly === 'true') params.append('remote_jobs_only', 'true');
    if (employmentType) params.append('employment_types', employmentType);

    const url = `https://${JSEARCH_API_HOST}/search?${params.toString()}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': JSEARCH_API_HOST,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('JSearch API Error:', response.status, errorText);
        throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        success: true,
        totalJobs: data.data?.length || 0,
        jobs: (data.data || []).map((job: Record<string, unknown>): JSearchJob => ({
            id: job.job_id as string,
            title: job.job_title as string,
            company: job.employer_name as string,
            companyLogo: (job.employer_logo as string) || null,
            location: job.job_city ? `${job.job_city}, ${job.job_country}` : (job.job_country as string),
            isRemote: job.job_is_remote as boolean,
            employmentType: job.job_employment_type as string,
            description: job.job_description as string,
            highlights: job.job_highlights,
            applyLink: job.job_apply_link as string,
            postedAt: job.job_posted_at_datetime_utc as string,
            salary: {
                min: job.job_min_salary as number,
                max: job.job_max_salary as number,
                currency: job.job_salary_currency as string,
                period: job.job_salary_period as string,
            },
            source: job.job_publisher as string,
        })),
    };
}

export interface JobDetailsResult {
    success: boolean;
    job?: JSearchJob & {
        companyWebsite?: string;
        qualifications?: string[];
        responsibilities?: string[];
        benefits?: string[];
    };
    error?: string;
}

export async function getJobDetails(jobId: string): Promise<JobDetailsResult> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) throw new Error('RAPIDAPI_KEY not configured in .env');

    const url = `https://${JSEARCH_API_HOST}/job-details?job_id=${encodeURIComponent(jobId)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': JSEARCH_API_HOST,
        },
    });

    if (!response.ok) throw new Error(`JSearch API error: ${response.status}`);

    const data = await response.json();
    const job = data.data?.[0];
    if (!job) return { success: false, error: 'Job not found' };

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
                period: job.job_salary_period,
            },
            source: job.job_publisher,
        },
    };
}

export interface CVForJobMatch {
    jobTitle?: string;
    skills?: string;
    location?: string;
}

export async function findJobsForCV(cvData: CVForJobMatch, location = 'Netherlands'): Promise<SearchResult> {
    const queryParts: string[] = [];
    if (cvData.jobTitle) queryParts.push(cvData.jobTitle);
    if (cvData.skills) {
        const skills = cvData.skills.split(',').slice(0, 3).map(s => s.trim());
        queryParts.push(...skills);
    }
    const query = queryParts.slice(0, 3).join(' ') || 'developer';
    return searchJobs({
        query,
        location: cvData.location || location,
        datePosted: 'week',
        numPages: 1,
    });
}
