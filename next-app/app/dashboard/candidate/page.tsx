'use client';

import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  TrendingUp, 
  Star,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Zap,
  Sparkles,
  Bookmark,
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  UploadCloud,
  Loader2,
  AlertTriangle,
  Target,
  Edit2,
  Trash2,
  Plus,
  X,
  Mail,
  Phone,
  Shield,
  Globe,
  Languages,
  Award,
  MoreVertical,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { isValidPhone } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';
import { analyzeCandidateProfile, buildMatchInsights, type CvInsights } from '@/lib/ai';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';
import { ChartFrame } from '@/components/ChartFrame';

const generateRoadmapMarkdown = (user: any) => `# 6-Maanden Groeiplan

## Maand 1-2
- Werk je profiel helemaal bij met functietitel, bio, skills en locatie.
- Kies 1 certificaat of training die direct past bij ${user?.sector || 'je vakgebied'}.
- Solliciteer gericht op functies die aansluiten bij ${user?.title || 'je volgende rol'}.

## Maand 3-4
- Bouw bewijs op: projecten, resultaten of portfolio-items.
- Vraag feedback op je CV en sollicitaties.
- Breid je netwerk uit met 5 relevante contacten of bedrijven.

## Maand 5-6
- Richt je op beter betalende functies of meer verantwoordelijkheid.
- Oefen interviews met praktijkvoorbeelden uit je werk.
- Evalueer welke skill je het meeste resultaat heeft opgeleverd en verdiep die verder.

## Focus
Blijf je profiel actief verbeteren; dat vergroot je matchkans het snelst.`;

const DATA = [
  { name: 'Ma', views: 40 },
  { name: 'Di', views: 30 },
  { name: 'Wo', views: 65 },
  { name: 'Do', views: 45 },
  { name: 'Vr', views: 90 },
  { name: 'Za', views: 25 },
  { name: 'Zo', views: 35 },
];

const DEFAULT_APPLICATIONS = [
  { id: 1, company: 'Finabank', title: 'Marketing Lead', status: 'In Review', date: '12 Apr' },
  { id: 2, company: 'Telesur', title: 'UX Designer', status: 'Interview', date: '10 Apr' },
  { id: 3, company: 'SuriTech', title: 'DevOps Engineer', status: 'Rejected', date: '08 Apr' },
];

const STATIC_JOBS = [
  { id: 1, title: 'Senior Software Engineer', company: 'Telesur', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 35.000+', verified: true, match: 98, sector: 'Tech' },
  { id: 2, title: 'Marketing Coordinator', company: 'Finabank', location: 'Paramaribo', type: 'Full-time', salary: 'SRD 12.000+', verified: true, match: 85, sector: 'Finance' },
  { id: 3, title: 'Project Manager Mining', company: 'IAMGOLD', location: 'Brokopondo', type: 'Projectbasis', salary: 'USD 3.500+', verified: true, match: 92, sector: 'Mining' },
  { id: 4, title: 'Sales Consultant', company: 'Kuldipsingh', location: 'Wanica', type: 'Full-time', salary: 'Market-conform', verified: false, match: 74, sector: 'Industry' },
  { id: 5, title: 'Operationeel Manager', company: 'Staatsolie', location: 'Saramacca', type: 'Full-time', salary: 'Bespreekbaar', verified: true, match: 89, sector: 'Energy' },
];

const DEFAULT_CERTIFICATES = [
  { id: 1, name: 'SuriTech Advanced React', date: 'Maart 2026', issuer: 'SuriTech Academy' },
  { id: 2, name: 'Google Cloud Professional', date: 'Januari 2026', issuer: 'Google' }
];

const DEFAULT_EXPERIENCE = [
  { id: 1, role: 'Junior Software Developer', company: 'Telesur', duration: '2023 - Heden' },
  { id: 2, role: 'Stage Web Development', company: 'SuriTech', duration: '2022 - 2023' }
];

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailMatch: true,
  browserNotif: true,
  marketing: false
};

function getNextLocalId(items: Array<{ id?: number }>) {
  const maxId = items.reduce((highest, item) => {
    const current = typeof item.id === 'number' ? item.id : 0;
    return current > highest ? current : highest;
  }, 0);
  return maxId + 1;
}

