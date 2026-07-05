'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  UploadCloud,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Target,
  Users,
  Mail,
  GraduationCap,
  Clock,
  ArrowRight,
  Pause,
  Play,
  CheckCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';

const DASHBOARD_T = {
  nl: {
    portalBadge: 'Werkgever Portal',
    welcome: 'Welkom,',
    heroSub: 'Beheer je vacatures op één plek.',
    logout: 'Uitloggen',
    myVacancies: 'Mijn Vacatures',
    newMatches: (n: number) => `${n} nieuw${n === 1 ? '' : 'e'} match${n === 1 ? '' : 'es'}`,
    activeVacancies: (n: number) => `${n} actieve vacature${n === 1 ? '' : 's'}`,
    uploadBusy: 'Bezig...',
    uploadDrop: 'Laat los om te uploaden',
    uploadOrDrag: 'Upload of sleep vacature',
    newVacancy: 'Nieuwe Vacature',
    createSubtitle: 'Plaats een vacature die direct zichtbaar wordt voor kandidaten',
    aiAutofill: 'AI Auto-Fill',
    aiDrop: 'Laat los om te uploaden',
    aiPrompt: 'Heb je al een vacature in een Word- of PDF-bestand?',
    aiHelp: 'Sleep het bestand hierheen of klik op "Upload Bestand". AI vult de velden automatisch in — je kan daarna nog alles bewerken.',
    filledFrom: (file: string) => `Ingevuld vanuit: ${file}`,
    analyzing: 'Analyseren...',
    uploadFile: 'Upload Bestand',
    fieldTitle: 'Functietitel *',
    fieldLocation: 'Locatie',
    fieldEmploymentType: 'Type dienstverband',
    etTemporary: 'Tijdelijk',
    etInternship: 'Stage',
    remoteHybrid: 'Remote / hybride mogelijk',
    fieldDescription: 'Beschrijving',
    descPlaceholder: 'Wat houdt de functie in? Wie zoek je?',
    fieldRequirements: 'Vereisten',
    reqPlaceholder: 'Welke ervaring, opleiding, vaardigheden zijn nodig?',
    salaryMin: 'Salaris min (optioneel)',
    salaryMax: 'Salaris max (optioneel)',
    currency: 'Valuta',
    period: 'Periode',
    perMonth: 'Per maand',
    perYear: 'Per jaar',
    perHour: 'Per uur',
    posting: 'Plaatsen...',
    postVacancy: 'Vacature Plaatsen',
    cancel: 'Annuleren',
    noVacancies: 'Nog geen vacatures',
    noVacanciesSub: 'Plaats je eerste vacature en bereik kandidaten direct.',
    postFirst: 'Eerste Vacature Plaatsen',
    backHome: '← Terug naar home',
    errFileTooBig: 'Bestand is groter dan 4.5 MB',
    errFileType: 'Alleen PDF of Word (.docx) ondersteund',
    errParseVacancy: 'Vacature analyseren mislukt',
    errConnection: 'Verbinding mislukt',
    errAiAnalysis: 'AI-analyse mislukt',
    errSaveVacancy: 'Vacature opslaan mislukt',
    createdFromFile: (title: string, file: string) => `Vacature "${title}" aangemaakt vanuit ${file}`,
    errPostVacancy: 'Vacature plaatsen mislukt',
    confirmDelete: 'Vacature verwijderen?',
    paused: 'Gepauzeerd',
    active: 'Actief',
    matchedByTeam: 'Wordt gematcht door ons team',
    remote: 'Remote',
    statViews: 'Weergaven',
    statApplications: 'Sollicitaties',
    statOurMatches: 'Onze matches',
    statJobseekerHits: 'Werkzoeker hits',
    ariaResume: 'Vacature hervatten',
    ariaPause: 'Vacature pauzeren',
    titleResume: 'Hervat publicatie',
    titlePause: 'Pauzeer publicatie',
    ariaDelete: 'Vacature verwijderen',
    ourMatchesFor: 'Onze matches voor deze vacature',
    noMatches: 'Nog geen matches',
    noMatchesSub: 'Wij doorzoeken kandidaten en pushen passende profielen naar je portaal. Je krijgt een email zodra er matches klaarstaan.',
    salaryTo: 'tot',
    badgeNew: 'Nieuw',
    contactRequested: 'Contact aangevraagd',
    contactShared: 'Contact gedeeld',
    yearsExp: (n: number) => `${n} jr ervaring`,
    noteFrom: 'Notitie van Jobparsing+',
    messageFromTeam: 'Bericht van ons team',
    matchLabel: 'Match',
    sent: 'Verzonden',
    requestContact: 'Vraag contact aan',
    requestContactTitle: 'Contactgegevens aanvragen',
    requestSent: 'Aanvraag verstuurd',
    willContactSoon: 'We nemen z.s.m. contact op.',
    requestContactLead: 'Je vraagt contact aan voor',
    requestContactMid: 'voor je vacature',
    requestContactHelp: 'Wij benaderen de kandidaat en sturen je vervolgens de contactgegevens — meestal binnen 1 werkdag.',
    noteLabel: 'Optioneel: notitie voor ons',
    notePlaceholder: 'Bv. dringend, of specifieke vragen over de kandidaat',
    errRequest: 'Aanvraag mislukt',
    confirmRequest: 'Bevestig aanvraag',
    cancelShort: 'Annuleer',
  },
  en: {
    portalBadge: 'Employer Portal',
    welcome: 'Welcome,',
    heroSub: 'Manage your vacancies in one place.',
    logout: 'Log out',
    myVacancies: 'My Vacancies',
    newMatches: (n: number) => `${n} new match${n === 1 ? '' : 'es'}`,
    activeVacancies: (n: number) => `${n} active vacanc${n === 1 ? 'y' : 'ies'}`,
    uploadBusy: 'Working...',
    uploadDrop: 'Drop to upload',
    uploadOrDrag: 'Upload or drag vacancy',
    newVacancy: 'New Vacancy',
    createSubtitle: 'Post a vacancy that becomes instantly visible to candidates',
    aiAutofill: 'AI Auto-Fill',
    aiDrop: 'Drop to upload',
    aiPrompt: 'Already have a vacancy in a Word or PDF file?',
    aiHelp: 'Drag the file here or click "Upload File". AI fills in the fields automatically — you can still edit everything afterwards.',
    filledFrom: (file: string) => `Filled from: ${file}`,
    analyzing: 'Analyzing...',
    uploadFile: 'Upload File',
    fieldTitle: 'Job title *',
    fieldLocation: 'Location',
    fieldEmploymentType: 'Employment type',
    etTemporary: 'Temporary',
    etInternship: 'Internship',
    remoteHybrid: 'Remote / hybrid possible',
    fieldDescription: 'Description',
    descPlaceholder: 'What does the role involve? Who are you looking for?',
    fieldRequirements: 'Requirements',
    reqPlaceholder: 'What experience, education, skills are needed?',
    salaryMin: 'Salary min (optional)',
    salaryMax: 'Salary max (optional)',
    currency: 'Currency',
    period: 'Period',
    perMonth: 'Per month',
    perYear: 'Per year',
    perHour: 'Per hour',
    posting: 'Posting...',
    postVacancy: 'Post Vacancy',
    cancel: 'Cancel',
    noVacancies: 'No vacancies yet',
    noVacanciesSub: 'Post your first vacancy and reach candidates right away.',
    postFirst: 'Post First Vacancy',
    backHome: '← Back to home',
    errFileTooBig: 'File is larger than 4.5 MB',
    errFileType: 'Only PDF or Word (.docx) supported',
    errParseVacancy: 'Vacancy analysis failed',
    errConnection: 'Connection failed',
    errAiAnalysis: 'AI analysis failed',
    errSaveVacancy: 'Saving vacancy failed',
    createdFromFile: (title: string, file: string) => `Vacancy "${title}" created from ${file}`,
    errPostVacancy: 'Posting vacancy failed',
    confirmDelete: 'Delete vacancy?',
    paused: 'Paused',
    active: 'Active',
    matchedByTeam: 'Being matched by our team',
    remote: 'Remote',
    statViews: 'Views',
    statApplications: 'Applications',
    statOurMatches: 'Our matches',
    statJobseekerHits: 'Jobseeker hits',
    ariaResume: 'Resume vacancy',
    ariaPause: 'Pause vacancy',
    titleResume: 'Resume publication',
    titlePause: 'Pause publication',
    ariaDelete: 'Delete vacancy',
    ourMatchesFor: 'Our matches for this vacancy',
    noMatches: 'No matches yet',
    noMatchesSub: 'We search candidates and push suitable profiles to your portal. You will get an email as soon as matches are ready.',
    salaryTo: 'up to',
    badgeNew: 'New',
    contactRequested: 'Contact requested',
    contactShared: 'Contact shared',
    yearsExp: (n: number) => `${n} yr${n === 1 ? '' : 's'} experience`,
    noteFrom: 'Note from Jobparsing+',
    messageFromTeam: 'Message from our team',
    matchLabel: 'Match',
    sent: 'Sent',
    requestContact: 'Request contact',
    requestContactTitle: 'Request contact details',
    requestSent: 'Request sent',
    willContactSoon: 'We will contact you as soon as possible.',
    requestContactLead: 'You are requesting contact for',
    requestContactMid: 'for your vacancy',
    requestContactHelp: 'We approach the candidate and then send you the contact details — usually within 1 business day.',
    noteLabel: 'Optional: note for us',
    notePlaceholder: 'E.g. urgent, or specific questions about the candidate',
    errRequest: 'Request failed',
    confirmRequest: 'Confirm request',
    cancelShort: 'Cancel',
  },
  es: {
    portalBadge: 'Portal del Empleador',
    welcome: 'Bienvenido,',
    heroSub: 'Gestiona tus vacantes en un solo lugar.',
    logout: 'Cerrar sesión',
    myVacancies: 'Mis Vacantes',
    newMatches: (n: number) => `${n} nueva${n === 1 ? '' : 's'} coincidencia${n === 1 ? '' : 's'}`,
    activeVacancies: (n: number) => `${n} vacante${n === 1 ? '' : 's'} activa${n === 1 ? '' : 's'}`,
    uploadBusy: 'Procesando...',
    uploadDrop: 'Suelta para subir',
    uploadOrDrag: 'Sube o arrastra la vacante',
    newVacancy: 'Nueva Vacante',
    createSubtitle: 'Publica una vacante que será visible de inmediato para los candidatos',
    aiAutofill: 'Autocompletado IA',
    aiDrop: 'Suelta para subir',
    aiPrompt: '¿Ya tienes una vacante en un archivo Word o PDF?',
    aiHelp: 'Arrastra el archivo aquí o haz clic en "Subir archivo". La IA rellena los campos automáticamente — luego puedes editarlo todo.',
    filledFrom: (file: string) => `Rellenado desde: ${file}`,
    analyzing: 'Analizando...',
    uploadFile: 'Subir archivo',
    fieldTitle: 'Título del puesto *',
    fieldLocation: 'Ubicación',
    fieldEmploymentType: 'Tipo de empleo',
    etTemporary: 'Temporal',
    etInternship: 'Prácticas',
    remoteHybrid: 'Remoto / híbrido posible',
    fieldDescription: 'Descripción',
    descPlaceholder: '¿En qué consiste el puesto? ¿A quién buscas?',
    fieldRequirements: 'Requisitos',
    reqPlaceholder: '¿Qué experiencia, formación y habilidades se necesitan?',
    salaryMin: 'Salario mín (opcional)',
    salaryMax: 'Salario máx (opcional)',
    currency: 'Moneda',
    period: 'Período',
    perMonth: 'Por mes',
    perYear: 'Por año',
    perHour: 'Por hora',
    posting: 'Publicando...',
    postVacancy: 'Publicar Vacante',
    cancel: 'Cancelar',
    noVacancies: 'Aún no hay vacantes',
    noVacanciesSub: 'Publica tu primera vacante y llega a los candidatos de inmediato.',
    postFirst: 'Publicar Primera Vacante',
    backHome: '← Volver al inicio',
    errFileTooBig: 'El archivo supera los 4.5 MB',
    errFileType: 'Solo se admite PDF o Word (.docx)',
    errParseVacancy: 'El análisis de la vacante falló',
    errConnection: 'La conexión falló',
    errAiAnalysis: 'El análisis con IA falló',
    errSaveVacancy: 'No se pudo guardar la vacante',
    createdFromFile: (title: string, file: string) => `Vacante "${title}" creada desde ${file}`,
    errPostVacancy: 'No se pudo publicar la vacante',
    confirmDelete: '¿Eliminar la vacante?',
    paused: 'Pausada',
    active: 'Activo',
    matchedByTeam: 'Nuestro equipo la está emparejando',
    remote: 'Remoto',
    statViews: 'Visualizaciones',
    statApplications: 'Postulaciones',
    statOurMatches: 'Nuestras coincidencias',
    statJobseekerHits: 'Visitas de candidatos',
    ariaResume: 'Reanudar vacante',
    ariaPause: 'Pausar vacante',
    titleResume: 'Reanudar publicación',
    titlePause: 'Pausar publicación',
    ariaDelete: 'Eliminar vacante',
    ourMatchesFor: 'Nuestras coincidencias para esta vacante',
    noMatches: 'Aún no hay coincidencias',
    noMatchesSub: 'Buscamos candidatos y enviamos perfiles adecuados a tu portal. Recibirás un correo en cuanto haya coincidencias listas.',
    salaryTo: 'hasta',
    badgeNew: 'Nuevo',
    contactRequested: 'Contacto solicitado',
    contactShared: 'Contacto compartido',
    yearsExp: (n: number) => `${n} años de experiencia`,
    noteFrom: 'Nota de Jobparsing+',
    messageFromTeam: 'Mensaje de nuestro equipo',
    matchLabel: 'Match',
    sent: 'Enviado',
    requestContact: 'Solicitar contacto',
    requestContactTitle: 'Solicitar datos de contacto',
    requestSent: 'Solicitud enviada',
    willContactSoon: 'Nos pondremos en contacto lo antes posible.',
    requestContactLead: 'Estás solicitando contacto para',
    requestContactMid: 'para tu vacante',
    requestContactHelp: 'Contactamos al candidato y luego te enviamos los datos de contacto — normalmente en 1 día laborable.',
    noteLabel: 'Opcional: nota para nosotros',
    notePlaceholder: 'Ej. urgente, o preguntas específicas sobre el candidato',
    errRequest: 'La solicitud falló',
    confirmRequest: 'Confirmar solicitud',
    cancelShort: 'Cancelar',
  },
};

