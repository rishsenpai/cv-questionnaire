import { DEMO_JOBS } from '@/lib/jobs';

export const SURINAME_MINIMUM_HOURLY_WAGE_SRD = 52.47;
export const SURINAME_MINIMUM_WAGE_EFFECTIVE_DATE = '2025-04-01';
export const SURINAME_CPI_REFERENCE = 'ABS Suriname CPI 2026';
export const WEEKS_PER_MONTH = 4.33;

export type SalaryExperienceLevel = 'starter' | 'junior' | 'mid' | 'senior' | 'lead';
export type SalaryContractType = 'fulltime' | 'parttime' | 'contract' | 'project';

export const SALARY_EXPERIENCE_LABELS: Record<SalaryExperienceLevel, string> = {
  starter: 'Starter',
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead',
};

export const SALARY_CONTRACT_LABELS: Record<SalaryContractType, string> = {
  fulltime: 'Full-time',
  parttime: 'Part-time',
  contract: 'Contract',
  project: 'Projectbasis',
};

const EXPERIENCE_MULTIPLIERS: Record<SalaryExperienceLevel, number> = {
  starter: 0.82,
  junior: 0.94,
  mid: 1,
  senior: 1.22,
  lead: 1.38,
};

const LOCATION_MULTIPLIERS: Record<string, number> = {
  Paramaribo: 1.08,
  Wanica: 1.02,
  'Heel Suriname': 1,
  Brokopondo: 1.12,
  Commewijne: 0.98,
  Saramacca: 0.97,
  Nickerie: 0.96,
  Remote: 1.06,
};

const CONTRACT_MULTIPLIERS: Record<SalaryContractType, number> = {
  fulltime: 1,
  parttime: 0.55,
  contract: 1.16,
  project: 1.12,
};

const SECTOR_BASELINES: Record<string, number> = {
  'Technologie & IT': 18000,
  'Financiën & Verzekeringen': 15000,
  'Mijnbouw & Natuurlijke Hulpbronnen': 23000,
  'Bouw & Infrastructuur': 14500,
  'Energie & Water': 21000,
  'Gezondheidszorg & Welzijn': 9500,
  'Transport & Logistiek': 12000,
  'HR & Recruitment': 14500,
  Klantenservice: 7600,
  Onderwijs: 7000,
};

export const SALARY_SECTOR_OPTIONS = Object.keys(SECTOR_BASELINES);
export const SALARY_LOCATION_OPTIONS = Object.keys(LOCATION_MULTIPLIERS);

export type SalaryEstimateInput = {
  sector: string;
  location: string;
  experience: SalaryExperienceLevel;
  contractType: SalaryContractType;
  weeklyHours: number;
  currentMonthlySalary?: number | null;
};

export type SalaryEstimateResult = {
  minimumMonthlyFloor: number;
  expectedMonthlyMin: number;
  expectedMonthlyMax: number;
  midpoint: number;
  confidence: 'Laag' | 'Middel' | 'Hoog';
  signal: 'Onder markt' | 'Marktconform' | 'Boven markt' | 'Nog geen vergelijking';
  marketDelta?: number;
  negotiationTip: string;
  employerTip: string;
};

export function parseSalaryToSRD(value: string) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const numberMatch = normalized.match(/([\d.]+)/);
  if (!numberMatch) return null;

  const amount = Number(numberMatch[1].replace(/\./g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (normalized.toUpperCase().includes('USD')) {
    return amount * 38;
  }

  return amount;
}

export function formatSrd(amount: number) {
  return `SRD ${Math.round(amount).toLocaleString('nl-NL')}`;
}

export function getSalaryMarketSample() {
  const srDJobs = DEMO_JOBS.map((job) => ({
    ...job,
    parsedSalary: parseSalaryToSRD(job.salary),
  })).filter((job) => Number.isFinite(job.parsedSalary));

  return srDJobs.slice(0, 8);
}

export function estimateSalaryRange(input: SalaryEstimateInput): SalaryEstimateResult {
  const baseSector = SECTOR_BASELINES[input.sector] || 12000;
  const locationMultiplier = LOCATION_MULTIPLIERS[input.location] || 1;
  const experienceMultiplier = EXPERIENCE_MULTIPLIERS[input.experience];
  const contractMultiplier = CONTRACT_MULTIPLIERS[input.contractType];
  const hoursMultiplier = Math.max(input.weeklyHours, 8) / 40;

  const baseline = baseSector * locationMultiplier * experienceMultiplier * contractMultiplier * hoursMultiplier;
  const spread = baseline * (input.experience === 'starter' ? 0.18 : 0.22);
  const minFloor = SURINAME_MINIMUM_HOURLY_WAGE_SRD * input.weeklyHours * WEEKS_PER_MONTH;
  const expectedMonthlyMin = Math.max(minFloor, baseline - spread);
  const expectedMonthlyMax = Math.max(expectedMonthlyMin + 500, baseline + spread);
  const midpoint = (expectedMonthlyMin + expectedMonthlyMax) / 2;
  const currentSalary = input.currentMonthlySalary && input.currentMonthlySalary > 0 ? input.currentMonthlySalary : null;

  let signal: SalaryEstimateResult['signal'] = 'Nog geen vergelijking';
  let marketDelta: number | undefined;

  if (currentSalary) {
    marketDelta = currentSalary - midpoint;
    if (currentSalary < expectedMonthlyMin * 0.97) signal = 'Onder markt';
    else if (currentSalary > expectedMonthlyMax * 1.03) signal = 'Boven markt';
    else signal = 'Marktconform';
  }

  const confidence: SalaryEstimateResult['confidence'] =
    input.location === 'Paramaribo' || input.location === 'Wanica'
      ? input.sector in SECTOR_BASELINES
        ? 'Hoog'
        : 'Middel'
      : 'Middel';

  const negotiationTip =
    signal === 'Onder markt'
      ? `Je zit waarschijnlijk onder de markt. Een verdedigbare vraagrange is ${formatSrd(expectedMonthlyMin)} tot ${formatSrd(expectedMonthlyMax)} bruto per maand.`
      : signal === 'Boven markt'
        ? `Je huidige pakket zit sterk. Benadruk impact, schaarse skills en secundaire voorwaarden als je verder onderhandelt.`
        : `Je zit ongeveer marktconform. Je meeste onderhandelingsruimte zit waarschijnlijk in groeipad, bonus, flexibiliteit en opleidingsbudget.`;

  const employerTip =
    expectedMonthlyMin <= minFloor * 1.05
      ? `Deze rol zit dicht bij de wettelijke bodem. Transparantie over uren, groei en extra voordelen is hier extra belangrijk.`
      : `Voor een competitieve vacature in ${input.location} is een zichtbare salary band rond ${formatSrd(expectedMonthlyMin)} - ${formatSrd(expectedMonthlyMax)} sterk.`;

  return {
    minimumMonthlyFloor: minFloor,
    expectedMonthlyMin,
    expectedMonthlyMax,
    midpoint,
    confidence,
    signal,
    marketDelta,
    negotiationTip,
    employerTip,
  };
}
