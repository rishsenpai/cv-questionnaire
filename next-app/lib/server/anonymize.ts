export interface AnonymizedCV {
    id: string;
    jobTitle: string;
    location: string;
    summary: string;
    topSkills: string[];
    yearsExperience?: number;
    educationLevel?: string;
}

export function topSkillsFrom(skills: string | undefined, max = 8): string[] {
    if (!skills) return [];
    return skills
        .split(/[,\n;]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, max);
}

export function yearsExperienceFromText(experience: string | undefined): number | undefined {
    if (!experience) return undefined;
    const text = experience.toLowerCase();

    const explicit = text.match(/(\d+)\s*\+?\s*(?:jaar|jr|years?)/);
    if (explicit) {
        const n = parseInt(explicit[1], 10);
        if (n > 0 && n < 60) return n;
    }

    const yearMatches = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g)).map(m => parseInt(m[0], 10));
    if (yearMatches.length >= 2) {
        const min = Math.min(...yearMatches);
        const max = Math.max(...yearMatches);
        const years = max - min;
        if (years > 0 && years < 60) return years;
    }

    return undefined;
}

export function educationLevelFromText(education: string | undefined): string | undefined {
    if (!education) return undefined;
    const t = education.toLowerCase();
    if (/\b(phd|doctor|doctoraat|ph\.d)\b/.test(t)) return 'PhD';
    if (/\b(master|msc|m\.sc|ma\b|mba|wo)\b/.test(t)) return 'Master / WO';
    if (/\b(bachelor|bsc|b\.sc|ba\b|hbo)\b/.test(t)) return 'Bachelor / HBO';
    if (/\b(mbo|associate|associate degree)\b/.test(t)) return 'MBO';
    if (/\b(havo|vwo|gymnasium)\b/.test(t)) return 'HAVO/VWO';
    if (/\b(diploma|certificate|certificat|cursus)\b/.test(t)) return 'Vakopleiding';
    return undefined;
}

export function anonymizeCv(cv: {
    _id: unknown;
    jobTitle?: string;
    location?: string;
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
}): AnonymizedCV {
    return {
        id: String(cv._id),
        jobTitle: cv.jobTitle || 'Onbekende functie',
        location: cv.location || 'Locatie onbekend',
        summary: (cv.summary || '').slice(0, 240),
        topSkills: topSkillsFrom(cv.skills),
        yearsExperience: yearsExperienceFromText(cv.experience),
        educationLevel: educationLevelFromText(cv.education),
    };
}