interface Vacancy {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string;
  employmentType?: string;
  isRemote?: boolean;
  isActive?: boolean;
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  source?: string;
  createdAt: string;
  postedAt?: string;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  requirements: '',
  location: 'Paramaribo',
  employmentType: 'Full-time',
  isRemote: false,
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'SRD',
  salaryPeriod: 'month',
};

export default function CompanyDashboard() {
  const t = useT(DASHBOARD_T);
  const router = useRouter();
  const { employer, employerToken, isLoading, logoutEmployer } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedFromFile, setParsedFromFile] = useState<string | null>(null);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickUploadStatus, setQuickUploadStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [dragOverQuick, setDragOverQuick] = useState(false);
  const [dragOverAi, setDragOverAi] = useState(false);
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const quickUploadRef = React.useRef<HTMLInputElement>(null);

  const totalNew = Object.values(newCounts).reduce((a, b) => a + b, 0);
  const updateNewCount = useCallback((vId: string, count: number) => {
    setNewCounts(prev => (prev[vId] === count ? prev : { ...prev, [vId]: count }));
  }, []);

  const dragHandlers = (setOver: (b: boolean) => void) => ({
    onDragEnter: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      setOver(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setOver(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if ((e.currentTarget as Node).contains(e.relatedTarget as Node | null)) return;
      setOver(false);
    },
  });

  const reload = useCallback(async () => {
    if (!employerToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/employer/vacancies', {
        headers: { 'x-employer-token': employerToken },
      });
      const data = await res.json();
      if (data.success) setVacancies(data.data);
    } finally {
      setLoading(false);
    }
  }, [employerToken]);

  useEffect(() => {
    if (isLoading) return;
    if (!employerToken) {
      router.push('/auth');
      return;
    }
    reload();
  }, [isLoading, employerToken, router, reload]);

  const handleLogout = () => {
    logoutEmployer();
    router.push('/');
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 4.5 * 1024 * 1024) {
      setError(t.errFileTooBig);
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setError(t.errFileType);
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/parse-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || t.errParseVacancy);
        return;
      }
      // Map parsed fields naar form. Parser geeft: title, location, requirements.
      // 'requirements' bevat de complete tekst, dus die zetten we in description.
      setForm(f => ({
        ...f,
        title: data.data.title || f.title,
        location: data.data.location || f.location,
        description: data.data.requirements || f.description,
      }));
      setParsedFromFile(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errConnection);
    } finally {
      setParsing(false);
    }
  };

  const handleQuickUpload = async (file: File) => {
    if (!employerToken) return;
    setQuickUploadStatus(null);
    if (file.size > 4.5 * 1024 * 1024) {
      setQuickUploadStatus({ kind: 'err', text: t.errFileTooBig });
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setQuickUploadStatus({ kind: 'err', text: t.errFileType });
      return;
    }
    setQuickUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const parseRes = await fetch('/api/parse-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name }),
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok || !parseData.success) {
        setQuickUploadStatus({ kind: 'err', text: parseData.message || t.errAiAnalysis });
        return;
      }
      const parsed = parseData.data || {};
      const createRes = await fetch('/api/employer/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': employerToken },
        body: JSON.stringify({
          title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
          location: parsed.location || 'Paramaribo',
          description: parsed.requirements || '',
          requirements: '',
          employmentType: 'Full-time',
          isRemote: false,
          company: employer?.companyName,
          salaryCurrency: 'SRD',
          salaryPeriod: 'month',
        }),
      });
      const createData = await createRes.json();
      if (!createData.success) {
        setQuickUploadStatus({ kind: 'err', text: createData.message || t.errSaveVacancy });
        return;
      }
      setQuickUploadStatus({ kind: 'ok', text: t.createdFromFile(createData.data?.title || parsed.title, file.name) });
      await reload();
    } catch (err) {
      setQuickUploadStatus({ kind: 'err', text: err instanceof Error ? err.message : t.errConnection });
    } finally {
      setQuickUploading(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': employerToken },
        body: JSON.stringify({
          ...form,
          company: employer?.companyName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || t.errPostVacancy);
        return;
      }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await reload();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVacancy = async (id: string) => {
    if (!employerToken) return;
    if (!confirm(t.confirmDelete)) return;
    setBusy(true);
    try {
      await fetch(`/api/employer/vacancies/${id}`, {
        method: 'DELETE',
        headers: { 'x-employer-token': employerToken },
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const toggleVacancyActive = async (id: string, current: boolean) => {
    if (!employerToken) return;
    setBusy(true);
    try {
      await fetch(`/api/employer/vacancies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': employerToken },
        body: JSON.stringify({ isActive: !current }),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!employer) {
    return null; // useEffect redirects naar /auth
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-16 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <Briefcase className="w-3 h-3" /> {t.portalBadge}
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
              {t.welcome} <span className="text-blue-600 italic">{employer.companyName}</span>
            </h1>
            <p className="text-base font-bold text-slate-400 uppercase tracking-tight italic">
              {t.heroSub}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/5 border-2 border-white/20 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3"
          >
            <LogOut className="w-3 h-3" /> {t.logout}
          </button>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-slate-100 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none flex items-center gap-3 flex-wrap">
              {t.myVacancies}
              {totalNew > 0 && (
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const first = vacancies.find(v => (newCounts[v._id] || 0) > 0);
                    if (first) {
                      const el = document.getElementById(`vacancy-${first._id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-colors animate-pulse"
                >
                  <Sparkles className="w-3 h-3" /> {t.newMatches(totalNew)}
                </Link>
              )}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              {t.activeVacancies(vacancies.length)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              ref={quickUploadRef}
              type="file"
              accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleQuickUpload(f);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => quickUploadRef.current?.click()}
              disabled={quickUploading}
              {...dragHandlers(setDragOverQuick)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverQuick(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleQuickUpload(f);
              }}
              className={cn(
                'px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.2)] disabled:opacity-50 border-2',
                dragOverQuick
                  ? 'bg-blue-600 text-white border-blue-700 scale-105'
                  : 'bg-black text-white border-black hover:bg-blue-600',
              )}
            >
              {quickUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
              {quickUploading ? t.uploadBusy : dragOverQuick ? t.uploadDrop : t.uploadOrDrag}
            </button>
            <button
              onClick={() => setShowCreate(s => !s)}
              className="bg-blue-600 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
            >
              <Plus className="w-3 h-3" /> {t.newVacancy}
            </button>
          </div>
        </div>

        {quickUploadStatus && (
          <div className={cn(
            'border-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest flex items-center gap-2',
            quickUploadStatus.kind === 'ok' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700',
          )}>
            {quickUploadStatus.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {quickUploadStatus.text}
          </div>
        )}

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={submitCreate} className="bg-white border-4 border-blue-600 p-8 space-y-4 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.15)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">{t.newVacancy}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {t.createSubtitle}
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AI-fill: upload bestaande vacature */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div
                  {...dragHandlers(setDragOverAi)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverAi(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className={cn(
                    'border-2 border-dashed p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors',
                    dragOverAi ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                      <Sparkles className="w-3 h-3" /> {t.aiAutofill}
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {dragOverAi ? t.aiDrop : t.aiPrompt}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 italic">
                      {t.aiHelp}
                    </p>
                    {parsedFromFile && (
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> {t.filledFrom(parsedFromFile)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {parsing ? <><Loader2 className="w-3 h-3 animate-spin" /> {t.analyzing}</> : <><UploadCloud className="w-3 h-3" /> {t.uploadFile}</>}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>{t.fieldTitle}</Label>
                    <input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior Software Developer" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <Label>{t.fieldLocation}</Label>
                    <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Paramaribo" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <Label>{t.fieldEmploymentType}</Label>
                    <select value={form.employmentType} onChange={(e) => setForm(f => ({ ...f, employmentType: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">{t.etTemporary}</option>
                      <option value="Internship">{t.etInternship}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="isRemote" checked={form.isRemote} onChange={(e) => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4" />
                    <label htmlFor="isRemote" className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t.remoteHybrid}</label>
                  </div>

                  <div className="md:col-span-2">
                    <Label>{t.fieldDescription}</Label>
                    <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={5} placeholder={t.descPlaceholder} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm leading-relaxed" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t.fieldRequirements}</Label>
                    <textarea value={form.requirements} onChange={(e) => setForm(f => ({ ...f, requirements: e.target.value }))} rows={4} placeholder={t.reqPlaceholder} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm leading-relaxed" />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <Label>{t.salaryMin}</Label>
                      <input type="number" value={form.salaryMin} onChange={(e) => setForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="3000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                    </div>
                    <div>
                      <Label>{t.salaryMax}</Label>
                      <input type="number" value={form.salaryMax} onChange={(e) => setForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="5000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                    </div>
                    <div>
                      <Label>{t.currency}</Label>
                      <select value={form.salaryCurrency} onChange={(e) => setForm(f => ({ ...f, salaryCurrency: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                        <option value="SRD">SRD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <Label>{t.period}</Label>
                      <select value={form.salaryPeriod} onChange={(e) => setForm(f => ({ ...f, salaryPeriod: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                        <option value="month">{t.perMonth}</option>
                        <option value="year">{t.perYear}</option>
                        <option value="hour">{t.perHour}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                    {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> {t.posting}</> : <><Plus className="w-3 h-3" /> {t.postVacancy}</>}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white">
                    {t.cancel}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
        ) : vacancies.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-slate-200 p-16 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">{t.noVacancies}</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic mb-6">
              {t.noVacanciesSub}
            </p>
            <button onClick={() => setShowCreate(true)} className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Plus className="w-3 h-3" /> {t.postFirst}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {vacancies.map(v => (
              <VacancyRow
                key={v._id}
                v={v}
                token={employerToken!}
                onDelete={() => deleteVacancy(v._id)}
                onTogglePause={() => toggleVacancyActive(v._id, v.isActive !== false)}
                busy={busy}
                onNewCountChange={updateNewCount}
              />
            ))}
          </div>
        )}

        <div className="text-center pt-8 border-t-2 border-slate-100">
          <Link href="/" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">
            {t.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">{children}</label>;
}

interface AnonMatch {
  _id: string;
  status: 'presented' | 'viewed' | 'contact-requested' | 'contact-shared' | 'rejected';
  adminNote?: string;
  matchScore?: number;
  addedAt: string;
  contactSharedAt?: string;
  contactSharedNote?: string;
  cv: {
    id: string;
    jobTitle: string;
    location: string;
    summary: string;
    topSkills: string[];
    yearsExperience?: number;
    educationLevel?: string;
  };
}

interface VacancyAnalytics {
  viewCount: number;
  applicationCount: number;
  curatedTotal: number;
  presented: number;
  viewed: number;
  contactRequested: number;
  contactShared: number;
  rejected: number;
  suggestedPending: number;
  jobseekerMatchCount: number;
}

function VacancyRow({
  v, onDelete, onTogglePause, busy, token, onNewCountChange,
}: {
  v: Vacancy; onDelete: () => void; onTogglePause: () => void; busy: boolean; token: string;
  onNewCountChange: (vId: string, count: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [matches, setMatches] = useState<AnonMatch[] | null>(null);
  const [analytics, setAnalytics] = useState<VacancyAnalytics | null>(null);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [contactMatch, setContactMatch] = useState<AnonMatch | null>(null);

  // Eager: gebruik analytics.presented (geladen op mount). Live: zodra de
  // werkgever uitklapt en op een match klikt schakelt deze over op de
  // matches-state zodat de teller direct daalt na "view".
  const newCount = matches
    ? matches.filter(m => m.status === 'presented').length
    : (analytics?.presented ?? 0);

  useEffect(() => {
    onNewCountChange(v._id, newCount);
  }, [v._id, newCount, onNewCountChange]);

  const loadExpand = useCallback(async () => {
    setLoadingExpand(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(`/api/employer/vacancies/${v._id}/curated-matches`, { headers: { 'x-employer-token': token } }).then(r => r.json()),
        fetch(`/api/employer/vacancies/${v._id}/analytics`, { headers: { 'x-employer-token': token } }).then(r => r.json()),
      ]);
      if (mRes.success) setMatches(mRes.matches || []);
      if (aRes.success) setAnalytics(aRes.stats || null);
    } finally {
      setLoadingExpand(false);
    }
  }, [v._id, token]);

  useEffect(() => {
    fetch(`/api/employer/vacancies/${v._id}/analytics`, { headers: { 'x-employer-token': token } })
      .then(r => r.json())
      .then(data => { if (data.success) setAnalytics(data.stats); })
      .catch(() => { /* ignore */ });
  }, [v._id, token]);

  const handleToggle = async () => {
    if (!expanded) {
      setExpanded(true);
      if (matches === null) await loadExpand();
    } else {
      setExpanded(false);
    }
  };

  const markViewed = async (matchId: string) => {
    try {
      await fetch(`/api/employer/curated-matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': token },
        body: JSON.stringify({ action: 'view' }),
      });
      setMatches(prev => prev ? prev.map(m => m._id === matchId && m.status === 'presented' ? { ...m, status: 'viewed' } : m) : prev);
    } catch { /* ignore */ }
  };

  return <VacancyRowInner
    v={v} onDelete={onDelete} onTogglePause={onTogglePause} busy={busy} expanded={expanded} handleToggle={handleToggle}
    analytics={analytics} matches={matches} loadingExpand={loadingExpand}
    contactMatch={contactMatch} setContactMatch={setContactMatch}
    markViewed={markViewed} reloadExpand={loadExpand} token={token} newCount={newCount}
  />;
}

function VacancyRowInner({
  v, onDelete, onTogglePause, busy, expanded, handleToggle, analytics, matches, loadingExpand,
  contactMatch, setContactMatch, markViewed, reloadExpand, token, newCount,
}: {
  v: Vacancy; onDelete: () => void; onTogglePause: () => void; busy: boolean;
  expanded: boolean; handleToggle: () => void;
  analytics: VacancyAnalytics | null;
  matches: AnonMatch[] | null;
  loadingExpand: boolean;
  contactMatch: AnonMatch | null;
  setContactMatch: (m: AnonMatch | null) => void;
  markViewed: (id: string) => void;
  reloadExpand: () => void;
  token: string;
  newCount: number;
}) {
  const t = useT(DASHBOARD_T);
  const formatSalary = () => {
    const s = v.salary;
    if (!s || (!s.min && !s.max)) return null;
    const cur = s.currency || 'SRD';
    if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
    if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
    return `${cur} ${t.salaryTo} ${s.max!.toLocaleString()}`;
  };
  const salary = formatSalary();
  const created = new Date(v.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
  const isPaused = v.isActive === false;

  return (
    <div
      id={`vacancy-${v._id}`}
      className={cn(
        'bg-white border-2 transition-all',
        isPaused
          ? 'border-slate-200 opacity-70'
          : newCount > 0
            ? 'border-blue-600 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.18)]'
            : 'border-slate-100 hover:border-blue-600',
      )}
    >
      <div className="p-6 flex items-start justify-between gap-4 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex-wrap">
            {isPaused ? (
              <><Pause className="w-3 h-3 text-slate-400" /> <span className="text-slate-500">{t.paused}</span></>
            ) : (
              <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t.active}</>
            )}
            <span className="text-slate-300">·</span>
            <Calendar className="w-3 h-3" /> {created}
            {newCount > 0 && !isPaused && (
              <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 ml-2 text-[10px] tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-2.5 h-2.5" />
                {t.newMatches(newCount)}
              </span>
            )}
            {!isPaused && analytics && analytics.suggestedPending > 0 && newCount === 0 && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 ml-2 text-[10px] tracking-widest border border-purple-300">
                <Sparkles className="w-2.5 h-2.5" /> {t.matchedByTeam}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-blue-600 transition-colors">{v.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {v.company && (
              <span className="flex items-center gap-2"><Building2 className="w-3 h-3 text-blue-600" /> {v.company}</span>
            )}
            {v.location && (
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-600" /> {v.location}</span>
            )}
            {salary && (
              <span className="flex items-center gap-2 text-black"><DollarSign className="w-3 h-3 text-emerald-600" /> {salary}</span>
            )}
            {v.employmentType && <span className="text-blue-600">{v.employmentType}</span>}
            {v.isRemote && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 italic">{t.remote}</span>}
          </div>

          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              <MiniStat icon={Eye} label={t.statViews} value={analytics.viewCount} />
              <MiniStat icon={Mail} label={t.statApplications} value={analytics.applicationCount} />
              <MiniStat icon={Target} label={t.statOurMatches} value={analytics.curatedTotal} accent={analytics.presented > 0 ? 'blue' : undefined} />
              <MiniStat icon={Users} label={t.statJobseekerHits} value={analytics.jobseekerMatchCount} />
            </div>
          )}
        </div>
        <div className="flex items-start gap-1 shrink-0">
          <button
            onClick={onTogglePause}
            disabled={busy}
            className="text-slate-500 hover:bg-slate-100 p-3 disabled:opacity-50 transition-colors"
            aria-label={isPaused ? t.ariaResume : t.ariaPause}
            title={isPaused ? t.titleResume : t.titlePause}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="text-red-600 hover:bg-red-50 p-3 disabled:opacity-50 transition-colors"
            aria-label={t.ariaDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className="w-full border-t border-slate-100 px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-between transition-colors"
      >
        <span className="flex items-center gap-2 text-slate-500">
          <Target className="w-3 h-3 text-blue-600" />
          {t.ourMatchesFor}{analytics ? ` (${analytics.curatedTotal})` : ''}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50"
          >
            <div className="p-6 space-y-4">
              {loadingExpand && !matches ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
              ) : !matches || matches.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 p-8 text-center">
                  <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {t.noMatches}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 italic">
                    {t.noMatchesSub}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map(m => (
                    <CuratedMatchCard
                      key={m._id}
                      match={m}
                      onView={() => markViewed(m._id)}
                      onContactRequest={() => setContactMatch(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactMatch && (
          <ContactRequestModal
            match={contactMatch}
            vacancyTitle={v.title}
            token={token}
            onClose={() => setContactMatch(null)}
            onSuccess={() => {
              setContactMatch(null);
              reloadExpand();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent }: { icon: typeof Eye; label: string; value: number; accent?: 'blue' }) {
  return (
    <div className={cn(
      'border-2 px-3 py-2',
      accent === 'blue' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50',
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-3 h-3', accent === 'blue' ? 'text-blue-600' : 'text-slate-400')} />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className={cn('text-2xl font-black tracking-tighter italic leading-none', accent === 'blue' ? 'text-blue-600' : 'text-black')}>{value}</p>
    </div>
  );
}

function CuratedMatchCard({
  match, onView, onContactRequest,
}: {
  match: AnonMatch; onView: () => void; onContactRequest: () => void;
}) {
  const t = useT(DASHBOARD_T);
  const isNew = match.status === 'presented';
  const isContactRequested = match.status === 'contact-requested';
  const isContactShared = match.status === 'contact-shared';
  const cv = match.cv;
  const added = new Date(match.addedAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' });
  const sharedAt = match.contactSharedAt
    ? new Date(match.contactSharedAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
    : null;

  return (
    <div
      onClick={isNew ? onView : undefined}
      className={cn(
        'bg-white border-2 p-5 transition-all relative',
        isNew ? 'border-blue-600 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.15)] cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.25)]' : 'border-slate-200',
      )}
    >
      {isNew && (
        <span className="absolute -top-2 -left-2 bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-2 border-black">
          {t.badgeNew}
        </span>
      )}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest">
            <span className="bg-slate-900 text-white px-2 py-0.5">CV #{cv.id.slice(-6)}</span>
            <span className="text-slate-400">·</span>
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500">{added}</span>
            {isContactRequested && (
              <>
                <span className="text-slate-300">·</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t.contactRequested}
                </span>
              </>
            )}
            {isContactShared && (
              <>
                <span className="text-slate-300">·</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 inline-flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> {t.contactShared}{sharedAt ? ` · ${sharedAt}` : ''}
                </span>
              </>
            )}
          </div>
          <h4 className="text-xl font-black uppercase tracking-tighter italic mb-2">{cv.jobTitle}</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            {cv.location && (
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-600" /> {cv.location}</span>
            )}
            {cv.yearsExperience !== undefined && cv.yearsExperience > 0 && (
              <span className="flex items-center gap-2"><Briefcase className="w-3 h-3 text-blue-600" /> {t.yearsExp(cv.yearsExperience)}</span>
            )}
            {cv.educationLevel && (
              <span className="flex items-center gap-2"><GraduationCap className="w-3 h-3 text-blue-600" /> {cv.educationLevel}</span>
            )}
          </div>
          {cv.summary && (
            <p className="text-sm font-bold text-slate-600 mb-3 line-clamp-2">{cv.summary}</p>
          )}
          {cv.topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {cv.topSkills.slice(0, 8).map(s => (
                <span key={s} className="text-[10px] font-black bg-slate-50 border border-slate-200 px-2 py-0.5">{s}</span>
              ))}
            </div>
          )}
          {match.adminNote && (
            <div className="mt-3 bg-blue-50 border-l-4 border-blue-600 p-3">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{t.noteFrom}</p>
              <p className="text-[11px] font-bold text-slate-700">{match.adminNote}</p>
            </div>
          )}
          {isContactShared && match.contactSharedNote && (
            <div className="mt-3 bg-emerald-50 border-l-4 border-emerald-600 p-3">
              <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">{t.messageFromTeam}</p>
              <p className="text-[11px] font-bold text-slate-700">{match.contactSharedNote}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 self-stretch lg:self-center shrink-0">
          {match.matchScore !== undefined && match.matchScore > 0 && (
            <div className="text-right">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.matchLabel}</div>
              <div className={cn(
                'text-3xl font-black leading-none italic',
                match.matchScore >= 70 ? 'text-blue-600' : match.matchScore >= 50 ? 'text-emerald-600' : 'text-slate-700',
              )}>
                {match.matchScore}%
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onContactRequest(); }}
            disabled={isContactRequested || isContactShared}
            className={cn(
              'px-5 py-3 font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 whitespace-nowrap',
              isContactShared
                ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                : isContactRequested
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-blue-600',
            )}
          >
            {isContactShared ? <>{t.contactShared} <CheckCheck className="w-3 h-3" /></>
              : isContactRequested ? t.sent
              : <>{t.requestContact} <ArrowRight className="w-3 h-3" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactRequestModal({
  match, vacancyTitle, token, onClose, onSuccess,
}: {
  match: AnonMatch; vacancyTitle: string; token: string;
  onClose: () => void; onSuccess: () => void;
}) {
  const t = useT(DASHBOARD_T);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/employer/curated-matches/${match._id}/request-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': token },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || t.errRequest);
        return;
      }
      setDone(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errRequest);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white border-4 border-black w-full max-w-lg shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
      >
        <div className="bg-black text-white p-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t.requestContactTitle}</p>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">CV #{match.cv.id.slice(-6)}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
              <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-2">{t.requestSent}</h4>
              <p className="text-sm font-bold text-slate-500">{t.willContactSoon}</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-600">
                {t.requestContactLead} <strong>{match.cv.jobTitle}</strong> ({match.cv.location}) {t.requestContactMid} <strong>{vacancyTitle}</strong>.
              </p>
              <p className="text-[11px] font-bold text-slate-400 italic">
                {t.requestContactHelp}
              </p>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">{t.noteLabel}</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  rows={4}
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              {error && (
                <p className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.confirmRequest}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border-2 border-black px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-colors"
                >
                  {t.cancelShort}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
