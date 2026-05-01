type CandidateProfile = {
  name?: string;
  title?: string;
  bio?: string;
  skills?: string | string[];
  sector?: string;
  location?: string;
  experience?: string;
  phone?: string;
};

type JobLike = {
  id: number | string;
  title: string;
  company: string;
  sector?: string;
  location?: string;
  match?: number;
  requirements?: string[];
};

export type CvInsights = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  recommendations: string[];
  extracted: {
    name: string;
    title: string;
    bio: string;
    skills: string;
    phone: string;
    location: string;
  };
  markdown: string;
};

export type MatchInsight = {
  jobId: number | string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
};

export type RecruiterAssist = {
  summary: string;
  strengths: string[];
  concerns: string[];
  nextStep: string;
  outreach: string;
};

export type JobDescriptionDraft = {
  markdown: string;
  summary: string;
  mustHaves: string[];
  sellingPoints: string[];
  interviewFocus: string[];
  screeningQuestions: string[];
};

export type InterviewQuestionCategory = {
  title: string;
  questions: string[];
};

export type InterviewQuestionSet = {
  markdown: string;
  categories: InterviewQuestionCategory[];
  scorecard: string[];
  redFlags: string[];
};

export type ShortlistRecommendation = {
  candidateId: string | number;
  name: string;
  role: string;
  score: number;
  summary: string;
  nextStep: string;
  outreach: string;
};