export default function CandidateDashboard() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, text: 'Telesur heeft je CV bekeken', date: '2u geleden', read: false },
    { id: 2, text: 'Nieuwe match gevonden: Frontend Developer bij Staatsolie', date: '5u geleden', read: true },
    { id: 3, text: 'Je CV analyse is voltooid', date: '1d geleden', read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [certificates, setCertificates] = useState<any[]>([]);

  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [editFormData, setEditFormData] = useState<any>({
    name: '',
    title: '',
    phone: '',
    location: '',
    bio: '',
    sector: 'Tech',
    experience: 'Junior',
    skills: ''
  });

  const [showCVModal, setShowCVModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [analyzingCV, setAnalyzingCV] = useState(false);
  const [cvAnalysis, setCvAnalysis] = useState<string | null>(null);
  const [cvInsights, setCvInsights] = useState<CvInsights | null>(() => readJson<CvInsights | null>('suri_cv_insights', null));
  const [cvText, setCvText] = useState('');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [applicationFilters, setApplicationFilters] = useState({ status: 'Alle', query: '' });
  const [learningProgress, setLearningProgress] = useState<Record<string, 'not-started' | 'in-progress' | 'done'>>(
    () => readJson('suri_learning_progress', {})
  );
  const [visibilityBoost, setVisibilityBoost] = useState(() =>
    readJson('suri_visibility_boost', {
      enabled: false,
      plan: 'Standaard',
      expiresAt: '',
    })
  );
  const [profileProgress, setProfileProgress] = useState({
    personal: 0,
    experience: 0,
    skills: 0,
    documents: 20
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [certErrors, setCertErrors] = useState<Record<string, string>>({});
  const [expErrors, setExpErrors] = useState<Record<string, string>>({});
  const editProfileRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const applicationsRef = useRef<HTMLDivElement>(null);
  const learningRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  const closeEditProfileModal = () => {
    if (isUpdatingProfile) return;
    setShowEditProfile(false);
  };

  const closeCertModal = () => {
    if (isAddingCert) return;
    setShowCertModal(false);
  };

  const closeExpModal = () => {
    if (isAddingExp) return;
    setShowExpModal(false);
  };

  const closeMessageModal = () => {
    setActiveMessage(null);
    setReplyDraft('');
  };

  useFocusTrap(showEditProfile, editProfileRef);
  useFocusTrap(showCertModal, certRef);
  useFocusTrap(showExpModal, expRef);
  useFocusTrap(showSettingsModal, settingsRef);
  useFocusTrap(showCVModal, cvRef);
  useFocusTrap(showRoadmapModal, roadmapRef);
  useFocusTrap(showApplicationsModal, applicationsRef);
  useFocusTrap(showLearningModal, learningRef);
  useFocusTrap(showVisibilityModal, visibilityRef);
  useDismissibleLayer(showEditProfile && !isUpdatingProfile, editProfileRef, closeEditProfileModal);
  useDismissibleLayer(showCertModal && !isAddingCert, certRef, closeCertModal);
  useDismissibleLayer(showExpModal && !isAddingExp, expRef, closeExpModal);
  useDismissibleLayer(showSettingsModal, settingsRef, () => setShowSettingsModal(false));
  useDismissibleLayer(showCVModal && !analyzingCV, cvRef, () => setShowCVModal(false));
  useDismissibleLayer(showRoadmapModal && !generatingRoadmap, roadmapRef, () => setShowRoadmapModal(false));
  useDismissibleLayer(showApplicationsModal, applicationsRef, () => setShowApplicationsModal(false));
  useDismissibleLayer(showLearningModal, learningRef, () => setShowLearningModal(false));
  useDismissibleLayer(showVisibilityModal, visibilityRef, () => setShowVisibilityModal(false));

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!editFormData?.name?.trim()) nextErrors.name = 'Naam is verplicht.';
    if (!editFormData?.title?.trim()) nextErrors.title = 'Functietitel is verplicht.';
    if (editFormData?.phone && !isValidPhone(editFormData.phone)) nextErrors.phone = 'Voer een geldig telefoonnummer in.';
    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors);
      return;
    }
    setProfileErrors({});
    setIsUpdatingProfile(true);
    setTimeout(() => {
      const updated = { ...user, ...editFormData };
      writeJson('suri_user', updated);
      setUser(updated);
      setEditFormData(updated);
      setIsUpdatingProfile(false);
      setShowEditProfile(false);
      setFeedbackMessage('Profiel succesvol bijgewerkt.');
      refreshDashboardState();
    }, 800);
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameInput = form.elements.namedItem('cert_name') as HTMLInputElement;
    const issuerInput = form.elements.namedItem('cert_issuer') as HTMLInputElement;
    
    const nextErrors: Record<string, string> = {};
    if (!nameInput.value.trim()) nextErrors.name = 'Naam van certificaat is verplicht.';
    if (!issuerInput.value.trim()) nextErrors.issuer = 'Uitgevende instantie is verplicht.';
    if (Object.keys(nextErrors).length > 0) {
      setCertErrors(nextErrors);
      return;
    }
    setCertErrors({});
    setIsAddingCert(true);

    const newCert = { id: getNextLocalId(certificates), name: nameInput.value, issuer: issuerInput.value, date: 'Recent' };
    const updated = [...certificates, newCert];
    setCertificates(updated);
    writeJson('suri_certificates', updated);
    form.reset();
    setFeedbackMessage('Certificaat toegevoegd.');
    setIsAddingCert(false);
    setShowCertModal(false);
    refreshDashboardState();
    
    // Also update profile score
    if (user) {
        setProfileProgress(prev => ({ ...prev, documents: 100 }));
    }
  };

  const deleteCert = (id: number) => {
    const updated = certificates.filter(c => c.id !== id);
    setCertificates(updated);
    writeJson('suri_certificates', updated);
    setFeedbackMessage('Certificaat verwijderd.');
    refreshDashboardState();
  };

  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [notificationsSettings, setNotificationsSettings] = useState(() => {
    return {
      ...readJson('suri_notification_settings', DEFAULT_NOTIFICATION_SETTINGS)
    };
  });

  const toggleNotification = (key: keyof typeof notificationsSettings) => {
    const updated = { ...notificationsSettings, [key]: !notificationsSettings[key] };
    setNotificationsSettings(updated);
    writeJson('suri_notification_settings', updated);
    setFeedbackMessage('Meldingsvoorkeuren bijgewerkt.');
  };

  const refreshDashboardState = useCallback(() => {
    const updatedUser = readJson<any>('suri_user', null);
    const storedApplications = readJson<any[]>('suri_applications', DEFAULT_APPLICATIONS);
    const storedCertificates = readJson<any[]>('suri_certificates', DEFAULT_CERTIFICATES);
    const storedExperience = readJson<any[]>('suri_experience_history', DEFAULT_EXPERIENCE);
    const storedNotificationSettings = readJson('suri_notification_settings', DEFAULT_NOTIFICATION_SETTINGS);
    const storedInsights = readJson<CvInsights | null>('suri_cv_insights', null);
    const savedJobIds = readJson<number[]>('suri_saved_jobs', []);
    const storedJobs = readJson<any[]>('suri_jobs', []);
    const allJobs = [...storedJobs, ...STATIC_JOBS];

    setUser(updatedUser);
    setEditFormData(updatedUser || {
      name: '',
      title: '',
      phone: '',
      location: '',
      bio: '',
      sector: 'Tech',
      experience: 'Junior',
      skills: ''
    });
    setApplications(storedApplications);
    setCertificates(storedCertificates);
    setWorkExperience(storedExperience);
    setNotificationsSettings(storedNotificationSettings);
    setCvInsights(storedInsights);
    setSavedJobs(allJobs.filter((job) => savedJobIds.includes(job.id)));

    const availableMatches = allJobs.filter((job) => {
      const isSaved = savedJobIds.includes(job.id);
      const isApplied = storedApplications.some((application) => {
        const sameJobId = application.jobId != null && String(application.jobId) === String(job.id);
        const sameTitleCompany = application.title === job.title && application.company === job.company;
        return sameJobId || sameTitleCompany;
      });
      return !isSaved && !isApplied;
    });

    const nextMatches = buildMatchInsights(updatedUser || {}, storedInsights, availableMatches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setMatchedJobs(
      availableMatches
        .filter((job) => nextMatches.some((item) => String(item.jobId) === String(job.id)))
        .map((job) => {
          const insight = nextMatches.find((item) => String(item.jobId) === String(job.id));
          return insight
            ? { ...job, match: insight.score, aiSummary: insight.summary, aiStrengths: insight.strengths, aiGaps: insight.gaps }
            : job;
        })
        .sort((a, b) => b.match - a.match)
    );

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const calculateProgress = () => {
      if (!user) return;
      const personalFields = ['name', 'location', 'phone', 'bio', 'title'];
      const experienceFields = ['sector', 'experience'];
      
      const calcSection = (fields: string[]) => {
        const filled = fields.filter(f => user[f] && String(user[f]).trim().length > 0).length;
        return Math.round((filled / fields.length) * 100);
      };

      setProfileProgress({
        personal: calcSection(personalFields),
        experience: calcSection(experienceFields),
        skills: (user.skills && user.skills.length > 0) ? 100 : 0,
        documents: (user.cvParsed || (certificates && certificates.length > 0) || workExperience.length > 0) ? 100 : 40
      });
    };

    calculateProgress();
  }, [user, workExperience.length, certificates]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    if (!user.onboarded) {
      router.push('/onboarding');
    }
  }, [isHydrated, router, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('suri_applications')) {
      writeJson('suri_applications', DEFAULT_APPLICATIONS);
    }

    const handleStorage = () => {
      refreshDashboardState();
    };

    handleStorage();

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshDashboardState]);

  const handleGenerateRoadmap = async () => {
    setGeneratingRoadmap(true);
    setRoadmap(null);
    setShowRoadmapModal(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setRoadmap(generateRoadmapMarkdown(user));
    } catch {
      setRoadmap("Er is een fout opgetreden bij het genereren van je roadmap.");
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const [extractedData, setExtractedData] = useState<any>(null);

  const handleCVAnalysis = async () => {
    if (!cvText.trim() && !analyzingCV) return;
    
    setAnalyzingCV(true);
    setCvAnalysis(null);
    setExtractedData(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const analysis = analyzeCandidateProfile(cvText, user?.sector || 'General', user || {});
      setCvInsights(analysis);
      setCvAnalysis(analysis.markdown);
      setExtractedData(analysis.extracted);
      writeJson('suri_cv_insights', analysis);
      
      if (user) {
        const updated = { ...user, cvParsed: true };
        writeJson('suri_user', updated);
        setUser(updated);
      }
      refreshDashboardState();
    } catch {
      setCvAnalysis("De AI kon je CV momenteel niet analyseren. Probeer het later opnieuw.");
    } finally {
      setAnalyzingCV(false);
    }
  };

  const applyExtractedData = () => {
    if (!extractedData || !user) return;
    const updated = {
      ...user,
      ...extractedData,
      skills: Array.isArray(extractedData.skills) ? extractedData.skills.join(', ') : extractedData.skills
    };
    writeJson('suri_user', updated);
    setUser(updated);
    setEditFormData(updated);
    setFeedbackMessage('Jouw profiel is geüpdatet met de gegevens uit je CV.');
    setShowCVModal(false);
    setCvAnalysis(null);
    setExtractedData(null);
    refreshDashboardState();
  };

  const handleAddWorkExp = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const roleInput = form.elements.namedItem('exp_role') as HTMLInputElement;
    const companyInput = form.elements.namedItem('exp_company') as HTMLInputElement;
    const durationInput = form.elements.namedItem('exp_duration') as HTMLInputElement;
    
    const nextErrors: Record<string, string> = {};
    if (!roleInput.value.trim()) nextErrors.role = 'Functie is verplicht.';
    if (!companyInput.value.trim()) nextErrors.company = 'Bedrijf is verplicht.';
    if (!durationInput.value.trim()) nextErrors.duration = 'Periode is verplicht.';
    if (Object.keys(nextErrors).length > 0) {
      setExpErrors(nextErrors);
      return;
    }
    setExpErrors({});
    setIsAddingExp(true);
    
    const newExp = { id: getNextLocalId(workExperience), role: roleInput.value, company: companyInput.value, duration: durationInput.value };
    const updated = [newExp, ...workExperience];
    writeJson('suri_experience_history', updated);
    setWorkExperience(updated);
    form.reset();
    setFeedbackMessage('Werkervaring toegevoegd.');
    setIsAddingExp(false);
    setShowExpModal(false);
    refreshDashboardState();
  };

  const removeSavedJob = (id: number) => {
    const updated = readJson<number[]>('suri_saved_jobs', []).filter((jId: number) => jId !== id);
    writeJson('suri_saved_jobs', updated);
    setSavedJobs((prev) => prev.filter((job) => job.id !== id));
    setFeedbackMessage('Vacature verwijderd uit opgeslagen lijst.');
    refreshDashboardState();
  };

  const learningRecommendations = (() => {
    if (cvInsights?.skillGaps.length) {
      return cvInsights.skillGaps.slice(0, 3).map((gap, index) => ({
        id: `gap-${index}-${gap.toLowerCase().replace(/\s+/g, '-')}`,
        title: gap,
        reason: `Deze skill kwam als verbeterpunt naar voren in je CV-analyse voor ${user?.sector || 'je profiel'}.`,
        gain: `+${Math.max(8, 18 - index * 3)}% match`,
        duration: index === 0 ? '3 weken' : '2 weken',
      }));
    }

    const base = [
      {
        id: 'react-native',
        title: 'React Native Fundamentals',
        reason: 'Vergroot je inzetbaarheid voor mobile en frontend rollen.',
        gain: '+15% match',
        duration: '4 weken',
      },
      {
        id: 'project-management',
        title: 'Project Management Essentials',
        reason: 'Handig voor cooerdinatie, ownership en doorgroei naar lead-rollen.',
        gain: '+22% match',
        duration: '6 weken',
      },
      {
        id: 'labour-law',
        title: 'Surinaamse Arbeidswet in de Praktijk',
        reason: 'Geeft je voorsprong in HR, operations en management functies.',
        gain: '+8% match',
        duration: '2 weken',
      },
    ];

    if ((user?.sector || '').toLowerCase().includes('finance')) {
      return [
        {
          id: 'excel-finance',
          title: 'Excel for Finance',
          reason: 'Versterk je rapportage- en analysekracht in finance teams.',
          gain: '+18% match',
          duration: '3 weken',
        },
        ...base.slice(1),
      ];
    }

    return base;
  })();

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const statusMatch = applicationFilters.status === 'Alle' || application.status === applicationFilters.status;
      const query = applicationFilters.query.trim().toLowerCase();
      const queryMatch =
        query.length === 0 ||
        `${application.company} ${application.title || application.position || ''}`.toLowerCase().includes(query);
      return statusMatch && queryMatch;
    });
  }, [applicationFilters, applications]);

  const updateLearningStatus = (id: string, status: 'not-started' | 'in-progress' | 'done') => {
    const updated = { ...learningProgress, [id]: status };
    setLearningProgress(updated);
    writeJson('suri_learning_progress', updated);
    setFeedbackMessage(status === 'done' ? 'Leerpunt afgerond.' : 'Leerpunt bijgewerkt.');
  };

  const activateVisibilityBoost = (plan: 'Standaard' | 'Priority' | 'Premium') => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const expiresAt = expiryDate.toISOString();
    const updated = { enabled: true, plan, expiresAt };
    setVisibilityBoost(updated);
    writeJson('suri_visibility_boost', updated);
    setFeedbackMessage(`Zichtbaarheidsboost geactiveerd: ${plan}.`);
    setShowVisibilityModal(false);
  };

  const disableVisibilityBoost = () => {
    const updated = { enabled: false, plan: 'Standaard', expiresAt: '' };
    setVisibilityBoost(updated);
    writeJson('suri_visibility_boost', updated);
    setFeedbackMessage('Zichtbaarheidsboost uitgeschakeld.');
  };

  const sendApplicationReply = () => {
    if (!replyDraft.trim()) {
      setFeedbackMessage('Typ eerst een bericht voordat je het verstuurt.');
      return;
    }
    setFeedbackMessage('Bericht verzonden.');
    closeMessageModal();
  };

  const calculateTotalProgress = () => {
    const values = Object.values(profileProgress);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {feedbackMessage && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center justify-between gap-4">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage('')} className="text-emerald-700 hover:text-black">Sluit</button>
          </div>
        )}
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter">Welkom, <span className="text-blue-600 italic">{user?.name?.split(' ')[0] || 'Jurgen'}</span></h1>
              <div className="bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black -rotate-2 brutal-shadow italic">Verified Identity</div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" /> Laatst ingelogd: zojuist vanuit {user?.location || 'Paramaribo'}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "bg-white border-2 border-black p-3 hover:bg-slate-50 transition-colors relative brutal-shadow",
                  showNotifications && "bg-slate-100"
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-black flex items-center justify-center border border-black animate-bounce">
                    {notifications.filter(n => !n.read).length}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-72 bg-white border-4 border-black z-50 brutal-shadow-lg"
                  >
                    <div className="p-4 border-b-2 border-black flex justify-between items-center bg-slate-50">
                       <span className="text-[10px] font-black uppercase tracking-widest">Meldingen</span>
                       <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} className="text-[8px] font-black uppercase text-blue-600 hover:underline">Markeer als gelezen</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                       {notifications.map(n => (
                         <div key={n.id} className={cn("p-4 border-b border-slate-100 flex gap-3 hover:bg-slate-50 transition-colors", !n.read && "bg-blue-50/50")}>
                            <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", !n.read ? "bg-blue-600" : "bg-slate-200")} />
                            <div>
                               <p className="text-[10px] font-bold text-slate-800 leading-tight mb-1">{n.text}</p>
                               <p className="text-[8px] font-black text-slate-400 uppercase">{n.date}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
               onClick={() => setShowSettingsModal(true)}
               className="bg-white border-2 border-black p-3 hover:bg-slate-50 transition-colors brutal-shadow"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setShowCVModal(true)}
              className="brutal-button-primary"
            >
              Update CV
            </button>
          </div>
        </div>

        {/* Roadmap Modal */}
        <AnimatePresence>
          {showRoadmapModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !generatingRoadmap && setShowRoadmapModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                ref={roadmapRef}
                role="dialog"
                aria-modal="true"
                aria-label="Carriere roadmap"
                className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto relative z-10 border-4 border-black shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] md:shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] p-6 md:p-12 custom-scrollbar"
              >
                <button 
                  onClick={() => setShowRoadmapModal(false)}
                  disabled={generatingRoadmap}
                  aria-label="Sluit carriere roadmap"
                  className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">AI Career Roadmap</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-12">Plan je toekomst in de {user?.sector || 'professionele'} markt van Suriname</p>
                </div>

                <div className="space-y-8">
                  {generatingRoadmap ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse italic">We stellen je carrierepad samen...</p>
                    </div>
                  ) : roadmap ? (
                    <div className="prose prose-sm max-w-none text-slate-600 font-bold leading-relaxed uppercase tracking-tight">
                      <ReactMarkdown>{roadmap}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-red-500 font-black uppercase text-xs">Kon geen data laden.</div>
                  )}

                  <div className="pt-8 border-t-2 border-slate-100">
                    <button 
                      onClick={() => setShowRoadmapModal(false)}
                      className="w-full bg-black text-white py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all brutal-shadow"
                    >
                      Begrepen, Laten we beginnen!
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* Profile Optimization Card */}
            <div className="bg-white border-4 border-black p-8 relative overflow-hidden group brutal-shadow-lg">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic mb-2">Optimaliseer je Profiel</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verhoog je kansen op een baan met <span className="text-blue-600">300%</span> door je profiel te voltooien.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</div>
                       <div className="text-3xl font-black text-blue-600 italic leading-none">{calculateTotalProgress()}%</div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-blue-600" strokeDasharray={175.929} strokeDashoffset={175.929 * (1 - calculateTotalProgress() / 100)} />
                       </svg>
                       <Sparkles className="absolute text-yellow-400 w-4 h-4 -top-1 -right-1" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                   {[
                     { label: 'Persoonlijke Info', val: profileProgress.personal, color: 'bg-blue-600', action: () => setShowEditProfile(true) },
                     { label: 'Werkervaring', val: profileProgress.experience, color: 'bg-emerald-500', action: () => setShowExpModal(true) },
                     { label: 'Vaardigheden', val: profileProgress.skills, color: 'bg-indigo-500', action: () => setShowEditProfile(true) },
                     { label: 'Certificaten', val: profileProgress.documents, color: 'bg-orange-500', action: () => setShowCertModal(true) }
                   ].map((item, i) => (
                     <div key={i} className="space-y-2 cursor-pointer group" onClick={item.action}>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                           <span>{item.label}</span>
                           <span className={cn("italic", item.val < 100 ? "text-orange-500" : "text-emerald-500")}>{item.val}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${item.val}%` }}
                             className={cn("h-full", item.color)} 
                           />
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowEditProfile(true)}
                    className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Bewerk Profiel
                  </button>
                  <button onClick={() => setShowCVModal(true)} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Analyseer CV
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 -skew-x-12 translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Profile Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills Card */}
              <div className="bg-white border-2 border-black p-8 brutal-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" /> Vaardigheden
                  </h3>
                  <button onClick={() => setShowEditProfile(true)} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Aanpassen</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user?.skills ? (
                    typeof user.skills === 'string' 
                      ? user.skills.split(',').map((skill: string, i: number) => (
                          <span key={i} className="bg-slate-100 border border-slate-200 px-3 py-1 text-[9px] font-black uppercase tracking-widest">{skill.trim()}</span>
                        ))
                      : user.skills.map((skill: string, i: number) => (
                          <span key={i} className="bg-slate-100 border border-slate-200 px-3 py-1 text-[9px] font-black uppercase tracking-widest">{skill}</span>
                        ))
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nog geen vaardigheden toegevoegd.</p>
                  )}
                </div>
              </div>

              {/* Experience Card */}
              <div className="bg-white border-2 border-black p-8 brutal-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" /> Werkervaring
                  </h3>
                  <button onClick={() => setShowExpModal(true)} className="bg-black text-white p-1 hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_rgba(59,130,246,1)]">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {workExperience.length > 0 ? (
                    <div className="space-y-4">
                      {workExperience.map((exp) => (
                        <div key={exp.id} className="border-l-4 border-slate-100 pl-4 relative group">
                          <div className="absolute -left-[6px] top-1.5 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-600 transition-colors" />
                          <div className="text-[10px] font-black uppercase tracking-tighter italic leading-none mb-1">{exp.role}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{exp.company} • {exp.duration}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nog geen werkervaring toegevoegd.</p>
                  )}
                  
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Huidig Niveau</div>
                      <div className="text-xs font-black uppercase tracking-tight">{user?.experience || 'Starter'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sector</div>
                      <div className="text-xs font-black uppercase tracking-tight">{user?.sector || 'Niet gespecificeerd'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Vacancies Section */}
            <div className="bg-white border-2 border-black p-8">
               <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                      Gepersonaliseerde Matches <Sparkles className="w-5 h-5 text-yellow-400" />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Geselecteerd op basis van jouw {user?.sector || 'interesses'}</p>
                  </div>
                  <Link href="/vacatures" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1 group">
                    Blader door alles <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
               <div className="grid gap-6">
                 {matchedJobs.length > 0 ? (
                   matchedJobs.map((job) => (
                     <div key={job.id} className="relative group bg-slate-50 border-2 border-slate-100 p-6 hover:border-black transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-white border-2 border-black flex items-center justify-center font-black text-lg italic text-blue-600 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
                              {job.company[0]}
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                <Link href={`/vacatures/${job.id}`} className="font-black uppercase tracking-widest text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-none italic">{job.title}</Link>
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 uppercase tracking-widest italic">{job.match}% Match</span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4 mt-2">
                                 <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {job.company}</span>
                                 <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {job.location}</span>
                                 <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                              </div>
                              {job.aiSummary && (
                                <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{job.aiSummary}</p>
                              )}
                           </div>
                        </div>
                        <Link href={`/vacatures/${job.id}`} className="w-full md:w-auto bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
                           Nu Bekijken <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                     </div>
                   ))
                 ) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 italic text-[10px] font-black uppercase tracking-widest text-slate-300">
                        Selecteer een sector in <button onClick={() => setShowSettingsModal(true)} className="text-blue-600 underline hover:text-black">Instellingen</button> om matches te zien.
                    </div>
                 )}
               </div>
            </div>

            {/* Application Tracking */}
            <div className="bg-white border-2 border-black p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-slate-100">
                <h3 className="text-xl font-black uppercase tracking-tight italic">Actieve Sollicitaties</h3>
                <button 
                  onClick={() => setShowApplicationsModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 underline"
                >
                  Bekijk Alles ({applications.length})
                </button>
              </div>
              
              <div className="space-y-6">
                {applications.length > 0 ? (
                  applications.map((app, i) => (
                    <div key={i} className="group p-6 border-2 border-slate-100 hover:border-black flex flex-col gap-6 transition-all bg-white relative">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-sm uppercase tracking-tighter text-slate-400 group-hover:bg-black group-hover:text-white transition-colors">{app.company.substring(0, 3)}</div>
                          <div>
                            <div className="font-black uppercase tracking-tight text-lg text-slate-900 group-hover:text-blue-600 transition-colors italic leading-none mb-1">{app.title || app.position}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.company} • Verstuurd op {app.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className={cn(
                            "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-2",
                            app.status === 'Interview' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            app.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"
                          )}>
                            {app.status}
                          </div>
                          <button 
                            onClick={() => {
                              setReplyDraft('');
                              setActiveMessage(app);
                            }}
                            className="p-2 border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Line */}
                      <div className="flex items-center gap-2">
                        {[
                          { label: 'Verzonden', done: true },
                          { label: 'Cloud Analysis', done: true },
                          { label: 'Review', done: app.status !== 'In Review' },
                          { label: 'Interview', done: app.status === 'Interview' }
                        ].map((step, idx) => (
                          <div key={idx} className="flex-1 flex flex-col gap-2">
                             <div className={cn("h-1", step.done ? "bg-blue-600" : "bg-slate-100")} />
                             <span className={cn("text-[8px] font-black uppercase tracking-widest", step.done ? "text-blue-600" : "text-slate-300")}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">Nog geen sollicitaties</div>
                )}
              </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white border-2 border-black p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight italic">Profiel Zichtbaarheid</h3>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laatste 7 dagen</div>
              </div>
              <div className="h-[250px] w-full">
                <ChartFrame className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DATA}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
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
                        contentStyle={{ 
                          backgroundColor: '#000', 
                          border: 'none', 
                          color: '#fff', 
                          borderRadius: '0px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: '900'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#2563eb" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            </div>

            {/* Saved Jobs Section */}
            <div className="bg-white border-2 border-black p-8">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Opgeslagen Vacatures</h3>
                  <Link href="/vacatures" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Vind Meer</Link>
                </div>
                <div className="grid gap-4">
                   {savedJobs.length > 0 ? (
                     savedJobs.map((job) => (
                       <div key={job.id} className="bg-slate-50 p-6 border border-slate-100 flex items-center justify-between group hover:border-black transition-all cursor-pointer" onClick={() => router.push(`/vacatures/${job.id}`)}>
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-white border-2 border-slate-200 flex items-center justify-center font-black text-xs italic text-blue-600 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.1)]">
                                {job.company[0]}
                             </div>
                             <div>
                                <Link href={`/vacatures/${job.id}`} className="font-black uppercase tracking-widest text-slate-900 block hover:text-blue-600 transition-colors">{job.title}</Link>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                   {job.company} • {job.location} • {job.salary}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={(e) => { e.stopPropagation(); removeSavedJob(job.id); }}
                               className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                             >
                                <Bookmark className="w-5 h-5 fill-current" />
                             </button>
                             <Link href={`/vacatures/${job.id}`} className="bg-black text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                                Bekijk
                             </Link>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-12 text-center border-2 border-dashed border-slate-100 italic text-[10px] font-black uppercase tracking-widest text-slate-300">
                        Je hebt nog geen vacatures opgeslagen.
                     </div>
                   )}
                </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            {/* AI Insights Card */}
            <div className="bg-blue-600 text-white p-8 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-blue-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Career Scout</span>
                </div>
                <h4 className="text-3xl font-black uppercase leading-[0.85] tracking-tighter mb-6 underline decoration-blue-300 decoration-4 underline-offset-8">
                  Je profiel is 94% <br/>geoptimaliseerd.
                </h4>
                <p className="text-sm font-bold text-blue-100 mb-8 leading-relaxed italic">
                  &quot;Op basis van recente trends in de {user?.sector || 'Technologie & IT'} sector adviseren we om je {user?.skills ? 'expertises verder uit te breiden' : 'skills toe te voegen'}.&quot;
                </p>
                <button 
                  onClick={handleGenerateRoadmap}
                  className="w-full bg-white text-blue-600 py-4 font-black uppercase tracking-widest hover:bg-blue-50 transition-colors brutal-shadow"
                >
                  Genereer AI Roadmap
                </button>
              </div>
              <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
            </div>

            {/* Recommended Companies */}
            <div className="bg-white border-2 border-black p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 italic underline decoration-blue-600 decoration-2 underline-offset-4">Top Matches voor jou</h3>
              <div className="space-y-6">
                {[
                  { name: 'Staatsolie NV', match: '98%', sector: 'Energie & Water' },
                  { name: 'Kuldipsingh', match: '89%', sector: 'Bouw & Infrastructuur' },
                  { name: 'IAMGOLD', match: '85%', sector: 'Mijnbouw & Natuurlijke Hulpbronnen' },
                  { name: 'Finabank', match: '82%', sector: 'Financiën & Verzekeringen' },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => router.push(`/vacatures?q=${encodeURIComponent(item.name)}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 flex items-center justify-center font-black text-[10px] group-hover:bg-black group-hover:text-white transition-colors">{item.name.substring(0, 2)}</div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{item.sector}</div>
                      </div>
                    </div>
                    <div className="text-blue-600 font-black text-sm italic">{item.match}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/vacatures')}
                className="w-full mt-8 border-2 border-slate-100 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:border-black transition-colors"
              >
                Ontdek Meer Bedrijven
              </button>
            </div>
            
            {/* Certificates Section */}
            <div className="bg-white border-2 border-black p-8">
               <div className="flex justify-between items-center mb-8 border-b-2 border-slate-100 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest italic decoration-orange-500 underline underline-offset-8">Certificaten</h3>
                  <button 
                    onClick={() => setShowCertModal(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Toevoegen
                  </button>
               </div>
               
               <div className="space-y-4">
                  {certificates.length > 0 ? certificates.map((cert) => (
                    <div key={cert.id} className="p-4 border-2 border-slate-50 bg-slate-50 relative group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-orange-500">
                             <Award className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-[11px] font-black uppercase tracking-tight truncate pr-6">{cert.name}</h4>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{cert.issuer} • {cert.date}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => deleteCert(cert.id)}
                         className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </div>
                  )) : (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 italic text-[10px] font-black uppercase tracking-widest text-slate-300">Nog geen certificaten toegevoegd</div>
                  )}
               </div>
            </div>

            {/* Skill Gaps Selection */}
            <div className="bg-white border-2 border-black p-8">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 italic underline decoration-blue-600 decoration-2 underline-offset-4">Jouw Skill Gaps</h3>
               <div className="space-y-4">
                  {[
                    { skill: 'React Native', difficulty: 'Gemiddeld', gain: '+15% Match' },
                    { skill: 'Project Management', difficulty: 'Hoog', gain: '+22% Match' },
                    { skill: 'Surinaamse Arbeidswet', difficulty: 'Laag', gain: '+8% Match' }
                  ].map((gap, i) => (
                    <div 
                      key={i} 
                      className="p-4 bg-slate-50 border border-slate-100 hover:border-black transition-all group cursor-pointer"
                      onClick={() => setFeedbackMessage(`We raden een cursus ${gap.skill} aan om jouw matchingspercentage met ${gap.gain} te verhogen.`)}
                    >
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest">{gap.skill}</span>
                          <span className="text-[8px] font-black text-blue-600 italic group-hover:underline">{gap.gain}</span>
                       </div>
                       <div className="flex gap-1">
                          {[1, 2, 3].map(step => (
                            <div key={step} className={cn("h-1 flex-1", step <= (gap.difficulty === 'Laag' ? 1 : gap.difficulty === 'Gemiddeld' ? 2 : 3) ? "bg-black" : "bg-slate-200")} />
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
               <button 
                onClick={() => setShowLearningModal(true)}
                className="w-full mt-6 bg-blue-50 text-blue-600 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
               >
                  Bekijk Leerpaden
               </button>
            </div>

            {/* Network Activity/Social Reach */}
            <div className="bg-slate-900 text-white p-8 border-b-8 border-blue-600">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Netwerk Activiteit</span>
               </div>
               <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                     <div className="text-3xl font-black italic tracking-tighter mb-1">12</div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nieuwe recruiters <br/>vonden jou</div>
                  </div>
                  <div>
                     <div className="text-3xl font-black italic tracking-tighter mb-1">4</div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Aanbevelingen <br/>onderweg</div>
                  </div>
               </div>
               <button 
                onClick={() => setShowVisibilityModal(true)}
                className="w-full border-2 border-white/20 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
               >
                  Boost Zichtbaarheid
               </button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowCVModal(true)}
                className="bg-slate-100 p-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white transition-all group"
              >
                <FileText className="w-5 h-5 group-hover:text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Mijn Resumes</span>
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="bg-slate-100 p-4 flex flex-col items-center gap-2 hover:bg-black hover:text-white transition-all group"
              >
                <Settings className="w-5 h-5 group-hover:text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Instellingen</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-black text-white px-10 py-6 border-t-4 border-blue-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] gap-4">
          <div>Dashboard V2.4 — Powered by SuriJobs+ Parsing Engine</div>
          <div className="flex gap-8">
            <span className="text-blue-400">Hulp nodig?</span>
            <span>API Docs</span>
            <span>Support</span>
          </div>
        </div>
      </footer>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEditProfileModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div ref={editProfileRef} role="dialog" aria-modal="true" aria-label="Bewerk profiel" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-xl relative z-10 border-4 border-black p-10 overflow-y-auto max-h-[90vh]">
              <button onClick={closeEditProfileModal} aria-label="Sluit profiel bewerken" className="absolute top-6 right-6 p-2 hover:bg-red-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-blue-600 w-fit pb-2">Bewerk Profiel</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Naam</label>
                     <input value={editFormData?.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                     {profileErrors.name && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{profileErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Functietitel</label>
                     <input value={editFormData?.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                     {profileErrors.title && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{profileErrors.title}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefoon</label>
                     <input value={editFormData?.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                     {profileErrors.phone && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{profileErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locatie</label>
                     <input value={editFormData?.location || ''} onChange={e => setEditFormData({...editFormData, location: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio</label>
                   <textarea value={editFormData?.bio || ''} onChange={e => setEditFormData({...editFormData, bio: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs h-32" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</label>
                     <select value={editFormData?.sector || 'Tech'} onChange={e => setEditFormData({...editFormData, sector: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs bg-white">
                        {['Tech', 'Mining', 'Energy', 'Finance', 'Industry', 'Agriculture', 'Tourism', 'Technologie & IT', 'Financiën & Verzekeringen', 'Mijnbouw & Natuurlijke Hulpbronnen', 'Energie & Water', 'Transport & Logistiek', 'Landbouw, Veeteelt & Visserij', 'Toerisme & Gastvrijheid', 'Gezondheidszorg & Welzijn', 'Onderwijs & Wetenschap', 'Overheid & Publieke Sector', 'Bouw & Infrastructuur', 'Detailhandel & Handel', 'Media & Entertainment', 'Juridische Dienstverlening', 'Veiligheid & Defensie', 'Kunst & Cultuur', 'Administratie & Support', 'HR & Recruitment'].map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ervaring Niveau</label>
                     <select value={editFormData?.experience || 'Junior'} onChange={e => setEditFormData({...editFormData, experience: e.target.value})} className="w-full p-4 border-2 border-black outline-none font-bold text-xs bg-white">
                        {['Starter', 'Junior', 'Mid', 'Senior', 'Lead', 'Expert'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                     </select>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vaardigheden (gescheiden door komma&apos;s)</label>
                   <input value={editFormData?.skills || ''} onChange={e => setEditFormData({...editFormData, skills: e.target.value})} placeholder="BIJV: REACT, NODE.JS, PROJECT MANAGEMENT" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                </div>
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full bg-black text-white py-5 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? "Bezig met opslaan..." : "Sla Wijzigingen Op"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCertModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div ref={certRef} role="dialog" aria-modal="true" aria-label="Nieuw certificaat" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white w-full max-w-lg relative z-10 border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(249,115,22,1)]">
              <button 
                onClick={closeCertModal} 
                aria-label="Sluit het certificaat venster"
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-8">Nieuw Certificaat</h3>
              <form onSubmit={handleAddCert} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Naam Certificaat</label>
                   <input name="cert_name" required placeholder="BIJV: MICROSOFT AZURE FUNDAMENTALS" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                   {certErrors.name && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{certErrors.name}</p>}
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Uitgevende Instantie</label>
                   <input name="cert_issuer" required placeholder="BIJV: MICROSOFT" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                   {certErrors.issuer && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{certErrors.issuer}</p>}
                </div>
                <button disabled={isAddingCert} type="submit" className="w-full bg-orange-500 text-white py-5 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isAddingCert ? 'Bezig met opslaan...' : 'Toevoegen'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence>
        {showExpModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeExpModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div ref={expRef} role="dialog" aria-modal="true" aria-label="Werkervaring toevoegen" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white w-full max-w-lg relative z-10 border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(5,150,105,1)]">
              <button 
                onClick={closeExpModal} 
                aria-label="Sluit werkervaring venster"
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-8">Werkervaring Toevoegen</h3>
              <form onSubmit={handleAddWorkExp} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Functie</label>
                   <input name="exp_role" required placeholder="BIJV: SENIOR DEVELOPER" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                   {expErrors.role && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{expErrors.role}</p>}
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Bedrijf</label>
                   <input name="exp_company" required placeholder="BIJV: TELESUR" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                   {expErrors.company && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{expErrors.company}</p>}
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest">Periode</label>
                   <input name="exp_duration" required placeholder="BIJV: 2023 - HEDEN" className="w-full p-4 border-2 border-black outline-none font-bold text-xs" />
                   {expErrors.duration && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{expErrors.duration}</p>}
                </div>
                <button disabled={isAddingExp} type="submit" className="w-full bg-emerald-600 text-white py-5 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isAddingExp ? 'Bezig met opslaan...' : 'Toevoegen aan Profiel'}</button>
              </form>
            </motion.div>
          </div>
        )}

        {activeMessage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMessageModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg relative z-10 border-4 border-black p-10 shadow-[24px_24px_0px_0px_rgba(37,99,235,1)] flex flex-col h-[600px]">
              <button onClick={closeMessageModal} className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">{activeMessage.company[0]}</div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">{activeMessage.company}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">HR Manager • {activeMessage.title}</p>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-6 overflow-y-auto space-y-4 mb-6">
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-4 mb-4">Chat geopend op {activeMessage.date}</div>
                 
                 <div className="flex justify-start">
                   <div className="bg-white border-2 border-black p-4 rounded-lg text-[10px] font-bold max-w-[85%] brutal-shadow-sm">
                     Beste {user?.name?.split(' ')[0] || 'Kandidaat'}, dank voor je interesse in de rol van {activeMessage.title}. We zijn onder de indruk van je AI Match score van 98%. Zou je morgen om 14:00 beschikbaar zijn voor een eerste kennismaking?
                   </div>
                 </div>

                 <div className="flex justify-end">
                   <div className="bg-blue-600 text-white p-4 rounded-lg text-[10px] font-bold max-w-[85%] shadow-lg">
                     Dag! Jazeker, dat schikt prima. Ik heb de uitnodiging in mijn agenda gezet.
                   </div>
                 </div>
              </div>

              <div className="flex gap-4">
                <input value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="TYP JE ANTWOORD..." className="flex-1 p-4 border-2 border-black font-black uppercase text-[10px] outline-none bg-white focus:bg-slate-50" />
                <button onClick={sendApplicationReply} className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">Stuur</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettingsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div ref={settingsRef} role="dialog" aria-modal="true" aria-label="Instellingen" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border-8 border-black p-6 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] md:shadow-[32px_32px_0px_0px_rgba(0,0,0,1)] custom-scrollbar">
              <button onClick={() => setShowSettingsModal(false)} aria-label="Sluit instellingen" className="absolute top-8 right-8 p-3 hover:bg-black hover:text-white transition-all"><X className="w-8 h-8" /></button>
              
              <h3 className="text-4xl font-black uppercase tracking-tighter italic mb-10 border-b-8 border-yellow-400 w-fit pb-2">Instelling Workspace</h3>
              
              <div className="space-y-12">
                 <div className="space-y-6">
                    <h4 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                      <Bell className="w-6 h-6 text-blue-600" /> Melding Voorkeuren
                    </h4>
                    <div className="grid gap-4">
                         <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-black group">
                           <span className="text-xs font-black uppercase tracking-widest">E-mail bij match</span>
                           <button 
                            type="button"
                            aria-label="Toggle e-mail bij match"
                            aria-pressed={notificationsSettings.emailMatch}
                            onClick={() => toggleNotification('emailMatch')}
                            className={cn("w-12 h-6 border-2 border-black relative transition-colors", notificationsSettings.emailMatch ? "bg-emerald-500" : "bg-slate-200")}
                           >
                              <div className={cn("absolute top-0.5 w-4 h-4 bg-black transition-all", notificationsSettings.emailMatch ? "right-0.5" : "left-0.5")} />
                           </button>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-black group">
                           <span className="text-xs font-black uppercase tracking-widest">Browser notificaties</span>
                           <button 
                            type="button"
                            aria-label="Toggle browser notificaties"
                            aria-pressed={notificationsSettings.browserNotif}
                            onClick={() => toggleNotification('browserNotif')}
                            className={cn("w-12 h-6 border-2 border-black relative transition-colors", notificationsSettings.browserNotif ? "bg-emerald-500" : "bg-slate-200")}
                           >
                              <div className={cn("absolute top-0.5 w-4 h-4 bg-black transition-all", notificationsSettings.browserNotif ? "right-0.5" : "left-0.5")} />
                           </button>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-black group">
                           <span className="text-xs font-black uppercase tracking-widest">Marketing updates</span>
                           <button 
                            type="button"
                            aria-label="Toggle marketing updates"
                            aria-pressed={notificationsSettings.marketing}
                            onClick={() => toggleNotification('marketing')}
                            className={cn("w-12 h-6 border-2 border-black relative transition-colors", notificationsSettings.marketing ? "bg-emerald-500" : "bg-slate-200")}
                           >
                              <div className={cn("absolute top-0.5 w-4 h-4 bg-black transition-all", notificationsSettings.marketing ? "right-0.5" : "left-0.5")} />
                           </button>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                      <Shield className="w-6 h-6 text-blue-600" /> Beveiliging & Privacy
                    </h4>
                    <div className="space-y-4">
                       <button 
                        onClick={() => {
                          window.location.href = `mailto:support@surijobs.sr?subject=${encodeURIComponent('Wachtwoord reset aanvragen')}&body=${encodeURIComponent(`Hallo support,\n\nIk wil graag mijn wachtwoord resetten voor ${user?.email || 'mijn account'}.\n`)}`;
                        }}
                        className="w-full text-left p-6 border-2 border-slate-100 font-black uppercase text-xs tracking-widest transition-all hover:border-black"
                       >
                        Verander Wachtwoord
                       </button>
                       <button 
                        onClick={() => {
                          window.location.href = `mailto:support@surijobs.sr?subject=${encodeURIComponent('Account verwijderen')}&body=${encodeURIComponent(`Hallo support,\n\nIk wil graag mijn account laten verwijderen voor ${user?.email || 'mijn account'}.\n`)}`;
                        }}
                        className="w-full text-left p-6 border-2 border-slate-100 font-black uppercase text-xs tracking-widest transition-all text-red-600 hover:border-red-600"
                       >
                        Verwijder Mijn Account
                       </button>
                    </div>
                 </div>
              </div>

              <div className="mt-12 pt-10 border-t-4 border-slate-100 flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">App Versie v2.4.1 (Stable)</p>
                 <button onClick={() => setShowSettingsModal(false)} className="bg-black text-white px-10 py-5 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Klaar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CV Update Modal */}
      <AnimatePresence>
        {showCVModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !analyzingCV && setShowCVModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              ref={cvRef}
              role="dialog"
              aria-modal="true"
              aria-label="CV analyse"
              className="bg-white w-full max-w-4xl max-h-[95vh] relative z-10 border-4 border-black shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] md:shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] flex flex-col md:flex-row overflow-hidden"
            >
              <div className="w-full md:w-1/3 bg-blue-600 p-10 text-white flex flex-col justify-between relative group">
                <div>
                  <Sparkles className="w-12 h-12 mb-6 text-yellow-400" />
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic mb-4">CV<br/>Power Scan</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 leading-relaxed mb-10">Krijg direct feedback op je CV en zie hoe recruiters van Surinaamse topbedrijven je profiel beoordelen.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white/10 p-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">30+ Datapunten geanalyseerd</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 p-3">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sector Benchmarking</span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText className="w-40 h-40 transform translate-x-12 translate-y-12 rotate-12" />
                </div>
              </div>

              <div className="flex-1 p-10 md:p-12 overflow-y-auto max-h-[85vh]">
                <button 
                  onClick={() => setShowCVModal(false)}
                  disabled={analyzingCV}
                  aria-label="Sluit CV analyse"
                  className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                {!cvAnalysis ? (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight italic mb-3">Upload of Plak CV</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voor de beste resultaten: Kopieer de tekst van je CV hieronder.</p>
                    </div>

                    <div className="relative group">
                       <div className="absolute inset-0 bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-600 transition-colors pointer-events-none" />
                       <div className="relative p-10 flex flex-col items-center justify-center text-center">
                          <UploadCloud className="w-10 h-10 mb-4 text-blue-600" />
                          <p className="text-xs font-black uppercase tracking-widest mb-2 italic">Sleep je PDF hierheen</p>
                          <label className="bg-black text-white px-6 py-2 text-[8px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-600 transition-all">
                             Kies Bestand
                             <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setCvText(`Mock data extracted from ${file.name}: Looking for a ${user?.sector} role with relevant experience and skills mentioned in the filename.`);
                                  setFeedbackMessage('Tekst van PDF geïmporteerd. Klik nu op Scan Starten.');
                                }
                              }}
                             />
                          </label>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest">Plak je CV Tekst</label>
                        {cvText && (
                          <button onClick={() => setCvText('')} className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                             <Trash2 className="w-3 h-3" /> Wissen
                          </button>
                        )}
                      </div>
                      <textarea 
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        disabled={analyzingCV}
                        placeholder="BIJV: JURGEN MISIEDJAN, SENIOR DEVELOPER... (PLAK HIER VOLLEDIGE TEKST)"
                        className="w-full h-48 border-4 border-black p-6 font-bold text-xs uppercase tracking-tight outline-none focus:bg-slate-50 transition-all brutal-shadow-sm disabled:opacity-50"
                      />
                    </div>

                    <button 
                      onClick={handleCVAnalysis}
                      disabled={!cvText.trim() || analyzingCV}
                      className="w-full bg-black text-white py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 brutal-shadow-lg"
                    >
                      {analyzingCV ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Deep Scanning...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" /> Start AI Scan
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-10"
                  >
                    <div className="flex justify-between items-start border-b-4 border-black pb-6">
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tighter italic">Analyse Voltooid</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gereed voor de Surinaamse markt</p>
                      </div>
                      <button 
                        onClick={() => {
                          setCvAnalysis(null);
                          setExtractedData(null);
                        }}
                        className="bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Nieuwe Scan
                      </button>
                    </div>

                    <div className="prose prose-sm max-w-none text-slate-700 font-bold leading-relaxed uppercase tracking-normal">
                       <ReactMarkdown>{cvAnalysis}</ReactMarkdown>
                    </div>

                    {cvInsights && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="border-2 border-black p-5 bg-slate-50">
                          <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Analyse Score</div>
                          <div className="text-4xl font-black italic tracking-tighter text-blue-600">{cvInsights.score}</div>
                        </div>
                        <div className="border-2 border-black p-5 bg-slate-50">
                          <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Top Skill Gaps</div>
                          <div className="text-[10px] font-black uppercase tracking-tight">{cvInsights.skillGaps.slice(0, 2).join(' / ') || 'Geen grote gaps'}</div>
                        </div>
                        <div className="border-2 border-black p-5 bg-slate-50">
                          <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Volgende Stap</div>
                          <div className="text-[10px] font-black uppercase tracking-tight">{cvInsights.recommendations[0]}</div>
                        </div>
                      </div>
                    )}

                    {extractedData && (
                      <div className="bg-blue-50 border-2 border-blue-600 p-8 brutal-shadow">
                        <div className="flex items-center gap-3 mb-6">
                          <Target className="w-5 h-5 text-blue-600" />
                          <h5 className="text-lg font-black uppercase tracking-tighter">Gevonden Profiel Data</h5>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8 text-[11px] font-bold">
                          <div>
                            <div className="text-slate-400 uppercase tracking-widest mb-1">Naam</div>
                            <div className="uppercase">{extractedData.name || 'Onbekend'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 uppercase tracking-widest mb-1">Titel</div>
                            <div className="uppercase">{extractedData.title || 'Onbekend'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-slate-400 uppercase tracking-widest mb-1">Vaardigheden</div>
                            <div className="uppercase">{extractedData.skills || 'Geen gedetecteerd'}</div>
                          </div>
                        </div>

                        <button 
                          onClick={applyExtractedData}
                          className="w-full bg-blue-600 text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center justify-center gap-2 brutal-shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Pas deze gegevens toe op mijn profiel
                        </button>
                      </div>
                    )}

                    {cvInsights && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="border-2 border-black p-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Sterke Punten</div>
                          <div className="space-y-3">
                            {cvInsights.strengths.map((item) => (
                              <div key={item} className="text-[10px] font-bold uppercase tracking-tight text-slate-600">{item}</div>
                            ))}
                          </div>
                        </div>
                        <div className="border-2 border-black p-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">Verbeterpunten</div>
                          <div className="space-y-3">
                            {cvInsights.weaknesses.map((item) => (
                              <div key={item} className="text-[10px] font-bold uppercase tracking-tight text-slate-600">{item}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center pt-6">
                      <button 
                        onClick={() => {
                          setShowCVModal(false);
                          setCvAnalysis(null);
                          setExtractedData(null);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent hover:border-black transition-all"
                      >
                        Begrepen
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApplicationsModal && (
          <div className="fixed inset-0 z-[155] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              ref={applicationsRef}
              role="dialog"
              aria-modal="true"
              aria-label="Sollicitatie overzicht"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)]"
            >
              <button onClick={() => setShowApplicationsModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors" aria-label="Sluit sollicitatie overzicht">
                <X className="w-6 h-6" />
              </button>
              <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Sollicitatie Overzicht</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Filter en volg al je actieve sollicitaties op een plek.</p>
              </div>

              <div className="grid md:grid-cols-[220px_1fr] gap-4 mb-8">
                <select
                  value={applicationFilters.status}
                  onChange={(e) => setApplicationFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full p-4 border-2 border-black font-black uppercase text-[10px] tracking-widest bg-white outline-none"
                >
                  {['Alle', 'In Review', 'Interview', 'Rejected', 'Uitgenodigd'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input
                  value={applicationFilters.query}
                  onChange={(e) => setApplicationFilters((prev) => ({ ...prev, query: e.target.value }))}
                  placeholder="Zoek op bedrijf of functie"
                  className="w-full p-4 border-2 border-black font-black uppercase text-[10px] tracking-widest outline-none"
                />
              </div>

              <div className="space-y-4">
                {filteredApplications.length > 0 ? filteredApplications.map((application) => (
                  <div key={application.id} className="border-2 border-slate-100 p-6 bg-slate-50">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight italic">{application.title || application.position}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{application.company} • Verstuurd op {application.date}</p>
                      </div>
                      <div className={cn(
                        "h-fit px-4 py-2 text-[9px] font-black uppercase tracking-widest border-2",
                        application.status === 'Interview' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        application.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {application.status}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center border-2 border-dashed border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Geen sollicitaties gevonden voor deze filters.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLearningModal && (
          <div className="fixed inset-0 z-[155] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              ref={learningRef}
              role="dialog"
              aria-modal="true"
              aria-label="Leerpaden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)]"
            >
              <button onClick={() => setShowLearningModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors" aria-label="Sluit leerpaden">
                <X className="w-6 h-6" />
              </button>
              <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Persoonlijke Leerpaden</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Aanbevolen op basis van jouw profiel, sector en skill gaps.</p>
              </div>

              <div className="space-y-6">
                {learningRecommendations.map((item) => {
                  const status = learningProgress[item.id] || 'not-started';
                  return (
                    <div key={item.id} className="border-2 border-black p-6 bg-slate-50">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tight italic">{item.title}</h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{item.duration} • Verwachte impact {item.gain}</p>
                          <p className="text-sm font-bold text-slate-600 mt-4">{item.reason}</p>
                        </div>
                        <div className="min-w-[220px] space-y-3">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</div>
                          <div className={cn(
                            "px-4 py-3 text-[10px] font-black uppercase tracking-widest border-2 text-center",
                            status === 'done' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            status === 'in-progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-white text-slate-600 border-slate-200"
                          )}>
                            {status === 'done' ? 'Afgerond' : status === 'in-progress' ? 'In Uitvoering' : 'Nog Niet Gestart'}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => updateLearningStatus(item.id, 'in-progress')} className="border-2 border-black py-3 text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                              Start
                            </button>
                            <button onClick={() => updateLearningStatus(item.id, 'done')} className="bg-black text-white py-3 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                              Afronden
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVisibilityModal && (
          <div className="fixed inset-0 z-[155] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              ref={visibilityRef}
              role="dialog"
              aria-modal="true"
              aria-label="Zichtbaarheidsboost"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 border-4 border-black p-6 md:p-10 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)]"
            >
              <button onClick={() => setShowVisibilityModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 transition-colors" aria-label="Sluit zichtbaarheidsboost">
                <X className="w-6 h-6" />
              </button>
              <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Profiel Zichtbaarheid</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Beheer hoe sterk jouw profiel zichtbaar is voor werkgevers.</p>
              </div>

              <div className="mb-8 border-2 border-black p-6 bg-slate-50">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Huidige status</div>
                    <div className="text-xl font-black uppercase tracking-tight italic">
                      {visibilityBoost.enabled ? `${visibilityBoost.plan} boost actief` : 'Standaard zichtbaarheid'}
                    </div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {visibilityBoost.enabled && visibilityBoost.expiresAt
                      ? `Actief t/m ${new Date(visibilityBoost.expiresAt).toLocaleDateString('nl-NL')}`
                      : 'Geen einddatum ingesteld'}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { plan: 'Standaard' as const, description: 'Normale zichtbaarheid voor recruiters.' },
                  { plan: 'Priority' as const, description: 'Meer zichtbaarheid in zoekresultaten voor 7 dagen.' },
                  { plan: 'Premium' as const, description: 'Toppositie in matches en extra recruiter alerts.' },
                ].map((option) => (
                  <div key={option.plan} className="border-2 border-black p-5 bg-white">
                    <div className="text-lg font-black uppercase tracking-tight italic mb-3">{option.plan}</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 min-h-[48px]">{option.description}</p>
                    <button
                      onClick={() => activateVisibilityBoost(option.plan)}
                      className="mt-6 w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Activeer
                    </button>
                  </div>
                ))}
              </div>

              {visibilityBoost.enabled && (
                <button
                  onClick={disableVisibilityBoost}
                  className="mt-6 w-full border-2 border-red-500 text-red-600 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  Schakel boost uit
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
