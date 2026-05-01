export type DemoJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  verified: boolean;
  match: number;
  sector: string;
  description?: string;
  requirements?: string[];
  postedAt?: string;
};

const defaultDescription = (title: string, company: string) =>
  `${company} zoekt een sterke ${title} die inhoudelijk meewerkt, verantwoordelijkheid neemt en samen met het team duurzame groei realiseert in Suriname.`;

const defaultRequirements = (sector: string) => [
  `Aantoonbare ervaring binnen ${sector}.`,
  'Sterke communicatie en samenwerking met verschillende teams.',
  'Zelfstandig kunnen werken en verantwoordelijkheid nemen voor resultaten.',
];

const withDefaults = (job: DemoJob): DemoJob => ({
  ...job,
  description: job.description || defaultDescription(job.title, job.company),
  requirements: job.requirements || defaultRequirements(job.sector),
  postedAt: job.postedAt || '2 dagen geleden',
});

export const DEMO_JOBS: DemoJob[] = [
  withDefaults({ id: 1, title: 'Senior Software Engineer', company: 'Telesur', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 35.000+', verified: true, match: 98, sector: 'Technologie & IT', description: 'We zijn op zoek naar een ervaren Software Engineer om ons team te versterken bij het bouwen van de volgende generatie communicatieplatformen voor Suriname.', requirements: ['8+ jaar ervaring in software ontwikkeling', 'Expertise in React, Node.js en Cloud infrastructuren', 'Passie voor schaalbaarheid en security'] }),
  withDefaults({ id: 2, title: 'Marketing Coordinator', company: 'Finabank', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 12.000+', verified: true, match: 85, sector: 'Financiën & Verzekeringen' }),
  withDefaults({ id: 3, title: 'Project Manager Mining', company: 'IAMGOLD', location: 'Brokopondo', type: 'Projectbasis', salary: 'USD 3.500+', verified: true, match: 92, sector: 'Mijnbouw & Natuurlijke Hulpbronnen' }),
  withDefaults({ id: 4, title: 'Sales Consultant', company: 'Kuldipsingh', location: 'Wanica', type: 'Full-time', salary: 'Market-conform', verified: false, match: 80, sector: 'Bouw & Infrastructuur' }),
  withDefaults({ id: 5, title: 'Operationeel Manager', company: 'Staatsolie', location: 'Saramacca', type: 'Full-time', salary: 'Bespreekbaar', verified: true, match: 89, sector: 'Energie & Water' }),
  withDefaults({ id: 6, title: 'Gezondheidszorg Assistent', company: 'AZP', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 8.500+', verified: true, match: 80, sector: 'Gezondheidszorg & Welzijn' }),
  withDefaults({ id: 7, title: 'Logistiek Planner', company: 'DP World', location: 'Commewijne', type: 'Full-time', salary: 'SRD 15.000+', verified: true, match: 88, sector: 'Transport & Logistiek' }),
  withDefaults({ id: 8, title: 'Data Analyst', company: 'Digicel', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 20.000+', verified: true, match: 95, sector: 'Technologie & IT' }),
  withDefaults({ id: 9, title: 'Human Resources Manager', company: 'Fernandes', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 25.000+', verified: true, match: 82, sector: 'HR & Recruitment' }),
  withDefaults({ id: 10, title: 'Accountant', company: 'Assuria', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 18.000+', verified: true, match: 87, sector: 'Financiën & Verzekeringen' }),
  withDefaults({ id: 11, title: 'Civiele Ingenieur', company: 'Baitali', location: 'Wanica', type: 'Full-time', salary: 'SRD 22.000+', verified: true, match: 90, sector: 'Bouw & Infrastructuur' }),
  withDefaults({ id: 12, title: 'Logistiek Medewerker', company: 'VSH United', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 10.000+', verified: true, match: 75, sector: 'Transport & Logistiek' }),
  withDefaults({ id: 13, title: 'Software Developer', company: 'SuriTech', location: 'Remote', type: 'Contract', salary: 'USD 2.000+', verified: true, match: 94, sector: 'Technologie & IT' }),
  withDefaults({ id: 14, title: 'Customer Support', company: 'Teleperformance', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 7.500+', verified: true, match: 83, sector: 'Klantenservice' }),
  withDefaults({ id: 15, title: 'Onderwijzer', company: 'MINOWC', location: 'Heel Suriname', type: 'Full-time', salary: 'SRD 6.000+', verified: false, match: 70, sector: 'Onderwijs' }),
];