function normalizeSkills(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectSkills(text: string) {
  const dictionary = [
    'react',
    'react native',
    'node',
    'javascript',
    'typescript',
    'excel',
    'sales',
    'marketing',
    'project management',
    'leadership',
    'finance',
    'cloud',
    'support',
    'design',
    'ux',
    'hr',
    'operations',
  ];

  const lower = text.toLowerCase();
  return dictionary.filter((item) => lower.includes(item));
}

function inferRoleTraits(role: string) {
  const lower = String(role || '').toLowerCase();

  if (/(developer|engineer|frontend|backend|fullstack|it|tech)/.test(lower)) {
    return {
      mustHaves: ['Ervaring met moderne ontwikkeltools', 'Sterke probleemoplossing', 'Samenwerken met product en design'],
      sellingPoints: ['Directe impact op digitale producten', 'Werken aan schaalbare oplossingen', 'Ruimte voor ownership en kwaliteit'],
      interviewFocus: ['Technische diepgang', 'Samenwerking in teams', 'Impact van recente projecten'],
      scorecard: ['Technische fit', 'Codekwaliteit / ownership', 'Communicatie', 'Leervermogen'],
    };
  }

  if (/(sales|account|business|commerc)/.test(lower)) {
    return {
      mustHaves: ['Commerciële slagkracht', 'Sterke opvolging en discipline', 'Relatiebeheer en overtuigingskracht'],
      sellingPoints: ['Duidelijke targets en groeipad', 'Veel klantcontact en zichtbare impact', 'Sterke incentive-structuur'],
      interviewFocus: ['Pipeline ownership', 'Onderhandeling en closing', 'Omgaan met tegenslagen'],
      scorecard: ['Commerciële fit', 'Communicatie', 'Zelfstandigheid', 'Resultaatgerichtheid'],
    };
  }

  if (/(hr|recruit|talent|people)/.test(lower)) {
    return {
      mustHaves: ['Sterke communicatie', 'Discretie en structuur', 'Kandidaat- en stakeholdermanagement'],
      sellingPoints: ['Zichtbare impact op teamgroei', 'Veel schakelen met business en kandidaten', 'Ruimte voor procesverbetering'],
      interviewFocus: ['Stakeholdermanagement', 'Procesdiscipline', 'Candidate experience'],
      scorecard: ['Stakeholder fit', 'Organisatie', 'Communicatie', 'Professionaliteit'],
    };
  }

  return {
    mustHaves: ['Eigenaarschap en betrouwbaarheid', 'Sterke communicatie', 'Relevante ervaring in vergelijkbare context'],
    sellingPoints: ['Duidelijke verantwoordelijkheid', 'Groei- en ontwikkelruimte', 'Werken in een ambitieus team'],
    interviewFocus: ['Resultaten uit vorige rollen', 'Samenwerking', 'Motivatie voor deze stap'],
    scorecard: ['Rolfit', 'Communicatie', 'Werkhouding', 'Groeipotentieel'],
  };
}

export function analyzeCandidateProfile(cvText: string, sector: string, profile?: CandidateProfile): CvInsights {
  const text = cvText.trim();
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(\+?\d[\d\s-]{7,})/);
  const detectedSkills = detectSkills(text);
  const existingSkills = normalizeSkills(profile?.skills);
  const mergedSkills = Array.from(new Set([...existingSkills, ...detectedSkills]));
  const sectorLower = String(sector || '').toLowerCase();

  const strengths = [
    lines.length > 8 ? 'Je CV bevat voldoende inhoud voor een eerste screening.' : 'Je CV is compact en snel scanbaar.',
    emailMatch ? 'Je contactgegevens bevatten een herkenbaar e-mailadres.' : 'Een duidelijk e-mailadres ontbreekt nog in je CV.',
    mergedSkills.length >= 4 ? `Je benoemt meerdere relevante skills voor ${sector || 'je markt'}.` : 'Je skill-profiel kan nog veel concreter.',
  ];

  const weaknesses = [
    !phoneMatch ? 'Een telefoonnummer ontbreekt of is lastig te herkennen.' : 'Voeg context toe bij je telefoonnummer, zoals regio of beschikbaarheid.',
    words.length < 80 ? 'Je CV is waarschijnlijk te kort en mist diepgang.' : 'Je kunt de structuur nog scherper maken met duidelijke kopjes en resultaten.',
    !/result|impact|verhoogd|verbeterd|groei|bespaard/i.test(text) ? 'Meetbare resultaten ontbreken nog grotendeels.' : 'Je kunt je resultaten nog sterker kwantificeren per rol.',
  ];

  const skillGaps = Array.from(
    new Set([
      !mergedSkills.some((item) => item.includes('project')) ? 'Project Management' : '',
      !mergedSkills.some((item) => item.includes('excel')) && sectorLower.includes('finance') ? 'Excel / Reporting' : '',
      !mergedSkills.some((item) => item.includes('react')) && sectorLower.includes('tech') ? 'React / Frontend' : '',
      !mergedSkills.some((item) => item.includes('leadership')) ? 'Leiderschap / stakeholder management' : '',
    ].filter(Boolean))
  );

  const score = Math.max(
    55,
    Math.min(
      94,
      58 +
        (emailMatch ? 8 : 0) +
        (phoneMatch ? 8 : 0) +
        Math.min(10, mergedSkills.length * 2) +
        Math.min(10, Math.floor(words.length / 25))
    )
  );

  const extracted = {
    name: lines[0] || profile?.name || '',
    title: lines.find((line) => /developer|engineer|manager|designer|analyst|consultant|coordinator|specialist|sales|marketing/i.test(line)) || profile?.title || '',
    bio: lines.slice(1, 3).join(' ').slice(0, 180) || profile?.bio || '',
    skills: mergedSkills.join(', '),
    phone: phoneMatch?.[0]?.trim() || profile?.phone || '',
    location: lines.find((line) => /paramaribo|wanica|nickerie|commewijne|suriname|remote/i.test(line)) || profile?.location || '',
  };

  const recommendations = [
    'Werk je profiel bij met dezelfde functietitel, skills en locatie als in je CV.',
    skillGaps[0] ? `Plan deze maand een leeractie rond ${skillGaps[0]}.` : 'Voeg concrete resultaten toe aan elke recente rol.',
    'Gebruik 3 tot 5 meetbare prestaties in je profielsamenvatting.',
  ];

  const markdown = `## CV Analyse\n\n### Sterke punten\n- ${strengths.join('\n- ')}\n\n### Verbeterpunten\n- ${weaknesses.join('\n- ')}\n\n### Matching Score\n**${score}/100** voor ${sector || 'de gekozen sector'}.\n\n### Aanbevolen focus\n- ${recommendations.join('\n- ')}`;

  return {
    score,
    strengths,
    weaknesses,
    skillGaps,
    recommendations,
    extracted,
    markdown,
  };
}

