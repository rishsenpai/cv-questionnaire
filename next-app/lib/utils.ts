import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ruwe employmentType-waarden komen uit verschillende bronnen (JSearch levert bv. "FULL_TIME",
// handmatige invoer "Full-time" of "Contract"). Zonder normalisatie verschijnen dubbele
// filteropties zoals "FULL-TIME" én "FULL_TIME". Deze helper mapt alles naar één net label.
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  fulltime: 'Full-time',
  parttime: 'Part-time',
  contract: 'Contract',
  contractor: 'Contract',
  temporary: 'Tijdelijk',
  intern: 'Stage',
  internship: 'Stage',
  freelance: 'Freelance',
  volunteer: 'Vrijwilliger',
  permanent: 'Vast',
};

export function normalizeEmploymentType(raw?: string | null): string {
  if (!raw || !raw.trim()) return 'Full-time';
  // Verwijder spaties, koppeltekens en underscores → "FULL_TIME"/"Full-time"/"full time" worden allemaal "fulltime".
  const key = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (EMPLOYMENT_TYPE_LABELS[key]) return EMPLOYMENT_TYPE_LABELS[key];
  // Onbekend type: nette Title-Case van de originele waarde.
  return raw.trim().replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
