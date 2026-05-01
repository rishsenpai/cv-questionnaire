export type CompanyProfile = {
  name: string;
  aliases: string[];
  sector: string;
  sectorDescription: string;
  location: string;
  employees: string;
  verified: boolean;
  description: string;
  logo: string | null;
  openJobs: number;
  topRoles: string[];
};

export const COMPANY_PROFILES: CompanyProfile[] = [
  {
    name: 'Staatsolie Maatschappij Suriname N.V.',
    aliases: ['Staatsolie', 'Staatsolie NV'],
    sector: 'Energie & Olie',
    sectorDescription: 'De ruggengraat van de Surinaamse energievoorziening en economische groei.',
    location: 'Paramaribo',
    employees: '1000+',
    verified: true,
    description: 'De nationale oliemaatschappij van Suriname, verantwoordelijk voor de exploratie en productie van olie.',
    logo: null,
    openJobs: 12,
    topRoles: ['Geoloog', 'Chemical Engineer', 'Project Manager'],
  },
  {
    name: 'Kuldipsingh Group',
    aliases: ['Kuldipsingh'],
    sector: 'Industrie & Handel',
    sectorDescription: 'Toonaangevende leverancier voor bouw en zware industrie in de regio.',
    location: 'Wanica / Paramaribo',
    employees: '500+',
    verified: true,
    description: 'De grootste toeleverancier voor de bouw-, industrie- en mijnbouwsector in Suriname.',
    logo: null,
    openJobs: 8,
    topRoles: ['Logistiek Manager', 'Sales Representative', 'Warehouse Supervisor'],
  },
  {
    name: 'Finabank N.V.',
    aliases: ['Finabank', 'Finabank Suriname'],
    sector: 'Financiële Dienstverlening',
    sectorDescription: 'Innovatieve bancaire oplossingen voor ondernemend Suriname.',
    location: 'Paramaribo',
    employees: '250+',
    verified: true,
    description: 'Een toonaangevende Surinaamse bank gericht op de groei van lokale ondernemingen en consumenten.',
    logo: null,
    openJobs: 5,
    topRoles: ['Financial Analyst', 'Compliance Officer', 'Customer Service Lead'],
  },
  {
    name: 'Telesur',
    aliases: [],
    sector: 'Telecommunicatie',
    sectorDescription: 'Verbindt Suriname met de wereld via geavanceerde digitale infrastructuur.',
    location: 'Heel Suriname',
    employees: '800+',
    verified: true,
    description: 'De nationale aanbieder van telecommunicatiediensten in Suriname.',
    logo: null,
    openJobs: 15,
    topRoles: ['Network Engineer', 'IT Security Specialist', 'App Developer'],
  },
  {
    name: 'IAMGOLD Rosebel Gold Mines',
    aliases: ['IAMGOLD'],
    sector: 'Mijnbouw',
    sectorDescription: 'Expertise in grootschalige winning van natuurlijke hulpbronnen.',
    location: 'Brokopondo',
    employees: '1500+',
    verified: true,
    description: 'Een van de grootste goudproducenten in de regio, met een sterke focus op duurzaamheid.',
    logo: null,
    openJobs: 10,
    topRoles: ['Mining Engineer', 'Safety Officer', 'Environmental Specialist'],
  },
];

function normalizeCompanyName(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

export function findCompanyProfile(name: string) {
  const normalizedTarget = normalizeCompanyName(name);

  return COMPANY_PROFILES.find((company) => {
    const candidates = [company.name, ...company.aliases];
    return candidates.some((candidate) => normalizeCompanyName(candidate) === normalizedTarget);
  }) || null;
}

export function matchesCompanyName(candidateName: string, targetName: string) {
  const profile = findCompanyProfile(targetName);
  if (!profile) {
    return normalizeCompanyName(candidateName) === normalizeCompanyName(targetName);
  }

  return [profile.name, ...profile.aliases].some(
    (knownName) => normalizeCompanyName(knownName) === normalizeCompanyName(candidateName)
  );
}