export function buildMatchInsights(profile: CandidateProfile, insights: CvInsights | null, jobs: JobLike[]) {
  const profileSkills = normalizeSkills(insights?.extracted.skills || profile.skills);
  const sector = String(profile.sector || '').toLowerCase();

  return jobs.map((job) => {
    const titleText = `${job.title} ${job.company} ${(job.requirements || []).join(' ')}`.toLowerCase();
    const skillHits = profileSkills.filter((skill) => titleText.includes(skill.toLowerCase()));
    const sectorMatch = sector && String(job.sector || '').toLowerCase().includes(sector) ? 10 : 0;
    const base = typeof job.match === 'number' ? job.match : 65;
    const score = Math.max(55, Math.min(98, base + sectorMatch + skillHits.length * 4 - (insights?.skillGaps.length || 0) * 2));
    const strengths = [
      sectorMatch > 0 ? `Je sector sluit goed aan op ${job.company}.` : `De rol bij ${job.company} blijft relevant ondanks beperkte sectormatch.`,
      skillHits.length > 0 ? `Je profiel laat overlap zien met ${skillHits.slice(0, 2).join(' en ')}.` : 'Je algemene profiel biedt nog steeds een basis voor deze rol.',
    ];
    const gaps = insights?.skillGaps.slice(0, 2) || [];

    return {
      jobId: job.id,
      score,
      summary: score >= 85 ? 'Sterke match voor directe actie.' : score >= 72 ? 'Interessante match met wat voorbereiding.' : 'Kansrijk als je eerst je profiel aanscherpt.',
      strengths,
      gaps,
    } satisfies MatchInsight;
  });
}

export function buildRecruiterAssist(candidate: {
  name: string;
  role: string;
  score?: number;
  status?: string;
  email?: string;
}, companyName: string) {
  const score = candidate.score || 75;
  const summary = `${candidate.name} komt over als een ${score >= 85 ? 'sterke' : 'redelijke'} match voor ${candidate.role} bij ${companyName}.`;
  const strengths = [
    `AI score van ${score}% wijst op inhoudelijke relevantie voor de rol.`,
    'Het profiel is direct contacteerbaar en geschikt voor snelle opvolging.',
    score >= 90 ? 'Kandidaat lijkt direct inzetbaar voor een volgende ronde.' : 'Met gerichte screening is deze kandidaat goed te beoordelen.',
  ];
  const concerns = [
    candidate.status === 'Gearchiveerd' ? 'Kandidaat stond eerder op gearchiveerd; check context.' : 'Controleer beschikbaarheid en motivatie in de eerste outreach.',
    'Vraag door op concrete resultaten en teamfit.',
  ];
  const nextStep = score >= 88 ? 'Plan een eerste gesprek binnen 48 uur.' : 'Start met een korte intake of screening call.';
  const outreach = `Hallo ${candidate.name},\n\nWe hebben je profiel bekeken voor ${candidate.role} bij ${companyName}. Je achtergrond sluit goed aan op wat we zoeken. Heb je deze week ruimte voor een korte kennismaking?\n\nGroet,\n${companyName}`;

  return {
    summary,
    strengths,
    concerns,
    nextStep,
    outreach,
  } satisfies RecruiterAssist;
}

export function buildJobDescriptionDraft(
  role: string,
  companyName: string,
  companyContext: string,
  contactInfo: string
) {
  const traits = inferRoleTraits(role);
  const summary = `${role} bij ${companyName} met focus op eigenaarschap, samenwerking en duidelijke impact.`;
  const screeningQuestions = [
    `Welke recente resultaten maken jou geschikt voor ${role}?`,
    `Welke onderdelen van deze rol spreken je het meest aan en waarom?`,
    `Hoe pak jij prioriteiten en deadlines aan in een drukke omgeving?`,
  ];

  const markdown = `### Introductie
${companyName} zoekt een sterke **${role}** die past bij ${companyContext}.

### Key Taken
- Dagelijkse verantwoordelijkheid nemen voor resultaat en kwaliteit.
- Samenwerken met collega's, klanten en stakeholders.
- Processen verbeteren en kansen signaleren.

### Profiel
- ${traits.mustHaves.join('\n- ')}

### Aanbod
- ${traits.sellingPoints.join('\n- ')}

Interesse? Verstuur direct je sollicitatie via SuriJobs+ of mail naar ${contactInfo}.`;

  return {
    markdown,
    summary,
    mustHaves: traits.mustHaves,
    sellingPoints: traits.sellingPoints,
    interviewFocus: traits.interviewFocus,
    screeningQuestions,
  } satisfies JobDescriptionDraft;
}

