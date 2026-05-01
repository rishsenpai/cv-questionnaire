const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

export interface AdzunaJob {
    id: string;
    title: string;
    company: string;
    companyLogo: null;
    location: string;
    description: string;
    applyLink: string;
    employmentType: string;
    isRemote: false;
    salary: { min?: number; max?: number; currency: 'EUR'; period: 'year' };
    postedAt: string;
    source: 'adzuna';
    category: string;
}

export interface AdzunaSearchOptions {
    query?: string;
    location?: string;
    page?: number;
    resultsPerPage?: number;
    sortBy?: 'date' | 'salary' | 'relevance';
    maxDaysOld?: number;
    country?: string;
}

export interface AdzunaSearchResult {
    success: true;
    totalJobs: number;
    page: number;
    jobs: AdzunaJob[];
}

export async function searchAdzunaJobs(options: AdzunaSearchOptions = {}): Promise<AdzunaSearchResult> {
    const {
        query = 'developer',
        location = '',
        page = 1,
        resultsPerPage = 20,
        sortBy = 'date',
        maxDaysOld = 30,
        country = 'nl',
    } = options;

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) throw new Error('ADZUNA_APP_ID or ADZUNA_APP_KEY not configured in .env');

    const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: resultsPerPage.toString(),
        what: query,
        sort_by: sortBy,
        max_days_old: maxDaysOld.toString(),
    });
    if (location) params.append('where', location);

    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Adzuna API Error:', response.status, errorText);
        throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        success: true,
        totalJobs: data.count || 0,
        page,
        jobs: (data.results || []).map((job: Record<string, unknown>): AdzunaJob => {
            const company = job.company as { display_name?: string } | undefined;
            const loc = job.location as { display_name?: string } | undefined;
            const cat = job.category as { label?: string } | undefined;
            return {
                id: String(job.id),
                title: job.title as string,
                company: company?.display_name || 'Onbekend bedrijf',
                companyLogo: null,
                location: loc?.display_name || '',
                description: (job.description as string) || '',
                applyLink: job.redirect_url as string,
                employmentType: (job.contract_type as string) || (job.contract_time as string) || '',
                isRemote: false,
                salary: {
                    min: job.salary_min as number,
                    max: job.salary_max as number,
                    currency: 'EUR',
                    period: 'year',
                },
                postedAt: job.created as string,
                source: 'adzuna',
                category: cat?.label || '',
            };
        }),
    };
}

export async function getAdzunaCategories(): Promise<unknown[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const url = `${ADZUNA_BASE_URL}/nl/categories?app_id=${appId}&app_key=${appKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
    }
}

export interface CVForAdzunaMatch {
    jobTitle?: string;
    skills?: string;
    location?: string;
}

export async function findAdzunaJobsForCV(cvData: CVForAdzunaMatch): Promise<AdzunaSearchResult> {
    const queryParts: string[] = [];
    if (cvData.jobTitle) queryParts.push(cvData.jobTitle);
    if (cvData.skills) {
        const skills = cvData.skills.split(',').slice(0, 2).map(s => s.trim());
        queryParts.push(...skills);
    }
    const query = queryParts.slice(0, 3).join(' ') || 'developer';
    return searchAdzunaJobs({
        query,
        location: cvData.location || '',
        maxDaysOld: 14,
        resultsPerPage: 20,
    });
}
