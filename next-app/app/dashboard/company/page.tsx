'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Eye, 
  FileCheck, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  Filter,
  Download,
  Terminal,
  MessageCircle,
  MoreVertical,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  Settings,
  Bell,
  Check,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  X,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  UserPlus,
  Send,
  MessageSquare,
  Briefcase,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as ReBarChart,
  Cell,
  AreaChart,
  Area,
  Line,
  ComposedChart
} from 'recharts';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence } from 'motion/react';
import { isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';
import { ChartFrame } from '@/components/ChartFrame';
import {
  buildRecruiterAssist,
  buildJobDescriptionDraft,
  buildInterviewQuestionSet,
  buildShortlistRecommendations,
  type JobDescriptionDraft,
  type InterviewQuestionSet,
} from '@/lib/ai';

const buildSalaryBenchmark = (role: string) => `## Salarisindicatie voor ${role}

| Niveau | Indicatie SRD | Indicatie USD |
| --- | ---: | ---: |
| Junior | 6.000 - 10.000 | 170 - 280 |
| Medior | 10.000 - 18.000 | 280 - 500 |
| Senior | 18.000 - 32.000+ | 500 - 900+ |

## Verwachte voorwaarden
- Reiskosten of transportondersteuning
- Telefoon- of internetvergoeding
- Opleidingsbudget of training
- Bonus of prestatie-afspraken waar passend

## Advies
Toets altijd op sector, locatie, verantwoordelijkheden en schaarste van het profiel.`;


const STATS_DATA = [
  { name: 'Tech', count: 45 },
  { name: 'Mining', count: 28 },
  { name: 'Finance', count: 35 },
  { name: 'Landbouw', count: 22 },
  { name: 'Detail', count: 18 },
  { name: 'Horeca', count: 40 },
];

const ANALYTICS_DATA = [
  { date: '14/04', views: 80, apps: 12 },
  { date: '15/04', views: 120, apps: 24 },
  { date: '16/04', views: 95, apps: 18 },
  { date: '17/04', views: 160, apps: 32 },
  { date: '18/04', views: 140, apps: 28 },
  { date: '19/04', views: 210, apps: 45 },
  { date: '20/04', views: 190, apps: 38 },
];

const CANDIDATES = [
  { 
    name: 'Jurgen Dijkstra', 
    score: 98, 
    role: 'Senior Developer', 
    status: 'Nieuw', 
    date: 'Vandaag',
    email: 'j.dijkstra@example.com',
    phone: '+5978881234',
    resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    portfolioUrl: 'https://github.com'
  },
  { 
    name: 'Sita Ramdin', 
    score: 92, 
    role: 'UX Designer', 
    status: 'Screening', 
    date: 'Gisteren',
    email: 'sita.r@example.com',
    phone: '+5977775678',
    resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    portfolioUrl: 'https://behance.net'
  },
  { 
    name: 'Marvin Pinas', 
    score: 85, 
    role: 'DevOps Lead', 
    status: 'Gearchiveerd', 
    date: '2 dgn geleden',
    email: 'm.pinas@example.com',
    phone: '+5975559012',
    resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    portfolioUrl: 'https://marvin.cloud'
  },
];

const STATUS_COLORS: Record<string, string> = {
  'Nieuw': 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Screening': 'bg-amber-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Uitgenodigd': 'bg-pink-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Interview': 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Afgewezen': 'bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Aangenomen': 'bg-emerald-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  'Gearchiveerd': 'bg-slate-400 text-white'
};

const JOB_TEMPLATES = [
  {
    name: 'Administratief',
    title: 'Administratief Medewerker',
    sector: 'Overig',
    description: `### Introductie
Wij zijn op zoek naar een accurate en enthousiaste Administratief Medewerker om ons team te versterken. Ben jij georganiseerd en help je graag bij het stroomlijnen van onze dagelijkse operaties?

### Key Taken
- Beoordelen en verwerken van inkomende documentatie.
- Agendabeheer en voorbereiden van vergaderingen.
- Klantcontact per telefoon en e-mail.
- Archiveren en databeheer in ons systeem.

### Profiel
- Minimaal MULO/HAVO werk- en denkniveau.
- Uitstekende beheersing van het Nederlands (Engels is een pré).
- Ervaring met Microsoft Office (Word, Excel).
- Proactieve en discrete werkhouding.

### Aanbod
- Een marktconform salaris in SRD.
- Prettige werkomgeving in hartje Paramaribo.
- Mogelijkheden voor persoonlijke groei.
- Secundaire voorzieningen volgens Surinaamse wetgeving.`
  },
  {
    name: 'IT / Software',
    title: 'Junior/Medior Software Developer',
    sector: 'Tech',
    description: `### Introductie
Bouw je mee aan de digitale toekomst van Suriname? Wij zoeken een gepassioneerde Developer die houdt van uitdagende projecten en moderne stacks.

### Key Taken
- Ontwikkelen van nieuwe features voor onze web-applicaties.
- Bugfixing en optimalisatie van bestaande codebases.
- Meedenken over software-architectuur en UX.
- Peer-reviews uitvoeren binnen het dev-team.

### Profiel
- Ervaring met React, Node.js of Python.
- Begrip van database management (SQL/NoSQL).
- Vermogen om zelfstandig problemen op te lossen.
- Leergierig en op de hoogte van de laatste technologische trends.

### Aanbod
- Concurrerend salaris (USD-indexed mogelijk).
- Flexibele werktijden en remote-work opties.
- High-end hardware en software licenties.
- Deelname aan internationale trainingen.`
  },
  {
    name: 'Verkoop / Sales',
    title: 'Verkoopmedewerker (Buitendienst)',
    sector: 'Retail',
    description: `### Introductie
Ben jij een geboren verkoper met een vlotte babbel? Wij zoeken een resultaatgerichte Verkoopmedewerker om ons klantenbestand in Suriname uit te breiden.

### Key Taken
- Actief benaderen van nieuwe potentiële klanten.
- Onderhouden van relaties met bestaande accounts.
- Presenteren van onze producten en diensten op locatie.
- Rapporteren over verkoopresultaten en markttrends.

### Profiel
- Commerciële instelling en overtuigingskracht.
- In het bezit van een rijbewijs (B).
- Goede communicatieve vaardigheden in het Sranantongo en Nederlands.
- Resultaatgericht en gedisciplineerd.

### Aanbod
- Basissalaris plus aantrekkelijke commissieregeling.
- Auto van de zaak voor zakelijk gebruik.
- Telefoonvergoeding en onkostenregeling.
- Intensieve verkooptraining en coaching.`
  },
  {
    name: 'Horeca / Gastheer',
    title: 'Gastheer / Gastvrouw (All-round)',
    sector: 'Horeca',
    description: `### Introductie
Maak jij onze gasten blij met een glimlach? Voor onze toplocatie zoeken wij een representatieve Gastheer/Gastvrouw die gastvrijheid hoog in het vaandel heeft staan.

### Key Taken
- Ontvangen en placeren van gasten.
- Opnemen van bestellingen en serveren van drankjes/gerechten.
- Zorgen voor een schone en gezellige werkomgeving.
- Afhandelen van betalingen en reserveringen.

### Profiel
- Representatieve uitstraling en goede manieren.
- Flexibel inzetbaar (ook in de avonduren en weekenden).
- Stressbestendig en een echte teamplayer.
- Ervaring in de horeca is een voordeel, geen vereiste.

### Aanbod
- Gezellig team op een bruisende locatie.
- Marktconform loon inclusief fooi-verdeling.
- Trainingen op het gebied van hospitality.
- Doorgroeimogelijkheden naar shiftleader.`
  }
];

export default function CompanyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'jobs' | 'ai-tools'>('overview');
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedStat, setSelectedStat] = useState<any>(null);
  const [showStatModal, setShowStatModal] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [candidateComments, setCandidateComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState<any>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [postErrors, setPostErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ applicants: '0', activeJobs: '0', views: '0', timeToHire: '14d' });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Recruiter' });
  const [apiSettings, setApiSettings] = useState(() =>
    readJson('suri_api_settings', {
      webhooksEnabled: true,
      candidateEvents: true,
      jobEvents: true,
      teamEvents: false,
    })
  );
  const [billingState, setBillingState] = useState(() =>
    readJson('suri_billing_state', {
      cycle: 'Maandelijks',
      paymentMethod: 'Visa •••• 2048',
      usageLimit: 25,
      invoiceEmail: '',
      invoices: [
        { id: 'INV-2026-041', amount: 'USD 199', status: 'Betaald', period: 'April 2026' },
        { id: 'INV-2026-040', amount: 'USD 199', status: 'Betaald', period: 'Maart 2026' },
      ],
    })
  );
  const [webhookEvents, setWebhookEvents] = useState(() =>
    readJson('suri_webhook_events', [
      { id: 'evt-1', type: 'candidate.applied', status: 'Delivered', time: '2m geleden' },
      { id: 'evt-2', type: 'job.updated', status: 'Delivered', time: '14m geleden' },
      { id: 'evt-3', type: 'team.member.invited', status: 'Retrying', time: '1u geleden' },
    ])
  );
  const [apiSecretMeta, setApiSecretMeta] = useState(() =>
    readJson('suri_api_secret_meta', {
      label: 'srj_live_demo',
      rotatedAt: new Date().toISOString(),
    })
  );

  const [candidateFilter, setCandidateFilter] = useState({ 
    role: 'Alle', 
    minScore: 0,
    sortBy: 'Nieuwste' 
  });

  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalSector, setModalSector] = useState('Tech');
  const [isModalGenerating, setIsModalGenerating] = useState(false);

  // Load Data
  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;

    const storedJobsStr = localStorage.getItem('suri_jobs') || '[]';
    const storedAppsStr = localStorage.getItem('suri_applications') || '[]';
    const storedTeamStr = localStorage.getItem('suri_team') || '[]';
    const storedUserStr = localStorage.getItem('suri_user') || 'null';

    const storedJobs = JSON.parse(storedJobsStr);
    const storedApps = JSON.parse(storedAppsStr);
    const storedTeam = JSON.parse(storedTeamStr);
    const storedUser = JSON.parse(storedUserStr);
    const storedCommentsStr = localStorage.getItem('suri_team_comments') || '{}';
    const storedComments = JSON.parse(storedCommentsStr);

    setUser(storedUser);
    setCandidateComments(storedComments);

    setMyJobs((prev: any) => {
      if (JSON.stringify(prev) !== storedJobsStr) return storedJobs;
      return prev;
    });
    
    // Merge static demo candidates with real applications for a fuller look in demo
    const demoCandidates = CANDIDATES.map((c, i) => ({ ...c, id: `demo-${i}`, isReal: false, originalId: `demo-${i}` }));
    const realApps = storedApps.map((a: any) => ({
      ...a,
      name: a.candidateName || 'Anonieme Sollicitant',
      role: a.jobTitle || 'Onbekende Rol',
      score: a.aiScore || 75,
      status: a.status || 'Nieuw',
      date: 'Recent',
      isReal: true,
      originalId: a.id,
      email: a.email || a.candidateEmail || 'niet@beschikbaar.com',
      phone: a.phone || a.candidatePhone || '',
      resumeUrl: a.resumeUrl || a.resume || '#',
      portfolioUrl: a.portfolioUrl || a.portfolio || '#'
    }));

    const allCandidates = [...realApps, ...demoCandidates];
    setCandidates((prev: any) => {
      if (JSON.stringify(prev) !== JSON.stringify(allCandidates)) return allCandidates;
      return prev;
    });

    if (storedTeam.length > 0) {
      setTeamMembers((prev: any) => {
        if (JSON.stringify(prev) !== storedTeamStr) return storedTeam;
        return prev;
      });
    } else if (storedUser) {
      const defaultTeam = [{ name: storedUser.name, role: 'Owner', email: storedUser.email }];
      setTeamMembers((prev: any) => {
        if (JSON.stringify(prev) !== JSON.stringify(defaultTeam)) return defaultTeam;
        return prev;
      });
    }

    // Update dynamic stats
    const newStats = {
      applicants: allCandidates.length.toString(),
      activeJobs: storedJobs.length.toString(),
      views: (storedJobs.length * 42).toString(), // Simulated views
      timeToHire: '14d'
    };
    setStats((prev: any) => {
      if (JSON.stringify(prev) !== JSON.stringify(newStats)) return newStats;
      return prev;
    });

    setIsHydrated(true);
  }, []); // LocalStorage is global

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadData();
    }, 0);
    window.addEventListener('storage', loadData);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      window.location.href = '/auth';
      return;
    }

    if (user.role !== 'employer') {
      window.location.href = user.onboarded ? '/dashboard/candidate' : '/onboarding';
      return;
    }

    if (!user.onboarded) {
      window.location.href = '/onboarding';
    }
  }, [isHydrated, user]);

  // New features state
  const [notifications, setNotifications] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('suri_comp_notifications');
      return stored ? JSON.parse(stored) : [
        { id: 1, text: 'Nieuwe sollicitatie voor UX Designer', date: '5m geleden', read: false },
        { id: 2, text: 'Interview bevestigd door Jurgen Dijkstra', date: '2u geleden', read: true }
      ];
    }
    return [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState<{ slots: {date: string, time: string}[], type: string, note: string }>({ 
    slots: [{ date: '', time: '' }], 
    type: 'Online', 
    note: '' 
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>(['']);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('suri_comp_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    writeJson('suri_api_settings', apiSettings);
  }, [apiSettings]);

  useEffect(() => {
    writeJson('suri_billing_state', billingState);
  }, [billingState]);

  useEffect(() => {
    writeJson('suri_webhook_events', webhookEvents);
  }, [webhookEvents]);

  useEffect(() => {
    writeJson('suri_api_secret_meta', apiSecretMeta);
  }, [apiSecretMeta]);

  const addNotification = useCallback((text: string) => {
    const newNotif = { id: Date.now(), text, date: 'Zojuist', read: false };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const STAT_DETAILS: Record<string, any> = {
    'Totaal Sollicitanten': {
      title: 'Sollicitanten Trend',
      description: 'Overzicht van de toestroom van kandidaten over de afgelopen 30 dagen.',
      data: [
        { label: 'Week 1', value: 12 },
        { label: 'Week 2', value: 18 },
        { label: 'Week 3', value: 15 },
        { label: 'Week 4', value: 24 },
      ],
      detail: 'De meeste sollicitanten komen binnen via LinkedIn (45%) en SuriJobs Direct (30%).',
      icon: Users
    },
    'Actieve Vacatures': {
      title: 'Vacature Status',
      description: 'Verdeling van je huidige actieve zoekopdrachten.',
      data: [
        { label: 'Binnenstad', value: 2 },
        { label: 'Wanica', value: 3 },
        { label: 'Commewijne', value: 1 },
      ],
      detail: 'Je hebt momenteel actieve vacatures in 3 districten. Gemiddeld ontvang je 14 sollicitanten per vacature.',
      icon: FileCheck
    },
    'Profiel Views': {
      title: 'Employer Branding',
      description: 'Zichtbaarheid van jouw bedrijfspagina bij potentiële kandidaten.',
      data: [
        { label: 'Ma', value: 120 },
        { label: 'Di', value: 150 },
        { label: 'Wo', value: 180 },
        { label: 'Do', value: 140 },
        { label: 'Vr', value: 160 },
      ],
      detail: 'Je views zijn met 12% gestegen ten opzichte van vorige week. Populairste sectie: Werksfeer bij SuriJobs+.',
      icon: Eye
    },
    'Time to Hire': {
      title: 'Efficiëntie Engine',
      description: 'Gemiddelde tijd vanaf plaatsing tot getekend contract.',
      data: [
        { label: 'Sourcing', value: 5 },
        { label: 'Screening', value: 3 },
        { label: 'Interviews', value: 10 },
        { label: 'Offer', value: 2 },
      ],
      detail: 'Huidige gemiddelde: 20 dagen. Dit is 2 dagen sneller dan het Surinaamse marktgemiddelde.',
      icon: Calendar
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const closeMessageModal = () => {
    setShowMessageModal(null);
    setMessageDraft('');
  };

  const sendCandidateMessage = () => {
    if (!messageDraft.trim()) {
      setFeedbackMessage('Typ eerst een bericht voordat je het verstuurt.');
      return;
    }
    setFeedbackMessage('Bericht verzonden via secure messaging.');
    closeMessageModal();
  };

  const openInterviewModal = () => {
    setInterviewData({ slots: [{ date: '', time: '' }], type: 'Online', note: '' });
    setShowInterviewModal(true);
  };

  // AI Tool State
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJD, setGeneratedJD] = useState('');
  const [generatedJDMeta, setGeneratedJDMeta] = useState<JobDescriptionDraft | null>(null);

  const [salaryInput, setSalaryInput] = useState('');
  const [salaryResult, setSalaryResult] = useState('');
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const [questionInput, setQuestionInput] = useState('');
  const [questionResult, setQuestionResult] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionSet, setQuestionSet] = useState<InterviewQuestionSet | null>(null);
  const [shortlistRole, setShortlistRole] = useState('');
  const [shortlistResult, setShortlistResult] = useState(() => readJson<any[]>('suri_shortlist_preview', []));
  const [isGeneratingShortlist, setIsGeneratingShortlist] = useState(false);

  const generateJD = async () => {
    if (!jobTitleInput.trim()) return;
    setIsGenerating(true);
    setGeneratedJD('');
    setGeneratedJDMeta(null);
    try {
      const companyName = user?.name || 'Ons Bedrijf';
      const companyContext = user?.companyDescription || 'een innovatief Surinaams bedrijf';
      const contactInfo = user?.email || '[Contact via SuriJobs+]';
      await new Promise(resolve => setTimeout(resolve, 350));
      const draft = buildJobDescriptionDraft(jobTitleInput, companyName, companyContext, contactInfo);
      setGeneratedJDMeta(draft);
      setGeneratedJD(draft.markdown);
    } catch {
      setGeneratedJD("Er is een fout opgetreden bij het genereren van de tekst.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuestions = async () => {
    if (!questionInput.trim()) return;
    setIsGeneratingQuestions(true);
    setQuestionResult('');
    setQuestionSet(null);
    try {
      const companyName = user?.name || 'Ons Bedrijf';
      await new Promise(resolve => setTimeout(resolve, 350));
      const result = buildInterviewQuestionSet(questionInput, companyName);
      setQuestionSet(result);
      setQuestionResult(result.markdown);
    } catch {
      setQuestionResult("Er is een fout opgetreden.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const checkBenchmark = async () => {
    if (!salaryInput.trim()) return;
    setIsBenchmarking(true);
    setSalaryResult('');
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      setSalaryResult(buildSalaryBenchmark(salaryInput));
    } catch {
      setSalaryResult("Er is een fout opgetreden.");
    } finally {
      setIsBenchmarking(false);
    }
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    const fields = ['name', 'email', 'avatar', 'companyDescription', 'location', 'phone'];
    const filledFields = fields.filter(f => user[f]);
    return Math.floor((filledFields.length / fields.length) * 100);
  };

  const handleModalAI = async () => {
    if (!modalTitle.trim()) {
      setPostErrors((prev) => ({ ...prev, title: 'Voer eerst een functietitel in.' }));
      return;
    }
    setIsModalGenerating(true);
    try {
      const companyName = user?.name || 'Ons Bedrijf';
      const companyContext = user?.companyDescription || 'een innovatief Surinaams bedrijf';
      const contactInfo = user?.email || '[Contact via SuriJobs+]';
      await new Promise(resolve => setTimeout(resolve, 350));
      const draft = buildJobDescriptionDraft(modalTitle, companyName, companyContext, contactInfo);
      setModalDescription(draft.markdown);
      if (screeningQuestions.every((question) => !question.trim())) {
        setScreeningQuestions(draft.screeningQuestions);
      }
    } catch {
      setFeedbackMessage('Er is een fout opgetreden bij het genereren van de tekst.');
    } finally {
      setIsModalGenerating(false);
    }
  };

  const generateShortlist = async () => {
    const targetRole = shortlistRole || shortlistRoleOptions[0] || myJobs[0]?.title || '';
    if (!targetRole) {
      setFeedbackMessage('Kies eerst een rol om een shortlist te genereren.');
      return;
    }

    setIsGeneratingShortlist(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const result = buildShortlistRecommendations(targetRole, filteredCandidates, user?.name || 'jouw organisatie');
      setShortlistResult(result);
      writeJson('suri_shortlist_preview', result);
      setFeedbackMessage(`Shortlist gegenereerd voor ${targetRole}.`);
    } finally {
      setIsGeneratingShortlist(false);
    }
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Validation
    const title = formData.get('title') as string;
    const salary = formData.get('salary') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const sector = formData.get('sector') as string;

    const errors: Record<string, string> = {};
    if (!title || title.length < 5) errors.title = 'Titel moet minimaal 5 karakters zijn';
    if (!salary) errors.salary = 'Salaris is verplicht';
    if (!description || description.length < 20) errors.description = 'Omschrijving moet minimaal 20 karakters zijn';
    if (!location) errors.location = 'Locatie is verplicht';
    if (!sector) errors.sector = 'Sector is verplicht';

    if (Object.keys(errors).length > 0) {
      setPostErrors(errors);
      return;
    }

    setPostErrors({});
    setIsPosting(true);
    
    // Filter out empty questions
    const activeQuestions = screeningQuestions.filter(q => q.trim() !== '');

    let updatedJobs;
    if (editingJob) {
      updatedJobs = myJobs.map(j => j.id === editingJob.id ? { 
        ...j, 
        title, 
        salary, 
        location, 
        description,
        sector,
        questions: activeQuestions
      } : j);
    } else {
      const newJob = {
        id: Date.now(),
        title,
        salary,
        location,
        description,
        sector,
        posted: 'Nu',
        company: user?.name || 'SuriTech Corp',
        questions: activeQuestions
      };
      updatedJobs = [newJob, ...myJobs];
    }

    setMyJobs(updatedJobs);
    writeJson('suri_jobs', updatedJobs);
    loadData();

    setTimeout(() => {
      setIsPosting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowPostModal(false);
        setEditingJob(null);
        setFeedbackMessage(editingJob ? 'Vacature bijgewerkt.' : 'Vacature geplaatst.');
      }, 2000);
    }, 1000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const updatedUser = {
      ...user,
      name: formData.get('name'),
      email: formData.get('email'),
      avatar: formData.get('avatar'),
      companyDescription: formData.get('companyDescription'),
      location: formData.get('location'),
      phone: formData.get('phone')
    };
    
    writeJson('suri_user', updatedUser);
    setUser(updatedUser);
    setShowSettingsModal(false);
    setFeedbackMessage('Bedrijfsprofiel bijgewerkt.');
    loadData();
  };

  const addComment = (candidateId: string) => {
    if (!newComment.trim()) return;
    const updated = { ...candidateComments };
    if (!updated[candidateId]) updated[candidateId] = [];
    updated[candidateId].push({
      author: user?.name || 'Team Member',
      text: newComment,
      date: new Date().toLocaleString()
    });
    setCandidateComments(updated);
    if (typeof window !== 'undefined') {
      writeJson('suri_team_comments', updated);
    }
    setNewComment('');
    setFeedbackMessage('Interne notitie toegevoegd.');
  };

  const handleInterviewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (interviewData.slots.some(s => !s.date || !s.time)) {
      setFeedbackMessage('Vul alle voorgestelde tijden volledig in.');
      return;
    }

    addNotification(`Interview uitnodiging verstuurd naar ${selectedCandidate.name} met ${interviewData.slots.length} opties.`);
    
    if (String(selectedCandidate.id).startsWith('demo-')) {
      setFeedbackMessage('Voor demo-kandidaten is deze uitnodiging gesimuleerd.');
      setShowInterviewModal(false);
      setSelectedCandidate(null);
      return;
    }

    // Update application with proposed slots
    const apps = JSON.parse(localStorage.getItem('suri_applications') || '[]');
    const updatedApps = apps.map((a: any) => 
      a.id === selectedCandidate.originalId ? { 
        ...a, 
        status: 'Uitgenodigd', 
        proposedSlots: interviewData.slots,
        interviewType: interviewData.type,
        interviewNote: interviewData.note
      } : a
    );
    writeJson('suri_applications', updatedApps);
    
    loadData();
    setShowInterviewModal(false);
    setFeedbackMessage('Uitnodiging succesvol verstuurd.');
    setSelectedCandidate(null);
  };

  const handleStatusChange = (candId: any, newStatus: string) => {
    // Update candidates list state immediately for reactive UI
    setCandidates(prev => prev.map(c => 
      (c.originalId === candId || c.id === candId) ? { ...c, status: newStatus } : c
    ));

    // Also update selectedCandidate so the modal reflects the change
    setSelectedCandidate((prev: any) => prev ? { ...prev, status: newStatus } : null);

    // Trigger notification
    addNotification(`Status van kandidaat gewijzigd naar: ${newStatus}`);
    
    // Inline feedback for modal
    setStatusUpdateSuccess(true);
    setTimeout(() => setStatusUpdateSuccess(false), 2000);

    if (candId.toString().startsWith('demo-')) {
      // For demo candidates, we just show a toast-like notification instead of a blocking alert
      return;
    }

    const apps = JSON.parse(localStorage.getItem('suri_applications') || '[]');
    const updatedApps = apps.map((a: any) => 
      a.id === candId ? { ...a, status: newStatus } : a
    );
    writeJson('suri_applications', updatedApps);
    loadData();
  };

  const deleteJob = (id: number) => {
    const updated = myJobs.filter(j => String(j.id) !== String(id));
    setMyJobs(updated);
    writeJson('suri_jobs', updated);
    setFeedbackMessage('Vacature verwijderd.');
    loadData();
  };

  const deleteTeamMember = (email: string) => {
    if (email === user?.email) {
      setFeedbackMessage('Je kunt jezelf niet verwijderen.');
      return;
    }
    const updated = teamMembers.filter(m => m.email !== email);
    setTeamMembers(updated);
    writeJson('suri_team', updated);
    setFeedbackMessage('Teamlid verwijderd.');
    loadData();
  };

  const updateTeamRole = (email: string, newRole: string) => {
    const updated = teamMembers.map(m => m.email === email ? { ...m, role: newRole } : m);
    setTeamMembers(updated);
    writeJson('suri_team', updated);
    setFeedbackMessage('Teamrol bijgewerkt.');
    loadData();
  };

  const exportCandidates = () => {
    if (filteredCandidates.length === 0) {
      setFeedbackMessage('Geen kandidaten om te exporteren.');
      return;
    }
    
    const headers = ['Naam', 'Rol', 'Status', 'AI Score', 'Datum'];
    const csvContent = [
      headers.join(','),
      ...filteredCandidates.map(c => [
        `"${c.name}"`,
        `"${c.role}"`,
        `"${c.status}"`,
        c.score,
        `"${c.date}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kandidaten_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedbackMessage('Kandidaten export gestart.');
  };

  const copyWebhookEndpoint = async () => {
    const endpoint = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/surijobs`;
    try {
      await navigator.clipboard.writeText(endpoint);
      setFeedbackMessage('Webhook endpoint gekopieerd.');
    } catch {
      setFeedbackMessage('Kon webhook endpoint niet kopieren.');
    }
  };

  const downloadInvoice = (invoiceId: string) => {
    if (typeof window === 'undefined') return;
    const invoice = billingState.invoices.find((item: any) => item.id === invoiceId);
    if (!invoice) {
      setFeedbackMessage('Factuur niet gevonden.');
      return;
    }

    const blob = new Blob(
      [
        `Invoice: ${invoice.id}\nPeriod: ${invoice.period}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}\nCompany: ${user?.name || 'SuriJobs+ Employer'}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setFeedbackMessage(`Factuur ${invoice.id} gedownload.`);
  };

  const rotateApiSecret = () => {
    const updated = {
      label: `srj_live_${Math.random().toString(36).slice(2, 8)}`,
      rotatedAt: new Date().toISOString(),
    };
    setApiSecretMeta(updated);
    setFeedbackMessage('Webhook signing secret geroteerd.');
  };

  const sendTestWebhook = () => {
    const eventType = apiSettings.candidateEvents
      ? 'candidate.applied'
      : apiSettings.jobEvents
        ? 'job.updated'
        : apiSettings.teamEvents
          ? 'team.member.invited'
          : 'platform.ping';
    const entry = {
      id: `evt-${Date.now()}`,
      type: eventType,
      status: apiSettings.webhooksEnabled ? 'Delivered' : 'Blocked',
      time: 'Zojuist',
    };
    setWebhookEvents((prev: any[]) => [entry, ...prev].slice(0, 8));
    setFeedbackMessage(apiSettings.webhooksEnabled ? 'Test webhook verstuurd.' : 'Webhooks staan uit; test event geblokkeerd.');
  };

  const handleInviteTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!isValidEmail(inviteForm.email)) nextErrors.email = 'Voer een geldig e-mailadres in.';
    if (teamMembers.some((member) => member.email.toLowerCase() === inviteForm.email.toLowerCase())) {
      nextErrors.email = 'Dit teamlid is al toegevoegd.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setInviteErrors(nextErrors);
      return;
    }

    const updated = [
      ...teamMembers,
      {
        name: inviteForm.email.split('@')[0],
        email: inviteForm.email.toLowerCase(),
        role: inviteForm.role,
      },
    ];
    setInviteErrors({});
    setTeamMembers(updated);
    writeJson('suri_team', updated);
    setInviteForm({ email: '', role: 'Recruiter' });
    setShowInviteModal(false);
    setFeedbackMessage('Uitnodiging verstuurd naar teamlid.');
    loadData();
  };

  // Process data for charts
  const dynamicStatsData = () => {
    const statuses = Object.keys(STATUS_COLORS);
    return statuses.map(s => ({
      name: s,
      count: candidates.filter(c => c.status === s).length
    }));
  };

  const filteredCandidates = candidates
    .filter(c => {
      const roleMatch = candidateFilter.role === 'Alle' || c.role === candidateFilter.role;
      const scoreMatch = c.score >= candidateFilter.minScore;
      return roleMatch && scoreMatch;
    })
    .sort((a, b) => {
      if (candidateFilter.sortBy === 'Hoogste Score') return b.score - a.score;
      if (candidateFilter.sortBy === 'Nieuwste') return new Date(b.appliedAt || b.date).getTime() - new Date(a.appliedAt || a.date).getTime();
      return 0;
    });

  const uniqueRoles = ['Alle', ...Array.from(new Set(candidates.map(c => c.role)))];
  const shortlistRoleOptions = Array.from(
    new Set([...myJobs.map((job) => job.title), ...candidates.map((candidate) => candidate.role)])
  ).filter(Boolean);
  const recruiterAssist = useMemo(() => {
    if (!selectedCandidate) return null;
    return buildRecruiterAssist(selectedCandidate, user?.name || 'jouw organisatie');
  }, [selectedCandidate, user?.name]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {feedbackMessage && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center justify-between gap-4">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage('')} className="hover:text-black">Sluit</button>
          </div>
        )}
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-black flex items-center justify-center text-white font-black text-2xl border-4 border-blue-600">ST</div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">{user?.name || 'SuriTech Corp'} <span className="text-blue-600 italic">{user?.role === 'employer' ? 'Company' : ''}</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Enterprise Dashboard — {user?.email || 'Paramaribo HQ'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white border-2 border-black p-4 brutal-shadow hover:bg-slate-50 relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border-2 border-black rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-72 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-[100] p-6"
                  >
                    <div className="flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Notificaties</h4>
                       <button onClick={markAllRead} className="text-[8px] font-black text-blue-600 uppercase hover:underline">Markeer alles als gelezen</button>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className={cn("p-3 border-2 transition-all", n.read ? "bg-slate-50 border-slate-100" : "bg-blue-50 border-blue-200")}>
                             <p className="text-[9px] font-bold uppercase tracking-tight leading-tight mb-1">{n.text}</p>
                             <span className="text-[7px] font-black text-slate-400 uppercase">{n.date}</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-[9px] font-black text-slate-300 uppercase">Geen notificaties</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

             <button 
              onClick={() => setPreviewMode(true)}
              className="bg-white border-2 border-black px-4 py-4 font-black uppercase tracking-tighter hover:bg-emerald-50 transition-all flex items-center gap-3 brutal-shadow text-emerald-600 border-emerald-600"
            >
              <Eye className="w-5 h-5" /> Preview
            </button>
             <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-white border-2 border-black px-4 py-4 font-black uppercase tracking-tighter hover:bg-slate-50 transition-all flex items-center gap-3 brutal-shadow"
            >
              <UserPlus className="w-5 h-5" /> Team
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="bg-white border-2 border-black px-4 py-4 font-black uppercase tracking-tighter hover:bg-slate-50 transition-all flex items-center gap-3 brutal-shadow"
            >
              <Building2 className="w-5 h-5" /> Instellingen
            </button>
            <button 
              onClick={() => {
                setEditingJob(null);
                setModalTitle('');
                setModalDescription('');
                setModalSector('Tech');
                setShowPostModal(true);
              }}
              className="bg-black text-white px-10 py-4 font-black uppercase tracking-tighter hover:bg-blue-600 transition-all active:scale-95 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] flex items-center gap-3"
            >
              <Plus className="w-6 h-6" /> Plaats Vacature
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mb-12 bg-white border-4 border-black p-6 brutal-shadow flex flex-col md:flex-row items-center gap-8">
           <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Company Profile Score</span>
                 </div>
                 <span className="text-xl font-black text-blue-600 italic tracking-tighter">{calculateProfileCompletion()}%</span>
              </div>
              <div className="w-full h-4 bg-slate-100 border-2 border-black overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${calculateProfileCompletion()}%` }}
                   className="h-full bg-blue-600 transition-all duration-1000" 
                 />
              </div>
           </div>
           <button 
             onClick={() => setShowSettingsModal(true)}
             className="w-full md:w-auto bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] flex items-center justify-center gap-2"
           >
             <Settings className="w-4 h-4" /> Vervolledig Profiel
           </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 mb-12 border-b-2 border-slate-100 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overzicht' },
            { id: 'candidates', label: 'Kandidaten Pipeline' },
            { id: 'jobs', label: 'Mijn Vacatures' },
            { id: 'ai-tools', label: 'AI Workspace' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-4 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative",
                activeTab === tab.id ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-blue-600" : "text-slate-400 hover:text-black"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Area */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {activeTab === 'overview' && (
              <>
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Totaal Sollicitanten', val: stats.applicants, icon: Users, change: '+24%' },
                    { label: 'Actieve Vacatures', val: stats.activeJobs, icon: FileCheck, change: 'Stable' },
                    { label: 'Profiel Views', val: stats.views, icon: Eye, change: '+12%' },
                    { label: 'Time to Hire', val: stats.timeToHire, icon: Calendar, change: '-2d' },
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedStat(STAT_DETAILS[stat.label]);
                        setShowStatModal(true);
                      }}
                      className="bg-white border-2 border-slate-100 p-6 hover:border-black transition-all cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:scale-95 group group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-50 text-blue-600 group-hover:bg-black group-hover:text-white transition-colors">
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="text-3xl font-black tracking-tighter mb-1 uppercase italic">{stat.val}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter italic">{stat.change}</div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Klik voor details</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Candidate Pipeline Summary */}
                <div className="bg-white border-4 border-black p-10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight italic">Nieuwe Kandidaten</h3>
                    </div>
                    <button onClick={() => setActiveTab('candidates')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Bekijk Pipeline</button>
                  </div>
                  <div className="space-y-6">
                    {candidates.slice(0, 3).map((cand, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedCandidate(cand)}
                        className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-slate-50 hover:border-blue-600 group transition-all cursor-pointer bg-white"
                      >
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                          <div className="w-14 h-14 bg-slate-900 text-blue-400 flex items-center justify-center">
                            <Terminal className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tight text-xl group-hover:text-blue-600 transition-colors italic">{cand.name}</div>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              <span>{cand.role}</span>
                              <span className="text-slate-200">|</span>
                              <span className="text-slate-500 italic">Score: {cand.score}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className={cn(
                            "px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                            STATUS_COLORS[cand.status] || "bg-slate-100 text-slate-400"
                          )}>
                            {cand.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'candidates' && (
              <div className="bg-white border-4 border-black p-10 relative overflow-hidden min-h-[600px]">
                  <div className="flex flex-col gap-6 mb-10 border-b-2 border-slate-100 pb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Volledige Pipeline</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gefilterd via AI Parsing Engine V4</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={exportCandidates}
                          className="flex items-center gap-2 border-2 border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all"
                        >
                          <Download className="w-4 h-4" /> Export
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Filter op Functie</label>
                        <select 
                          value={candidateFilter.role}
                          onChange={(e) => setCandidateFilter({...candidateFilter, role: e.target.value})}
                          className="w-full p-2 border-2 border-slate-100 text-[10px] font-black uppercase outline-none focus:border-black"
                        >
                          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sorteren</label>
                        <select 
                          value={candidateFilter.sortBy}
                          onChange={(e) => setCandidateFilter({...candidateFilter, sortBy: e.target.value})}
                          className="w-full p-2 border-2 border-slate-100 text-[10px] font-black uppercase outline-none focus:border-black"
                        >
                          <option>Nieuwste</option>
                          <option>Hoogste Score</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Min. AI Score ({candidateFilter.minScore}%)</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={candidateFilter.minScore}
                          onChange={(e) => setCandidateFilter({...candidateFilter, minScore: parseInt(e.target.value)})}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                <div className="space-y-6">
                  {filteredCandidates.map((cand, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedCandidate(cand)}
                      className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-slate-50 hover:border-blue-600 group transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className="w-14 h-14 bg-slate-900 text-blue-400 flex items-center justify-center">
                          <Terminal className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black uppercase tracking-tight text-xl group-hover:text-blue-600 transition-colors italic">{cand.name}</div>
                          <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            <span>{cand.role}</span>
                            <span className="text-slate-200">|</span>
                            <span className="text-slate-500 italic">Score: {cand.score}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className={cn(
                          "px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                          STATUS_COLORS[cand.status] || "bg-slate-100 text-slate-400"
                        )}>
                          {cand.status}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMessageDraft(''); setShowMessageModal(cand); }}
                            className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCandidate(cand); }}
                            className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white border-4 border-black p-10 relative overflow-hidden min-h-[600px]">
                <div className="flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Beheer Vacatures</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Overzicht van uw geplaatste vacatures</p>
                  </div>
                   <button 
                    onClick={() => {
                      setEditingJob(null);
                      setModalTitle('');
                      setModalDescription('');
                      setModalSector('Tech');
                      setShowPostModal(true);
                    }}
                    className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                  >
                    Nieuwe Vacature
                  </button>
                </div>

                <div className="space-y-6">
                  {myJobs.length > 0 ? myJobs.map((job, i) => (
                    <div key={i} className="p-8 border-2 border-slate-100 bg-white relative group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-1">{job.title}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.location} • {job.salary}{job.sector ? ` • ${job.sector}` : ''}</p>
                        </div>
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 text-[8px] font-black uppercase tracking-widest">Actief</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 py-6 border-y-2 border-slate-50 mb-6">
                         <div>
                            <div className="text-2xl font-black tracking-tighter uppercase italic">24</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clicks</div>
                         </div>
                         <div>
                            <div className="text-2xl font-black tracking-tighter uppercase italic">12</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sollicitaties</div>
                         </div>
                         <div>
                            <div className="text-2xl font-black tracking-tighter uppercase italic">85%</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quality Score</div>
                         </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setEditingJob(job);
                            setModalTitle(job.title);
                            setModalDescription(job.description);
                            setModalSector(job.sector || 'Tech');
                            setShowPostModal(true);
                          }}
                          className="flex-1 bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Bewerk
                        </button>
                        <button 
                          onClick={() => deleteJob(job.id)} 
                          className="px-6 border-2 border-slate-100 py-3 text-[10px] font-black uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> Verwijder
                        </button>
                        <Link href={`/vacatures/${job.id}`} className="px-6 border-2 border-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                           View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100">
                       <p className="text-xs font-black uppercase tracking-widest text-slate-300">U heeft nog geen vacatures geplaatst.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai-tools' && (
              <div className="bg-white border-4 border-black p-10 relative overflow-hidden min-h-[600px]">
                <div className="flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">AI Recruitment Workspace</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Versnel uw hiring met onze slimme recruitment tools</p>
                  </div>
                </div>

                <div className="space-y-12">
                   <section className="bg-slate-50 p-8 border-2 border-black brutal-shadow">
                      <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                        <h4 className="text-xl font-black uppercase tracking-tight italic">Job Description Optimizer</h4>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                        Voer een functietitel in en laat de AI een perfecte Surinaamse vacaturetekst schrijven die kandidaten aanspreekt.
                      </p>
                      <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <input 
                          value={jobTitleInput}
                          onChange={(e) => setJobTitleInput(e.target.value)}
                          type="text" 
                          placeholder="BIJV: PROJECT MANAGER MIJNBOUW" 
                          className="flex-1 p-5 border-2 border-black font-black uppercase tracking-widest text-xs outline-none focus:bg-white"
                        />
                        <button 
                          onClick={generateJD}
                          disabled={isGenerating || !jobTitleInput}
                          className="bg-black text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                          {isGenerating ? "Bezig..." : "Genereer Tekst"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {generatedJD && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-2 border-dashed border-slate-200 p-8 relative"
                          >
                             {generatedJDMeta && (
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                 <div className="border-2 border-black p-4 bg-slate-50">
                                   <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Samenvatting</div>
                                   <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{generatedJDMeta.summary}</p>
                                 </div>
                                 <div className="border-2 border-black p-4 bg-slate-50">
                                   <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Must-haves</div>
                                   <div className="space-y-2">
                                     {generatedJDMeta.mustHaves.slice(0, 3).map((item) => (
                                       <p key={item} className="text-[10px] font-bold uppercase tracking-widest">{item}</p>
                                     ))}
                                   </div>
                                 </div>
                                 <div className="border-2 border-black p-4 bg-slate-50">
                                   <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Interview focus</div>
                                   <div className="space-y-2">
                                     {generatedJDMeta.interviewFocus.slice(0, 3).map((item) => (
                                       <p key={item} className="text-[10px] font-bold uppercase tracking-widest">{item}</p>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             )}
                             <div className="relative group">
                                <textarea 
                                  readOnly
                                  value={generatedJD}
                                  className="w-full h-[400px] p-4 text-xs font-mono font-bold text-slate-700 bg-slate-50 border-2 border-slate-100 outline-none resize-none"
                                />
                                <div className="absolute top-4 right-4 p-2 flex gap-2">
                                  <button 
                                   onClick={() => {
                                     navigator.clipboard.writeText(generatedJD);
                                     setFeedbackMessage('Tekst gekopieerd naar klembord.');
                                   }}
                                   className="bg-white border-2 border-black p-3 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" title="Kopieer"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                             </div>

                             <div className="mt-8 p-8 bg-slate-50 border-2 border-black">
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 italic flex items-center gap-2">
                                  <Eye className="w-4 h-4" /> Live Preview (Zoals kandidaten het zien)
                                </div>
                                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-p:font-bold prose-p:text-slate-600 prose-li:font-bold prose-li:text-slate-600">
                                   <ReactMarkdown>{generatedJD}</ReactMarkdown>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </section>

                   <div className="space-y-12">
                      <section className="bg-slate-50 p-8 border-2 border-black brutal-shadow">
                         <div className="flex items-center gap-3 mb-6">
                           <Users className="w-6 h-6 text-blue-600" />
                           <h4 className="text-xl font-black uppercase tracking-tight italic">Interview Vragengenerator</h4>
                         </div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                           Maak lijsten met specifieke vragen per rol om kandidaten beter te screenen op zowel techniek als culture-fit.
                         </p>
                         <div className="flex flex-col md:flex-row gap-4 mb-8">
                           <input 
                             value={questionInput}
                             onChange={(e) => setQuestionInput(e.target.value)}
                             placeholder="BIJV: SENIOR DEVELOPER"
                             className="flex-1 p-5 border-2 border-black font-black uppercase tracking-widest text-xs outline-none focus:bg-white"
                           />
                           <button 
                             onClick={generateQuestions}
                             disabled={isGeneratingQuestions || !questionInput}
                             className="bg-black text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
                           >
                             {isGeneratingQuestions ? "Bezig..." : "Start Generator"}
                           </button>
                         </div>

                         {questionResult && (
                           <div className="bg-white border-2 border-dashed border-slate-200 p-8 relative">
                             {questionSet && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                 {questionSet.categories.map((category) => (
                                   <div key={category.title} className="border-2 border-black bg-slate-50 p-4">
                                     <div className="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-3">{category.title}</div>
                                     <div className="space-y-2">
                                       {category.questions.map((question) => (
                                         <p key={question} className="text-[10px] font-bold leading-relaxed">{question}</p>
                                       ))}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                              <textarea 
                                readOnly
                                value={questionResult}
                                className="w-full h-[300px] p-4 text-xs font-mono font-bold text-slate-700 bg-slate-50 border-2 border-slate-100 outline-none resize-none"
                              />
                              {questionSet && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                  <div className="border-2 border-black p-4 bg-slate-50">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Scorecard</div>
                                    <div className="space-y-2">
                                      {questionSet.scorecard.map((item) => (
                                        <p key={item} className="text-[10px] font-bold uppercase tracking-widest">{item}</p>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="border-2 border-black p-4 bg-slate-50">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Red Flags</div>
                                    <div className="space-y-2">
                                      {questionSet.redFlags.map((item) => (
                                        <p key={item} className="text-[10px] font-bold leading-relaxed">{item}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                           </div>
                         )}
                      </section>

                      <section className="bg-slate-50 p-8 border-2 border-black brutal-shadow">
                         <div className="flex items-center gap-3 mb-6">
                           <TrendingUp className="w-6 h-6 text-blue-600" />
                           <h4 className="text-xl font-black uppercase tracking-tight italic">Salaris Benchmark AI</h4>
                         </div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                           Controleer of uw salarisaanbod concurrerend is binnen de huidige Surinaamse markt met data-gedreven inzichten.
                         </p>
                         <div className="flex flex-col md:flex-row gap-4 mb-8">
                           <input 
                             value={salaryInput}
                             onChange={(e) => setSalaryInput(e.target.value)}
                             placeholder="BIJV: ACCOUNTANT"
                             className="flex-1 p-5 border-2 border-black font-black uppercase tracking-widest text-xs outline-none focus:bg-white"
                           />
                           <button 
                             onClick={checkBenchmark}
                             disabled={isBenchmarking || !salaryInput}
                             className="bg-black text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
                           >
                             {isBenchmarking ? "Bezig..." : "Start Benchmark"}
                           </button>
                         </div>

                         {salaryResult && (
                           <div className="bg-white border-2 border-dashed border-slate-200 p-8 relative">
                              <textarea 
                                readOnly
                                value={salaryResult}
                                className="w-full h-[300px] p-4 text-xs font-mono font-bold text-slate-700 bg-slate-50 border-2 border-slate-100 outline-none resize-none"
                              />
                           </div>
                         )}
                      </section>

                      <section className="bg-slate-50 p-8 border-2 border-black brutal-shadow">
                         <div className="flex items-center gap-3 mb-6">
                           <MessageSquare className="w-6 h-6 text-blue-600" />
                           <h4 className="text-xl font-black uppercase tracking-tight italic">Recruiter Assist Shortlist</h4>
                         </div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                           Genereer direct een shortlist met aanbevolen volgende stap en outreach-copy voor je belangrijkste open rol.
                         </p>
                         <div className="flex flex-col md:flex-row gap-4 mb-8">
                           <select
                             value={shortlistRole || shortlistRoleOptions[0] || ''}
                             onChange={(e) => setShortlistRole(e.target.value)}
                             className="flex-1 p-5 border-2 border-black font-black uppercase tracking-widest text-xs outline-none focus:bg-white"
                           >
                             <option value="">Kies een rol</option>
                             {shortlistRoleOptions.map((role) => (
                               <option key={role} value={role}>{role}</option>
                             ))}
                           </select>
                           <button
                             onClick={generateShortlist}
                             disabled={isGeneratingShortlist || !shortlistRoleOptions.length}
                             className="bg-black text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
                           >
                             {isGeneratingShortlist ? 'Bezig...' : 'Genereer Shortlist'}
                           </button>
                         </div>

                         {!shortlistRoleOptions.length && (
                           <div className="border-2 border-dashed border-slate-300 p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                             Voeg eerst een vacature of kandidaten toe om recruiter assist te gebruiken.
                           </div>
                         )}

                         {shortlistResult.length > 0 && (
                           <div className="space-y-4">
                             {shortlistResult.map((item) => (
                               <div key={String(item.candidateId)} className="border-2 border-black bg-white p-5">
                                 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                   <div className="space-y-2">
                                     <div className="text-sm font-black uppercase tracking-tight italic">{item.name}</div>
                                     <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.role} | Match {item.score}%</div>
                                     <p className="text-[10px] font-bold leading-relaxed">{item.summary}</p>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{item.nextStep}</p>
                                   </div>
                                   <button
                                     onClick={() => {
                                       navigator.clipboard.writeText(item.outreach);
                                       setFeedbackMessage(`Outreach gekopieerd voor ${item.name}.`);
                                     }}
                                     className="border-2 border-black px-4 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                                   >
                                     Kopieer Outreach
                                   </button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                      </section>
                   </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Area */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            {/* Analytics Summary */}
            <div className="bg-white border-2 border-black p-8 brutal-shadow">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic decoration-blue-600 underline underline-offset-8">Traffic & Conversion</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Performance over de laatste 7 dagen</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Apps</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[250px] w-full">
                <ChartFrame className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ANALYTICS_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black text-white p-4 border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(37,99,235,1)]">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-white/20 pb-1">{payload[0].payload.date}</p>
                                {payload.map((p, i) => (
                                  <div key={i} className="flex justify-between gap-6 items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{p.name}:</span>
                                    <span className="text-[11px] font-black">{p.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        name="Views"
                        stroke="#2563eb" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="apps" 
                        name="Sollicitaties"
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorApps)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Conv. Rate</div>
                    <div className="text-xl font-black italic italic uppercase tracking-tighter">18.4%</div>
                 </div>
                 <div className="bg-slate-50 p-4 border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Day</div>
                    <div className="text-xl font-black italic italic uppercase tracking-tighter">Zaterdag</div>
                 </div>
              </div>
            </div>

            {/* Premium Features */}
            <div className="bg-black text-white p-8 relative overflow-hidden shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]">
              <div className="relative z-10">
                <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-4">Upgrade naar <span className="text-blue-400">Enterprise</span></h4>
                <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed uppercase tracking-widest">
                  Ontgrendel ongelimiteerde parsing, video-interviews en geavanceerde achtergrond checks.
                </p>
                <ul className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400" /> Unlimited Candidate Export
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400" /> WhatsApp Integration API
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400" /> Dedicated Account Manager
                  </li>
                </ul>
                <button 
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full bg-blue-600 py-4 font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
                >
                  Check Prijzen
                </button>
              </div>
            </div>
            
            {/* System Info */}
            <div className="bg-slate-100 p-6 flex items-center justify-between border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Parser Status: Online</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LATENCY: 140MS</span>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-black text-white px-10 py-6 border-t-4 border-blue-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] gap-4">
          <div>© 2026 SuriJobs+ | Enterprise Talent OS</div>
          <div className="flex gap-8">
            <button onClick={() => setShowSettingsModal(true)} className="text-blue-400 hover:underline">Instellingen</button>
            <button onClick={() => setShowBillingModal(true)} className="hover:underline">Billing</button>
            <button onClick={() => setShowApiModal(true)} className="hover:underline">API Management</button>
          </div>
        </div>
      </footer>

      {/* Team Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] md:shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] custom-scrollbar"
          >
            <button onClick={() => setShowInviteModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-b-2 border-blue-600 w-fit pb-1">Team Uitnodigen</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Nodig collega&apos;s uit om kandidaten te reviewen en feedback te geven.</p>
            <form onSubmit={handleInviteTeam} className="space-y-4">
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest">E-mailadres</label>
                  <input value={inviteForm.email} onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))} required type="email" placeholder="collega@bedrijf.sr" className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black text-xs font-bold" />
                  {inviteErrors.email && <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-600">{inviteErrors.email}</p>}
               </div>
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest">Rol</label>
                  <select value={inviteForm.role} onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black text-xs font-bold uppercase tracking-widest">
                     <option>Recruiter</option>
                     <option>Hiring Manager</option>
                     <option>Viewer</option>
                  </select>
               </div>
               <button type="submit" className="w-full bg-black text-white p-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">
                  Verstuur Uitnodiging
               </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Actieve Teamleden</div>
               <div className="space-y-2">
                  {teamMembers.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 group">
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase tracking-widest italic">{m.name}</span>
                         <span className="text-[7px] font-bold text-slate-400">{m.email}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <select 
                            value={m.role}
                            onChange={(e) => updateTeamRole(m.email, e.target.value)}
                            className="text-[8px] font-bold bg-slate-200 px-2 py-0.5 outline-none cursor-pointer"
                          >
                            <option>Owner</option>
                            <option>Recruiter</option>
                            <option>Hiring Manager</option>
                            <option>Viewer</option>
                          </select>
                         {m.email !== user?.email && (
                           <button 
                             onClick={() => deleteTeamMember(m.email)}
                             className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X className="w-3 h-3" />
                           </button>
                         )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPosting && setShowPostModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] md:shadow-[24px_24px_0px_0px_rgba(59,130,246,1)] custom-scrollbar"
          >
            <button onClick={() => setShowPostModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>

            {isSuccess ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Vacature Geplaatst!</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Je vacature wordt nu verwerkt door de AI Parser.</p>
              </div>
            ) : (
              <form onSubmit={handlePostJob} className="space-y-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-blue-600 w-fit pb-2">
                  {editingJob ? 'Vacature Bewerken' : 'Nieuwe Vacature'}
                </h3>

                {!editingJob && (
                  <div className="space-y-4 mb-8 bg-slate-50 p-6 border-2 border-dashed border-black">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Snel Starten: Kies een Template</span>
                       </div>
                       <button 
                         type="button"
                         onClick={() => {
                           setModalTitle('');
                           setModalDescription('');
                           setModalSector('Overig');
                         }}
                         className="text-[8px] font-black uppercase text-red-500 hover:underline"
                       >
                         Wissen
                       </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {JOB_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setModalTitle(tmpl.title);
                            setModalDescription(tmpl.description);
                            setModalSector(tmpl.sector);
                          }}
                          className="bg-white border-2 border-black p-2 text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all text-center"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Functietitel</label>
                   <input 
                     name="title" 
                     required 
                     type="text" 
                     value={modalTitle}
                     onChange={(e) => setModalTitle(e.target.value)}
                     className={cn("w-full p-4 border-2 outline-none font-bold uppercase tracking-widest text-xs", postErrors.title ? "border-red-500" : "border-slate-100 focus:border-black")} 
                     placeholder="BIJV. SENIOR DEVELOPER" 
                   />
                   {postErrors.title && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{postErrors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest">Salaris Range</label>
                    <input 
                      name="salary" 
                      required 
                      type="text" 
                      defaultValue={editingJob?.salary || ''}
                      className={cn("w-full p-4 border-2 outline-none font-bold uppercase tracking-widest text-xs", postErrors.salary ? "border-red-500" : "border-slate-100 focus:border-black")} 
                      placeholder="SRD XX.XXX - XX.XXX" 
                    />
                    {postErrors.salary && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{postErrors.salary}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest">Sector</label>
                    <select 
                      name="sector" 
                      value={modalSector}
                      onChange={(e) => setModalSector(e.target.value)}
                      className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold uppercase tracking-widest text-xs"
                    >
                      <option value="Tech">Technology & IT</option>
                      <option value="Banking">Banking & Finance</option>
                      <option value="Mining">Mining & Industrie</option>
                      <option value="Retail">Retail & Handel</option>
                      <option value="Logistics">Logistiek & Transport</option>
                      <option value="Landbouw">Landbouw & Export</option>
                      <option value="Horeca">Horeca & Toerisme</option>
                      <option value="HR">HR & Consultancy</option>
                      <option value="Overig">Overig</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest">Locatie</label>
                    <select 
                      name="location" 
                      defaultValue={editingJob?.location || 'Paramaribo'}
                      className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold uppercase tracking-widest text-xs"
                    >
                      <option>Paramaribo</option>
                      <option>Wanica</option>
                      <option>Nickerie</option>
                      <option>Commewijne</option>
                      <option>Saramacca</option>
                      <option>Para</option>
                      <option>Marowijne</option>
                      <option>Coronie</option>
                      <option>Brokopondo</option>
                      <option>Sipaliwini</option>
                      <option>Remote / Thuiswerk</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-end mb-2">
                     <label className="text-[10px] font-black uppercase tracking-widest">Omschrijving</label>
                     <button 
                       type="button"
                       onClick={handleModalAI}
                       disabled={isModalGenerating || !modalTitle}
                       className="flex items-center gap-2 text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1 hover:bg-black transition-all disabled:opacity-30"
                     >
                        <Sparkles className="w-3 h-3" /> {isModalGenerating ? 'Genereren...' : 'Genereer met AI'}
                     </button>
                   </div>
                   <textarea 
                     name="description" 
                     required 
                     value={modalDescription}
                     onChange={(e) => setModalDescription(e.target.value)}
                     className={cn("w-full p-4 border-2 outline-none font-bold text-xs min-h-[150px]", postErrors.description ? "border-red-500" : "border-slate-100 focus:border-black")} 
                     placeholder="WAT ZOEKEN JULLIE EXACT? (OOK AI GENEREERBAAR)" 
                   />
                   {modalDescription && (
                     <div className="mt-4 p-4 bg-slate-50 border-2 border-black max-h-[200px] overflow-y-auto">
                        <div className="text-[8px] font-black uppercase text-blue-600 mb-2 italic">Preview</div>
                        <div className="prose prose-slate prose-xs max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-p:font-bold prose-p:text-slate-600">
                           <ReactMarkdown>{modalDescription}</ReactMarkdown>
                        </div>
                     </div>
                   )}
                   {postErrors.description && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{postErrors.description}</p>}
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Selectievragen (Optioneel)</label>
                      <button 
                        type="button"
                        onClick={() => setScreeningQuestions([...screeningQuestions, ''])}
                        className="text-[8px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Vraag Toevoegen
                      </button>
                   </div>
                   <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      {screeningQuestions.map((q, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            value={q}
                            onChange={(e) => {
                              const newQ = [...screeningQuestions];
                              newQ[i] = e.target.value;
                              setScreeningQuestions(newQ);
                            }}
                            className="flex-1 p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-[10px] uppercase tracking-widest bg-slate-50"
                            placeholder={`BIJV: HEB JE EEN RIJBEWIJS?`}
                          />
                          {screeningQuestions.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setScreeningQuestions(screeningQuestions.filter((_, idx) => idx !== i))}
                              className="p-3 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                   </div>
                </div>

                <button 
                  disabled={isPosting}
                  type="submit"
                  className="w-full bg-black text-white py-6 font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isPosting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (editingJob ? "Update Vacature" : "Publiceer Vacature")}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-10 shadow-[24px_24px_0px_0px_rgba(59,130,246,1)]"
          >
            <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-8">
                <div className="w-32 h-32 bg-slate-900 flex items-center justify-center text-4xl font-black text-blue-400">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedCandidate.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{selectedCandidate.role}</p>
                </div>
                
                <div className="bg-slate-50 p-6 space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest border-b pb-2">AI Score Breakdown</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Tech Match</span>
                    <span className="font-black text-blue-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Culture Fit</span>
                    <span className="font-black text-emerald-600">85%</span>
                  </div>
                </div>

                {recruiterAssist && (
                  <div className="bg-blue-50 border-2 border-blue-600 p-6 space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest border-b border-blue-200 pb-2 text-blue-600">Recruiter Assist</div>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-slate-700">{recruiterAssist.summary}</p>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Sterke signalen</div>
                      <div className="space-y-2">
                        {recruiterAssist.strengths.map((item) => (
                          <div key={item} className="text-[9px] font-bold uppercase tracking-tight text-slate-600">{item}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Let op</div>
                      <div className="space-y-2">
                        {recruiterAssist.concerns.map((item) => (
                          <div key={item} className="text-[9px] font-bold uppercase tracking-tight text-slate-600">{item}</div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(recruiterAssist.outreach);
                        setFeedbackMessage('Recruiter outreach gekopieerd.');
                      }}
                      className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Kopieer Outreach
                    </button>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t-2 border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Team Comments
                  </div>
                  <div className="space-y-3 max-h-[150px] overflow-y-auto scrollbar-hide">
                    {(candidateComments[selectedCandidate.originalId] || []).map((c, i) => (
                      <div key={i} className="text-[9px] bg-slate-50 p-2 border-l-2 border-blue-600">
                        <div className="flex justify-between font-black uppercase tracking-widest text-[#666]">
                          <span>{c.author}</span>
                          <span className="opacity-50 italic">{c.date}</span>
                        </div>
                        <p className="mt-1 font-bold text-slate-700 leading-tight">{c.text}</p>
                      </div>
                    ))}
                    {!(candidateComments[selectedCandidate.originalId] || []).length && (
                      <div className="text-[8px] font-bold text-slate-300 uppercase italic">Nog geen opmerkingen van het team.</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addComment(selectedCandidate.originalId)}
                      placeholder="VOEG OPMERKING TOE..."
                      className="flex-1 p-2 border border-slate-200 text-[9px] font-bold outline-none focus:border-black"
                    />
                    <button 
                      onClick={() => addComment(selectedCandidate.originalId)}
                      className="bg-black text-white p-2 hover:bg-blue-600 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <a 
                    href={selectedCandidate.phone ? `https://wa.me/${selectedCandidate.phone.replace(/[^0-9]/g, '')}` : '#'} 
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all",
                      !selectedCandidate.phone && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={(e) => !selectedCandidate.phone && e.preventDefault()}
                  >
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                  <a 
                    href={`mailto:${selectedCandidate.email || ''}`}
                    className="w-full flex items-center justify-center gap-2 border-2 border-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
                  >
                    <Mail className="w-4 h-4" /> E-mail
                  </a>
                </div>
              </div>

              <div className="md:col-span-2 space-y-10">
                {selectedCandidate.status === 'Uitgenodigd' && selectedCandidate.proposedSlots && (
                  <section className="bg-pink-50 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(219,39,119,1)]">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-pink-600 mb-4 flex items-center gap-2">
                       <Calendar className="w-4 h-4" /> Voorgestelde Interview Momenten
                    </h4>
                    <div className="space-y-3">
                      {selectedCandidate.proposedSlots.map((slot: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white p-4 border-2 border-black group cursor-pointer hover:bg-pink-100 transition-colors"
                          onClick={() => {
                            handleStatusChange(selectedCandidate.originalId, 'Interview');
                            addNotification(`Interview definitief bevestigd met ${selectedCandidate.name} voor ${slot.date} om ${slot.time}`);
                            setFeedbackMessage('Status bijgewerkt naar interview.');
                          }}
                        >
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-tight">{slot.date} om {slot.time}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase italic">Klik om acceptatie door kandidaat te simuleren</div>
                          </div>
                          <div className="text-[8px] font-black bg-pink-100 text-pink-600 px-2 py-1 uppercase tracking-widest">In Afwachting</div>
                        </div>
                      ))}
                      <p className="text-[8px] font-bold text-slate-500 uppercase mt-4">
                        Type: <span className="text-black">{selectedCandidate.interviewType || 'Online'}</span> | 
                        Notitie: <span className="text-black italic">&quot;{selectedCandidate.interviewNote || 'Geen'}&quot;</span>
                      </p>
                    </div>
                  </section>
                )}

                <section>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 mb-6 border-b-2 border-blue-600 w-fit pb-1">Ervaring & Skills</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">Senior Systems Engineer @ GlobalTech</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">2021 — Heden (Paramaribo)</div>
                      <p className="text-xs text-slate-600 mt-2 font-bold leading-relaxed">Verantwoordelijk voor de gehele cloud-architectuur en team-management van 12 developers.</p>
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">Fullstack Developer @ SuriSoft</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">2018 — 2021 (Paramaribo)</div>
                      <p className="text-xs text-slate-600 mt-2 font-bold leading-relaxed">Implementatie van diverse FinTech oplossingen voor de locale markt.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 mb-6 border-b-2 border-blue-600 w-fit pb-1">Documenten</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <a 
                      href={selectedCandidate.resumeUrl && selectedCandidate.resumeUrl !== '#' ? selectedCandidate.resumeUrl : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "border-2 border-slate-100 p-4 flex items-center justify-between group hover:border-black transition-all",
                        (!selectedCandidate.resumeUrl || selectedCandidate.resumeUrl === '#') ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      )}
                      onClick={(e) => (!selectedCandidate.resumeUrl || selectedCandidate.resumeUrl === '#') && e.preventDefault()}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Curr_Vitae.pdf</span>
                      </div>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                    <a 
                      href={selectedCandidate.portfolioUrl && selectedCandidate.portfolioUrl !== '#' ? selectedCandidate.portfolioUrl : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "border-2 border-slate-100 p-4 flex items-center justify-between group hover:border-black transition-all",
                        (!selectedCandidate.portfolioUrl || selectedCandidate.portfolioUrl === '#') ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      )}
                      onClick={(e) => (!selectedCandidate.portfolioUrl || selectedCandidate.portfolioUrl === '#') && e.preventDefault()}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Portfolio.link</span>
                      </div>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                  </div>
                </section>

                <div className="pt-6 border-t-2 border-slate-100 space-y-6">
                  {recruiterAssist && (
                    <div className="border-2 border-black p-4 bg-slate-50">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Aanbevolen volgende stap</div>
                      <div className="text-[10px] font-black uppercase tracking-tight">{recruiterAssist.nextStep}</div>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Status Update</label>
                      <AnimatePresence>
                        {statusUpdateSuccess && (
                          <motion.span 
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 italic"
                          >
                            <Check className="w-3 h-3" /> Opgeslagen!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <select 
                      value={selectedCandidate.status}
                      onChange={(e) => handleStatusChange(selectedCandidate.originalId, e.target.value)}
                      className={cn(
                        "w-full p-3 border-2 font-black uppercase tracking-widest text-[10px] outline-none transition-all cursor-pointer",
                        statusUpdateSuccess ? "border-emerald-500 bg-emerald-50" : "border-black focus:bg-slate-50"
                      )}
                    >
                      <option value="Nieuw">Nieuw (New)</option>
                      <option value="Screening">Screening</option>
                      <option value="Uitgenodigd">Uitgenodigd (Invited)</option>
                      <option value="Interview">Interview</option>
                      <option value="Afgewezen">Afgewezen (Rejected)</option>
                      <option value="Aangenomen">Aangenomen (Hired)</option>
                      <option value="Gearchiveerd">Gearchiveerd</option>
                    </select>
                    {!selectedCandidate.isReal && (
                      <p className="text-[8px] font-bold text-amber-600 uppercase mt-1 italic leading-tight">Note: Demo-kandidaten status kan niet permanent worden gewijzigd.</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {selectedCandidate.isReal ? (
                      <>
                        <button 
                          onClick={() => {
                            if (selectedCandidate.isReal) {
                              openInterviewModal();
                            } else {
                              setFeedbackMessage('Demo-kandidaat geselecteerd. In live modus opent hier de interview planner.');
                            }
                          }}
                          className="flex-1 bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                        >
                          Uitnodigen voor Gesprek
                        </button>
                        <button 
                          onClick={() => handleStatusChange(selectedCandidate.originalId, 'Rejected')}
                          className="px-8 border-2 border-slate-100 py-3 text-[10px] font-black uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all"
                        >
                          Afwijzen
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={openInterviewModal}
                          className="flex-1 bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all font-black"
                        >
                          Plan Interview
                        </button>
                        <button 
                          onClick={() => { setMessageDraft(''); setShowMessageModal(selectedCandidate); }}
                          className="px-8 border-2 border-slate-100 py-3 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all font-black"
                        >
                          Bericht
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] md:shadow-[24px_24px_0px_0px_rgba(59,130,246,1)] custom-scrollbar"
          >
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-blue-600 w-fit pb-2">Bedrijfsinstellingen</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Bedrijfsnaam</label>
                  <input name="name" required type="text" defaultValue={user?.name} className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold uppercase tracking-widest text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Logo URL</label>
                  <input name="avatar" type="text" defaultValue={user?.avatar} placeholder="https://..." className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Zakelijk E-mail</label>
                <input name="email" required type="email" defaultValue={user?.email} className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Beschrijving</label>
                <textarea name="companyDescription" required defaultValue={user?.companyDescription} className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold text-xs min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Locatie</label>
                  <input name="location" defaultValue={user?.location} className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold uppercase tracking-widest text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Telefoon</label>
                  <input name="phone" defaultValue={user?.phone} className="w-full p-4 border-2 border-slate-100 focus:border-black outline-none font-bold uppercase tracking-widest text-xs" />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                Opslaan
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMessageModal} />
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(37,99,235,1)] md:shadow-[24px_24px_0px_0px_rgba(37,99,235,1)] custom-scrollbar"
          >
            <button onClick={closeMessageModal} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-black text-blue-400 flex items-center justify-center text-xl font-black">{showMessageModal.name[0]}</div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">{showMessageModal.name}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Chat met kandidaat voor: {showMessageModal.role}</p>
              </div>
            </div>

            <div className="bg-slate-50 h-[250px] mb-6 p-4 border-2 border-slate-100 overflow-y-auto space-y-4">
              <div className="text-[8px] font-black text-center text-slate-400 uppercase tracking-widest mb-4">Start van gesprek</div>
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white p-3 rounded-lg text-[10px] font-bold max-w-[80%] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                   Beste {showMessageModal.name}, we hebben je applicatie ontvangen en willen graag een gesprek inplannen. Wanneer schikt het je?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white border-2 border-black p-3 rounded-lg text-[10px] font-bold max-w-[80%] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                   (Simulatie Antwoord) Dat klinkt goed! Ik ben morgenmiddag beschikbaar voor een call.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <input 
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="TYP JE BERICHT..." 
                className="flex-1 p-4 border-2 border-black font-bold text-xs uppercase tracking-widest outline-none focus:bg-slate-50"
              />
              <button 
                onClick={sendCandidateMessage}
                className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all"
              >
                Stuur
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedCandidate && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInterviewModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] md:shadow-[24px_24px_0px_0px_rgba(147,51,234,1)] custom-scrollbar"
          >
            <button onClick={() => setShowInterviewModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-purple-600 w-fit pb-2">Plan Interview</h3>
            
            <form onSubmit={handleInterviewSchedule} className="space-y-6">
              <div className="p-4 bg-slate-50 border-2 border-black mb-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Kandidaat</div>
                <div className="text-sm font-black uppercase tracking-tight">{selectedCandidate.name} — {selectedCandidate.role}</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest leading-none">Voorgestelde Momenten (Min. 1)</label>
                  {interviewData.slots.length < 3 && (
                    <button 
                      type="button" 
                      onClick={() => setInterviewData({...interviewData, slots: [...interviewData.slots, {date: '', time: ''}]})}
                      className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                    >
                      + extra slot
                    </button>
                  )}
                </div>
                
                {interviewData.slots.map((slot, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 relative group">
                    <div className="space-y-2">
                      <input 
                        required 
                        type="date" 
                        value={slot.date}
                        onChange={(e) => {
                          const newSlots = [...interviewData.slots];
                          newSlots[index].date = e.target.value;
                          setInterviewData({...interviewData, slots: newSlots});
                        }}
                        className="w-full p-3 border-2 border-black outline-none font-bold text-[10px]" 
                      />
                    </div>
                    <div className="space-y-2 flex gap-2 items-center">
                      <input 
                        required 
                        type="time" 
                        value={slot.time}
                        onChange={(e) => {
                          const newSlots = [...interviewData.slots];
                          newSlots[index].time = e.target.value;
                          setInterviewData({...interviewData, slots: newSlots});
                        }}
                        className="w-full p-3 border-2 border-black outline-none font-bold text-[10px]" 
                      />
                      {interviewData.slots.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newSlots = interviewData.slots.filter((_, i) => i !== index);
                            setInterviewData({...interviewData, slots: newSlots});
                          }}
                          className="text-red-500 hover:bg-red-50 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Type Gesprek</label>
                <div className="grid grid-cols-2 gap-4">
                   {['Online', 'Op Locatie'].map(t => (
                     <button 
                        key={t}
                        type="button"
                        onClick={() => setInterviewData({...interviewData, type: t})}
                        className={cn("p-4 border-2 font-black uppercase tracking-widest text-[10px] transition-all", interviewData.type === t ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black")}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Notitie voor Kandidaat</label>
                <textarea 
                  onChange={(e) => setInterviewData({...interviewData, note: e.target.value})}
                  placeholder="BIJV: NEEM JE ID-KAART MEE OF VERWACHT EEN LINK..."
                  className="w-full p-4 border-2 border-black outline-none font-bold text-xs min-h-[80px]"
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-4 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-all">
                Verstuur Uitnodiging
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Public Profile Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewMode(false)} />
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="bg-white w-full max-w-5xl h-[90vh] relative z-10 border-8 border-black flex flex-col overflow-hidden"
           >
              <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 text-black px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] animate-pulse">PREVIEW MODE — ZO ZIEN KANDIDATEN JULLIE</div>
                 </div>
                 <button onClick={() => setPreviewMode(false)} className="bg-white text-black p-2 hover:bg-red-500 hover:text-white transition-all">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50">
                 {/* Hero Section */}
                 <div className="bg-white border-b-8 border-black p-12 md:p-20 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto relative z-10">
                       <div className="w-24 h-24 bg-black text-blue-400 flex items-center justify-center text-5xl font-black mb-10 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] relative overflow-hidden">
                          {user?.avatar ? (
                            <Image 
                              src={user.avatar} 
                              alt="logo" 
                              fill 
                              className="object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (user?.name?.[0] || 'S')}
                       </div>
                       <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] italic mb-8">
                          {user?.name || 'Bedrijfsnaam'}
                       </h1>
                       <div className="flex flex-wrap gap-4">
                          <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest italic">{user?.location || 'Paramaribo, Suriname'}</span>
                          <span className="border-4 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest italic">{user?.sector || 'Technologie & IT'}</span>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 transform translate-x-1/2" />
                 </div>

                 {/* Content */}
                 <div className="max-w-4xl mx-auto p-12 md:p-20 grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-12">
                       <section>
                          <h2 className="text-2xl font-black uppercase tracking-tight italic mb-8 border-b-4 border-blue-600 w-fit pb-1">Over Ons</h2>
                          <div className="text-lg font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                             {user?.companyDescription || 'Geen beschrijving beschikbaar. Update je profiel om dit aan te passen.'}
                          </div>
                       </section>

                       <section>
                          <h2 className="text-2xl font-black uppercase tracking-tight italic mb-8 border-b-4 border-blue-600 w-fit pb-1">Openstaande Posities</h2>
                          <div className="grid gap-4">
                             {myJobs.map(job => (
                               <div key={job.id} className="bg-white border-4 border-black p-6 hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] transition-all group flex justify-between items-center cursor-pointer">
                                  <div>
                                     <h3 className="text-lg font-black uppercase tracking-tighter group-hover:text-blue-600">{job.title}</h3>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{job.location} • {job.salary}</div>
                                  </div>
                                  <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-black text-white p-8 border-l-8 border-blue-600 shadow-[12px_12px_0px_0px_rgba(59,130,246,0.3)]">
                          <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic opacity-60 italic">Bedrijfsgegevens</h3>
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{user?.email || 'Niet opgegeven'}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{user?.phone || 'Niet opgegeven'}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Opgericht in 2024</span>
                             </div>
                          </div>
                          <Link
                            href={user?.name ? `/bedrijven/${encodeURIComponent(user.name)}` : '/bedrijven'}
                            className="block w-full mt-8 bg-blue-600 text-white py-4 text-center font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                          >
                             Bekijk Bedrijfsprofiel
                          </Link>
                       </div>

                       <div className="bg-white border-4 border-black p-8">
                          <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic text-slate-400">Onze Cultuur Vibe</h3>
                          <div className="flex flex-wrap gap-2">
                             {['Innovatief', 'Direct', 'Sociaal', 'Resultaatgericht'].map(tag => (
                               <span key={tag} className="bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-widest">{tag}</span>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
      {/* Stat Details Modal */}
      {showStatModal && selectedStat && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStatModal(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border-8 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] custom-scrollbar"
          >
            <button onClick={() => setShowStatModal(false)} className="absolute top-4 right-4 bg-black text-white p-2 hover:bg-red-500 transition-all">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center">
                <selectedStat.icon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic">{selectedStat.title}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deep Dive Analyse</p>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-600 mb-10 leading-relaxed">
              {selectedStat.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {selectedStat.data.map((item: any, i: number) => (
                <div key={i} className="bg-slate-50 border-2 border-slate-100 p-4">
                  <div className="text-[9px] font-black uppercase text-slate-400 mb-2 truncate">{item.label}</div>
                  <div className="text-2xl font-black tracking-tighter">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-8 border-blue-600 p-6">
              <div className="flex gap-4 items-start">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">AI Insights</h4>
                  <p className="text-xs font-bold text-blue-800 leading-relaxed italic">
                    {selectedStat.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t-2 border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowStatModal(false)}
                className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
              >
                Sluiten
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Premium Plans Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPremiumModal(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden relative z-10 border-4 md:border-8 border-black flex flex-col md:flex-row shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[32px_32px_0px_0px_rgba(0,0,0,1)]"
          >
            <button onClick={() => setShowPremiumModal(false)} className="absolute top-2 right-2 md:top-4 md:right-4 z-50 bg-black text-white p-2 hover:bg-red-500 transition-all">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Sidebar / Info */}
            <div className="w-full md:w-[32%] lg:w-1/3 bg-slate-900 p-6 md:p-10 lg:p-12 text-white flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0 md:overflow-y-auto max-h-[30vh] md:max-h-none">
              <div className="mb-4 md:mb-0">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-600 flex items-center justify-center mb-4 md:mb-8 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)]">
                  <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter italic leading-none mb-2 md:mb-6">Upgrade naar <br className="hidden lg:block"/><span className="text-blue-400 font-black italic uppercase">Enterprise</span></h3>
                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-slate-400 leading-relaxed italic line-clamp-2 md:line-clamp-none">
                  Ontgrendel de volledige kracht van SuriJobs+ en schaal je recruitment proces naar een hoger niveau in Suriname.
                </p>
              </div>

              <div className="hidden md:block space-y-4">
                <div className="p-3 md:p-4 border-l-4 border-blue-600 bg-blue-600/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Status</p>
                  <p className="text-md md:text-lg font-black uppercase tracking-tight">Active User</p>
                </div>
              </div>
            </div>

            {/* Plans Content */}
            <div className="flex-1 p-4 md:p-10 lg:p-12 bg-white overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar">
              <div className="max-w-2xl w-full">
                {/* Single Pro Plan */}
                <div className="border-4 md:border-8 border-black p-4 md:p-8 lg:p-10 flex flex-col relative overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] md:shadow-[24px_24px_0px_0px_rgba(59,130,246,1)]">
                   <div className="absolute -right-12 top-6 md:top-8 bg-blue-600 text-white px-12 py-1 md:py-2 rotate-45 text-[7px] md:text-[10px] font-black uppercase tracking-widest z-10">Premium</div>
                   
                   <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-8 gap-2 md:gap-4">
                     <div>
                       <h4 className="text-lg md:text-2xl lg:text-3xl font-black uppercase tracking-tighter mb-1">Enterprise</h4>
                       <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">De ultieme suite voor Suriname</p>
                     </div>
                     <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                       <div className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-none mb-1 text-black">USD 199</div>
                       <div className="text-[7px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">per maand / per team</div>
                     </div>
                   </div>

                   <div className="text-[9px] md:text-[12px] font-black text-blue-600 bg-blue-50 px-3 md:px-4 py-1.5 md:py-2 mb-4 md:mb-8 w-fit uppercase italic shadow-[2px_2px_0px_0px_rgba(59,130,246,0.2)] md:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)]">
                     7 Dagen Gratis Proeverij
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-10 gap-y-2 md:gap-y-3 mb-6 md:mb-10">
                      {[
                        'Onbeperkt Vacatures', 
                        'Gemini Ultra AI Matching', 
                        'WhatsApp Business API',
                        'HD Video Interviews', 
                        'Custom Branding',
                        'Dedicated Support',
                        'Excel Rapportages',
                        'API & Webhook Toegang'
                      ].map(f => (
                        <div key={f} className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-widest list-none">
                           <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-emerald-500 shrink-0" /> <span className="truncate">{f}</span>
                        </div>
                      ))}
                   </div>

                   <button 
                     onClick={() => {
                        const updatedUser = { ...user, plan: 'Enterprise', trialActive: true, trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
                        writeJson('suri_user', updatedUser);
                        setUser(updatedUser);
                        setFeedbackMessage('Je 7-daagse Enterprise proefperiode is geactiveerd.');
                        setShowPremiumModal(false);
                     }}
                     className="w-full bg-black text-white py-4 md:py-5 lg:py-6 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.3em] hover:bg-blue-600 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] md:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]"
                   >
                     Mijn Trial Starten
                   </button>

                   <p className="text-center mt-3 md:mt-6 text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                     Geen creditcard nodig &middot; Annuleer elk moment
                   </p>
                </div>

                <div className="mt-8 md:mt-12 p-3 md:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between border-2 md:border-4 border-black w-full gap-3 md:gap-4 mb-8 md:mb-0">
                   <div className="flex items-center gap-3 md:gap-6">
                     <div className="p-2 md:p-3 bg-blue-600 border border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] md:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
                       <Clock className="w-4 h-4 md:w-6 md:h-6 text-white" />
                     </div>
                     <p className="text-[7px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest leading-relaxed">
                       Ready to scale? <span className="text-blue-400 italic">Activeer nu</span> <br className="hidden sm:block"/>
                       of mail sales@surijobs.sr
                     </p>
                   </div>
                   <button 
                    onClick={() => setShowPremiumModal(false)}
                    className="text-[7px] md:text-[9px] font-black uppercase tracking-widest border-2 border-white/20 px-3 md:px-4 py-1.5 md:py-2 hover:bg-white hover:text-black transition-all w-full sm:w-auto"
                   >
                     Dashboard
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showBillingModal && (
        <div className="fixed inset-0 z-[205] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBillingModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl relative z-10 border-4 border-black p-6 md:p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setShowBillingModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Billing & Plan</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="border-2 border-black p-4 bg-slate-50">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Actief Plan</div>
                <div className="text-xl font-black uppercase tracking-tight">{user?.plan || 'Starter'}</div>
              </div>
              <div className="border-2 border-black p-4 bg-slate-50">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Actieve Vacatures</div>
                <div className="text-xl font-black uppercase tracking-tight">{myJobs.length}</div>
              </div>
              <div className="border-2 border-black p-4 bg-slate-50">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Kandidaten Export</div>
                <div className="text-xl font-black uppercase tracking-tight">{filteredCandidates.length}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="border-2 border-black p-4 bg-white">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Factuurcyclus</div>
                <select
                  value={billingState.cycle}
                  onChange={(e) => setBillingState((prev: any) => ({ ...prev, cycle: e.target.value }))}
                  className="w-full border-2 border-black p-3 text-[10px] font-black uppercase tracking-widest bg-white"
                >
                  <option>Maandelijks</option>
                  <option>Jaarlijks</option>
                </select>
              </div>
              <div className="border-2 border-black p-4 bg-white">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Method</div>
                <input
                  value={billingState.paymentMethod}
                  onChange={(e) => setBillingState((prev: any) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border-2 border-black p-3 text-[10px] font-black uppercase tracking-widest"
                />
              </div>
              <div className="border-2 border-black p-4 bg-white">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Invoice Email</div>
                <input
                  value={billingState.invoiceEmail || user?.email || ''}
                  onChange={(e) => setBillingState((prev: any) => ({ ...prev, invoiceEmail: e.target.value }))}
                  className="w-full border-2 border-black p-3 text-[10px] font-black tracking-tight"
                />
              </div>
            </div>

            <div className="border-2 border-black p-6 mb-8 bg-white">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gebruik deze cyclus</div>
                <div className="text-[10px] font-black uppercase tracking-widest">{myJobs.length} / {billingState.usageLimit} vacatures</div>
              </div>
              <div className="h-3 border-2 border-black bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min(100, Math.round((myJobs.length / Math.max(1, billingState.usageLimit)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="border-2 border-black p-6 mb-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Recente facturen</div>
              <div className="space-y-3">
                {billingState.invoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between border border-slate-100 p-3 bg-slate-50">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{invoice.id}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{invoice.period}</div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{invoice.amount}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{invoice.status}</span>
                      <button
                        onClick={() => downloadInvoice(invoice.id)}
                        className="border-2 border-black px-3 py-1 text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => { setShowBillingModal(false); setShowPremiumModal(true); }} className="bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Upgrade Plan</button>
              <button onClick={() => setFeedbackMessage('Factuuroverzicht bijgewerkt.')} className="border-2 border-black py-4 font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Ververs Overzicht</button>
            </div>
          </motion.div>
        </div>
      )}

      {showApiModal && (
        <div className="fixed inset-0 z-[205] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowApiModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl relative z-10 border-4 border-black p-6 md:p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setShowApiModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8">API Management</h3>
            <div className="border-2 border-black p-5 bg-slate-50 mb-6">
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Webhook endpoint</div>
              <div className="text-[10px] font-black uppercase tracking-widest break-all">/api/webhooks/surijobs</div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={copyWebhookEndpoint} className="bg-black text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Kopieer endpoint</button>
                <button onClick={sendTestWebhook} className="border-2 border-black px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Verstuur test event</button>
                <button onClick={rotateApiSecret} className="border-2 border-black px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Roteer secret</button>
              </div>
            </div>

            <div className="grid gap-4 mb-6">
              {[
                ['webhooksEnabled', 'Webhooks actief'],
                ['candidateEvents', 'Kandidaat events'],
                ['jobEvents', 'Vacature events'],
                ['teamEvents', 'Team events'],
              ].map(([key, label]) => (
                <div key={key} className="flex justify-between items-center p-4 border-2 border-black bg-white">
                  <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                  <button
                    type="button"
                    aria-pressed={Boolean(apiSettings[key as keyof typeof apiSettings])}
                    onClick={() => setApiSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                    className={cn("w-12 h-6 border-2 border-black relative", apiSettings[key as keyof typeof apiSettings] ? "bg-emerald-500" : "bg-slate-200")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 bg-black transition-all", apiSettings[key as keyof typeof apiSettings] ? "right-0.5" : "left-0.5")} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-2 border-dashed border-slate-200 p-5 mb-6">
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Server keys</div>
              <p className="text-xs font-bold text-slate-600 mb-3">API secrets worden backend-only beheerd en zijn daarom niet zichtbaar in deze client. Dit voorkomt het lekken van credentials op de frontend.</p>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actieve signing key</div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-widest">{apiSecretMeta.label}</div>
              <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Laatste rotatie: {new Date(apiSecretMeta.rotatedAt).toLocaleString('nl-NL')}</div>
            </div>

            <div className="border-2 border-black p-5 mb-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Webhook Delivery Log</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">{webhookEvents.length} events</div>
              </div>
              <div className="space-y-3">
                {webhookEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between border border-slate-100 p-3 bg-slate-50">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{event.type}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{event.id} • {event.time}</div>
                    </div>
                    <div className={cn("text-[8px] font-black uppercase tracking-widest px-3 py-1 border-2", event.status === 'Delivered' ? "border-emerald-500 text-emerald-600 bg-emerald-50" : event.status === 'Blocked' ? "border-red-500 text-red-600 bg-red-50" : "border-yellow-500 text-yellow-700 bg-yellow-50")}>
                      {event.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setShowApiModal(false); setFeedbackMessage('API voorkeuren opgeslagen.'); }} className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Opslaan</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