export function buildInterviewQuestionSet(role: string, companyName: string) {
  const traits = inferRoleTraits(role);
  const categories = [
    {
      title: 'Rolfit',
      questions: [
        `Welke resultaten heb je recent behaald die relevant zijn voor ${companyName}?`,
        `Waarom past ${role} logisch bij jouw volgende stap?`,
      ],
    },
    {
      title: 'Aanpak',
      questions: [
        'Hoe pak je prioriteiten aan wanneer meerdere taken tegelijk urgent zijn?',
        'Hoe zorg je dat kwaliteit niet daalt onder tijdsdruk?',
      ],
    },
    {
      title: 'Samenwerking',
      questions: [
        'Hoe werk je samen met verschillende persoonlijkheden of stakeholders?',
        'Hoe ga je om met feedback of conflict in een team?',
      ],
    },
    {
      title: 'Groei',
      questions: [
        'Welke fout heb je recent gemaakt en wat heb je daarvan geleerd?',
        'Hoe blijf je groeien in je vakgebied?',
      ],
    },
  ] satisfies InterviewQuestionCategory[];

  const redFlags = [
    'Blijft vaag over impact of behaalde resultaten.',
    'Schuift problemen structureel op anderen af.',
    'Kan geen concreet leerproces of verbetering benoemen.',
    'Motivatie draait alleen om salaris of titel.',
  ];

  const scorecard = [...traits.scorecard, 'Motivatie voor bedrijf en rol'];
  const markdown = `## Interviewvragen voor ${role}

### ${categories[0].title}
1. ${categories[0].questions[0]}
2. ${categories[0].questions[1]}

### ${categories[1].title}
3. ${categories[1].questions[0]}
4. ${categories[1].questions[1]}

### ${categories[2].title}
5. ${categories[2].questions[0]}
6. ${categories[2].questions[1]}

### ${categories[3].title}
7. ${categories[3].questions[0]}
8. ${categories[3].questions[1]}

### Scorecard
- ${scorecard.join('\n- ')}

### Let op deze red flags
- ${redFlags.join('\n- ')}`;

  return {
    markdown,
    categories,
    scorecard,
    redFlags,
  } satisfies InterviewQuestionSet;
}

export function buildShortlistRecommendations(
  role: string,
  candidates: Array<{ id?: string | number; originalId?: string | number; name: string; role: string; score?: number; status?: string }>,
  companyName: string
) {
  const roleLower = String(role || '').toLowerCase();

  return candidates
    .map((candidate) => {
      const score = candidate.score || 70;
      const roleOverlap =
        roleLower.length > 0 && String(candidate.role || '').toLowerCase().includes(roleLower) ? 10 : 0;
      const adjustedScore = Math.max(60, Math.min(98, score + roleOverlap));
      const nextStep = adjustedScore >= 88 ? 'Plan direct een eerste gesprek.' : 'Start met een intake of korte screening.';
      return {
        candidateId: candidate.originalId || candidate.id || candidate.name,
        name: candidate.name,
        role: candidate.role,
        score: adjustedScore,
        summary:
          adjustedScore >= 88
            ? 'Sterke shortlist-kandidaat voor snelle opvolging.'
            : 'Interessante shortlist met ruimte voor gerichte screening.',
        nextStep,
        outreach: `Hallo ${candidate.name},\n\nWe zien een goede match tussen jouw profiel en onze open rol${role ? ` als ${role}` : ''} bij ${companyName}. Heb je ruimte voor een korte kennismaking deze week?\n\nGroet,\n${companyName}`,
      } satisfies ShortlistRecommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
