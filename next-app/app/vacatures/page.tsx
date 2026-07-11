'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Building2, 
  ChevronRight, 
  Sparkles,
  MessageCircle,
  DollarSign,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { cn, formatNumber, normalizeEmploymentType } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';
import { buildWhatsAppUrl, SUPPORT_EMAIL } from '@/lib/config';
import { useT } from '@/lib/i18n/LanguageProvider';

// Bovengrens van de salaris-slider. "Uit" (= alles tonen) zodra de slider hier staat.
const SALARY_MAX = 500000;

const VACATURES_T = {
  nl: {
    heroA: 'Vind je',
    heroHighlight: 'Perfecte Match',
    heroSubtitle: 'Blader door geverifieerde vacatures in de meest invloedrijke sectoren van Suriname.',
    searchPlaceholder: 'Functie of Bedrijf...',
    search: 'Zoeken',
    typeHeading: 'Type Dienstverband',
    locationHeading: 'Locatie',
    salaryHeading: 'Salaris Filter',
    salaryHint: 'Filter op maximaal maandsalaris',
    jobAlert: 'Job Alert',
    jobAlertDesc: 'Ontvang direct een melding zodra er nieuwe vacatures in jouw sector zijn.',
    emailPlaceholder: 'E-mailadres...',
    activateAlert: 'Activeer Alert',
    invalidEmail: 'Voer eerst een geldig e-mailadres in.',
    alertActivated: 'Job alert geactiveerd voor',
    inlineSearchPlaceholder: 'Zoek op titel, bedrijf of trefwoorden...',
    allWord: 'Alle',
    vacaturesWord: 'Vacatures',
    sortByLabel: 'Sorteer op:',
    viaJobParsing: 'Via JobParsing',
    mediatedByUs: 'Bemiddeld door ons',
    viaJobParsingDesc: 'Deze vacature wordt bemiddeld door het JobParsing-team. Wij nemen contact met je op na je sollicitatie.',
    verified: 'Geverifieerd',
    trustFactorHigh: 'Trust Factor: High',
    verifiedDesc: 'Geverifieerde partners ondergaan een identiteitscheck om veiligheid te waarborgen.',
    whatsapp: 'WhatsApp',
    details: 'Details',
    emptyTitle: 'Geen vacatures gevonden voor deze zoekopdracht.',
    emptyBody: 'No worries — upload je cv, dagelijks worden er nieuwe vacatures geüpload en matchen wij je automatisch zodra er iets past.',
    uploadCv: 'Upload je CV',
    previous: 'Vorige',
    next: 'Volgende',
    footerTagline: 'De meest geavanceerde talent hub van Suriname. Powered by AI-driven insights.',
    platform: 'Platform',
    vacaturesLink: 'Vacatures',
    cvUploadLink: 'CV Upload',
    mijnMatchesLink: 'Mijn Matches',
    help: 'Hulp',
    faq: 'FAQ',
    contact: 'Contact',
    overOns: 'Over Ons',
    terms: 'Algemene Voorwaarden',
    privacy: 'Privacyverklaring',
    rights: '© 2026 Jobparsing. Alle rechten voorbehouden.',
  },
  en: {
    heroA: 'Find your',
    heroHighlight: 'Perfect Match',
    heroSubtitle: 'Browse verified vacancies across the most influential sectors in Suriname.',
    searchPlaceholder: 'Role or Company...',
    search: 'Search',
    typeHeading: 'Employment Type',
    locationHeading: 'Location',
    salaryHeading: 'Salary Filter',
    salaryHint: 'Filter by maximum monthly salary',
    jobAlert: 'Job Alert',
    jobAlertDesc: 'Get notified instantly when new vacancies appear in your sector.',
    emailPlaceholder: 'Email address...',
    activateAlert: 'Activate Alert',
    invalidEmail: 'Please enter a valid email address first.',
    alertActivated: 'Job alert activated for',
    inlineSearchPlaceholder: 'Search by title, company or keywords...',
    allWord: 'All',
    vacaturesWord: 'Vacancies',
    sortByLabel: 'Sort by:',
    viaJobParsing: 'Via JobParsing',
    mediatedByUs: 'Mediated by us',
    viaJobParsingDesc: 'This vacancy is handled by the JobParsing team. We will contact you after you apply.',
    verified: 'Verified',
    trustFactorHigh: 'Trust Factor: High',
    verifiedDesc: 'Verified partners undergo an identity check to guarantee safety.',
    whatsapp: 'WhatsApp',
    details: 'Details',
    emptyTitle: 'No vacancies found for this search.',
    emptyBody: 'No worries — upload your CV, new vacancies are uploaded daily and we match you automatically as soon as something fits.',
    uploadCv: 'Upload your CV',
    previous: 'Previous',
    next: 'Next',
    footerTagline: 'The most advanced talent hub in Suriname. Powered by AI-driven insights.',
    platform: 'Platform',
    vacaturesLink: 'Vacancies',
    cvUploadLink: 'CV Upload',
    mijnMatchesLink: 'My Matches',
    help: 'Help',
    faq: 'FAQ',
    contact: 'Contact',
    overOns: 'About',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Statement',
    rights: '© 2026 Jobparsing. All rights reserved.',
  },
  es: {
    heroA: 'Encuentra tu',
    heroHighlight: 'Coincidencia Perfecta',
    heroSubtitle: 'Explora vacantes verificadas en los sectores más influyentes de Surinam.',
    searchPlaceholder: 'Puesto o Empresa...',
    search: 'Buscar',
    typeHeading: 'Tipo de Empleo',
    locationHeading: 'Ubicación',
    salaryHeading: 'Filtro de Salario',
    salaryHint: 'Filtra por salario mensual máximo',
    jobAlert: 'Alerta de Empleo',
    jobAlertDesc: 'Recibe una notificación al instante cuando haya nuevas vacantes en tu sector.',
    emailPlaceholder: 'Correo electrónico...',
    activateAlert: 'Activar Alerta',
    invalidEmail: 'Primero introduce un correo electrónico válido.',
    alertActivated: 'Alerta de empleo activada para',
    inlineSearchPlaceholder: 'Busca por título, empresa o palabras clave...',
    allWord: 'Todas',
    vacaturesWord: 'Vacantes',
    sortByLabel: 'Ordenar por:',
    viaJobParsing: 'Via JobParsing',
    mediatedByUs: 'Intermediado por nosotros',
    viaJobParsingDesc: 'Esta vacante es gestionada por el equipo de JobParsing. Te contactaremos después de que apliques.',
    verified: 'Verificado',
    trustFactorHigh: 'Trust Factor: High',
    verifiedDesc: 'Los socios verificados pasan una verificación de identidad para garantizar la seguridad.',
    whatsapp: 'WhatsApp',
    details: 'Detalles',
    emptyTitle: 'No se encontraron vacantes para esta búsqueda.',
    emptyBody: 'No te preocupes — sube tu CV, cada día se suben nuevas vacantes y te emparejamos automáticamente en cuanto algo encaje.',
    uploadCv: 'Sube tu CV',
    previous: 'Anterior',
    next: 'Siguiente',
    footerTagline: 'El centro de talento más avanzado de Surinam. Powered by AI-driven insights.',
    platform: 'Plataforma',
    vacaturesLink: 'Vacantes',
    cvUploadLink: 'Subir CV',
    mijnMatchesLink: 'Mis Coincidencias',
    help: 'Ayuda',
    faq: 'FAQ',
    contact: 'Contacto',
    overOns: 'Sobre Nosotros',
    terms: 'Términos y Condiciones',
    privacy: 'Declaración de Privacidad',
    rights: '© 2026 Jobparsing. Todos los derechos reservados.',
  },
};

interface JobCard {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  salaryValue: number | null;
  salaryCurrency: string;
  verified: boolean;
  viaJobParsing: boolean;
  description?: string;
  requirements?: string[];
  postedAt?: string;
}

interface ApiVacancy {
  _id: string;
  title: string;
  description?: string;
  requirements?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  source?: string;
  viaJobParsing?: boolean;
  postedAt?: string;
  createdAt?: string;
}

function formatSalary(s?: ApiVacancy['salary']): string {
  if (!s || (!s.min && !s.max)) return 'Op aanvraag';
  const cur = s.currency || 'SRD';
  if (s.min && s.max) return `${cur} ${formatNumber(s.min)}-${formatNumber(s.max)}`;
  if (s.min) return `${cur} ${formatNumber(s.min)}+`;
  return `${cur} tot ${formatNumber(s.max!)}`;
}

function vacancyToCard(v: ApiVacancy): JobCard {
  const viaJobParsing = Boolean(v.viaJobParsing);
  // Numerieke salariswaarde (bovenkant range) voor het filteren, los van de weergavestring.
  const salaryValue = v.salary?.max ?? v.salary?.min ?? null;
  return {
    id: v._id,
    title: v.title,
    // Company wordt server-side gestript voor anoniem ophalen — toon altijd 'via JobParsing'.
    company: viaJobParsing ? 'Via JobParsing' : (v.company || 'Via JobParsing'),
    location: v.location || 'Locatie onbekend',
    type: normalizeEmploymentType(v.employmentType),
    salary: formatSalary(v.salary),
    salaryValue,
    salaryCurrency: v.salary?.currency || 'SRD',
    verified: Boolean(v.company) && !viaJobParsing,
    viaJobParsing,
    description: v.description,
    requirements: v.requirements ? [v.requirements] : undefined,
    postedAt: v.postedAt || v.createdAt,
  };
}

function VacaturesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT(VACATURES_T);

  const [activeType, setActiveType] = useState('Alle');
  // Zoekterm en locatie komen uit de URL (?q= / ?location=). We lezen ze via
  // useSearchParams i.p.v. window.location zodat ze óók bij client-side navigatie
  // vanaf de homepage direct voorgevuld en toegepast zijn (geen 'opnieuw invullen').
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('Nieuwste');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => searchParams.get('location') || 'Heel Suriname');

  // Houd de filters in sync als de URL-parameters wijzigen (bv. nieuwe zoekopdracht
  // vanaf de homepage terwijl de vacaturepagina al gemount is).
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedLocation(searchParams.get('location') || 'Heel Suriname');
    setCurrentPage(1);
  }, [searchParams]);
  const [jobAlertEmail, setJobAlertEmail] = useState('');
  const [jobAlertMessage, setJobAlertMessage] = useState('');
  const [priceRange, setPriceRange] = useState(SALARY_MAX);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [user, setUser] = useState<{ isLoggedIn?: boolean } | null>(() => readJson('suri_user', null));
  const [savedJobs, setSavedJobs] = useState<string[]>(() => readJson<string[]>('suri_saved_jobs', []));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vacancies?limit=100')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.success) return;
        setJobs((data.vacancies as ApiVacancy[]).map(vacancyToCard));
      })
      .catch(() => { /* ignore — empty list is OK */ });
    return () => { cancelled = true; };
  }, []);

  const refreshVacaturesState = useCallback(() => {
    setUser(readJson('suri_user', null));
    setSavedJobs(readJson<string[]>('suri_saved_jobs', []));
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refreshVacaturesState);
    return () => {
      window.removeEventListener('storage', refreshVacaturesState);
    };
  }, [refreshVacaturesState]);

  const types = ['Alle', ...Array.from(new Set(jobs.map(j => j.type).filter(Boolean)))];
  const LOCATIONS = ['Heel Suriname', 'Paramaribo', 'Wanica', 'Nickerie', 'Commewijne', 'Saramacca', 'Para', 'Marowijne', 'Coronie', 'Brokopondo', 'Sipaliwini'];

  const suggestions = searchQuery.length > 1 
    ? Array.from(new Set(
        jobs.filter(j => 
          j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          j.company.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(j => j.title)
      )).slice(0, 5)
    : [];

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    } else {
      params.delete('q');
    }

    setCurrentPage(1);
    setShowSuggestions(false);
    router.replace(params.toString() ? `/vacatures?${params.toString()}` : '/vacatures');
  };

  const toggleSaveJob = (jobId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];

    setSavedJobs(newSaved);
    writeJson('suri_saved_jobs', newSaved);
    refreshVacaturesState();
  };

  // Zoekterm opsplitsen in losse woorden. Sector-links sturen meerwoords-labels
  // mee ("IT, Data & Digital") die nooit als één letterlijke substring in een
  // vacaturetitel staan — vandaar dat elke sector eerder 0 resultaten gaf. We
  // matchen nu op elk afzonderlijk woord (komma's/&/spaties zijn scheidingstekens)
  // over titel + omschrijving, zodat een sectorklik de relevante vacatures toont.
  const searchTerms = searchQuery.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);

  const filteredJobs = jobs.filter(job => {
    const haystack = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    const matchesSearch = searchTerms.length === 0 || searchTerms.some(term => haystack.includes(term));
    const matchesLocation = selectedLocation === 'Heel Suriname' || String(job.location || '').toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesType = activeType === 'Alle' || job.type === activeType;

    // Salarisfilter: slider op max = geen bovengrens (alles tonen). Anders filteren op de
    // numerieke SRD-waarde. Vacatures zonder salaris ('Op aanvraag') of in een andere valuta
    // (USD/EUR) blijven zichtbaar — die vergelijken we niet tegen een SRD-drempel.
    const matchesPrice =
      priceRange >= SALARY_MAX ||
      job.salaryValue == null ||
      job.salaryCurrency !== 'SRD' ||
      job.salaryValue <= priceRange;

    return matchesSearch && matchesPrice && matchesType && matchesLocation;
  }).sort((a, b) => {
    if (sortBy === 'Salaris') {
      return (b.salaryValue ?? 0) - (a.salaryValue ?? 0);
    }
    // Default: newest first (postedAt desc)
    const tA = a.postedAt ? Date.parse(a.postedAt) : 0;
    const tB = b.postedAt ? Date.parse(b.postedAt) : 0;
    return tB - tA;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  const handleJobAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(jobAlertEmail)) {
      setJobAlertMessage(t.invalidEmail);
      return;
    }
    setJobAlertMessage(`${t.alertActivated} ${jobAlertEmail}.`);
    setJobAlertEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search & Filter Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl xs:text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-6">
              {t.heroA} <br/><span className="text-blue-600 italic underline decoration-white/20 underline-offset-4 sm:underline-offset-8">{t.heroHighlight}</span>
            </h1>
            <p className="text-[10px] md:text-xl font-black uppercase tracking-widest text-slate-400 max-w-2xl mx-auto italic px-4">
              {t.heroSubtitle}
            </p>
          </motion.div>

          <div className="bg-white p-4 md:p-6 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto brutal-card">
            <div className="flex-1 w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-black font-bold uppercase tracking-widest placeholder:text-slate-200 outline-none border-b-2 border-transparent focus:border-blue-600 transition-all text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              {/* Auto-suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50 brutal-card"
                  >
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setCurrentPage(1);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-2 group"
                      >
                        <Search className="w-3 h-3 text-slate-300 group-hover:text-blue-600" />
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-full md:w-auto flex items-center gap-2 border-l-0 md:border-l-2 border-slate-100 pl-0 md:pl-6 bg-white">
              <MapPin className="text-blue-600 w-5 h-5" />
              <select value={selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }} className="bg-transparent text-black font-black uppercase tracking-widest text-xs outline-none cursor-pointer">
                {LOCATIONS.map(loc => <option key={loc}>{loc}</option>)}
              </select>
            </div>
            <button 
              onClick={handleSearch}
              className="brutal-button-primary w-full md:w-auto shadow-none"
            >
              {t.search}
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 translate-x-1/2 border-l border-white/5" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-12 gap-6 sm:gap-12">
          {/* Filters Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">{t.typeHeading}</h3>
              <div className="flex flex-col gap-2">
                {types.map(t => (
                  <label key={t} className="flex items-center gap-3 group cursor-pointer">
                    <div 
                      onClick={() => {
                        setActiveType(t);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "w-5 h-5 border-2 border-black flex items-center justify-center transition-all",
                        activeType === t ? "bg-black text-white" : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      {activeType === t && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span onClick={() => {
                      setActiveType(t);
                      setCurrentPage(1);
                    }} className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      activeType === t ? "text-black" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {t}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">{t.locationHeading}</h3>
              <div className="flex flex-col gap-2">
                {LOCATIONS.map(loc => (
                  <label key={loc} className="flex items-center gap-3 group cursor-pointer">
                    <div
                      onClick={() => {
                        setSelectedLocation(loc);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "w-5 h-5 border-2 border-black flex items-center justify-center transition-all",
                        selectedLocation === loc ? "bg-black text-white" : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      {selectedLocation === loc && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span onClick={() => {
                      setSelectedLocation(loc);
                      setCurrentPage(1);
                    }} className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      selectedLocation === loc ? "text-black" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {loc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">{t.salaryHeading}</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>SRD 0</span>
                  <span>SRD {formatNumber(priceRange)}{priceRange >= SALARY_MAX ? '+' : ''}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={SALARY_MAX}
                  step="5000"
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-2 bg-slate-100 appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                  {t.salaryHint}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-8 border-2 border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic underline decoration-blue-600 decoration-2 underline-offset-4">{t.jobAlert}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
                {t.jobAlertDesc}
              </p>
              <form onSubmit={handleJobAlertSubmit}>
                <input value={jobAlertEmail} onChange={(e) => setJobAlertEmail(e.target.value)} required type="email" placeholder={t.emailPlaceholder} className="w-full bg-white p-3 text-[10px] font-bold border-2 border-slate-200 outline-none focus:border-black mb-4 uppercase tracking-widest" />
                <button type="submit" className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                  {t.activateAlert}
                </button>
              </form>
              {jobAlertMessage && <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">{jobAlertMessage}</p>}
            </div>
          </aside>

          {/* Results Area */}
          <div className="col-span-12 lg:col-span-9 space-y-8">
            {/* Inline Search Bar */}
            <div className="bg-slate-50 p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t.inlineSearchPlaceholder}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 focus:border-black outline-none font-bold uppercase tracking-widest text-xs"
                  />
                </div>
                <button onClick={handleSearch} className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">
                  {t.search}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                {t.allWord} <span className="text-slate-300">{t.vacaturesWord}</span>
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{t.sortByLabel}</span>
                <select 
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="font-black text-black bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <option>Nieuwste</option>
                  <option>Salaris</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
                  {paginatedJobs.map((job) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={job.id} 
                  className="bg-white border-2 border-slate-100 p-8 transition-all relative group shadow-[8px_8px_0px_0px_rgba(241,245,249,1)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.1)] hover:border-blue-600"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {job.viaJobParsing && (
                          <div className="relative group/tooltip">
                            <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 border-2 border-purple-600 italic cursor-help brutal-shadow">
                              <Sparkles className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{t.viaJobParsing}</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-black text-white text-[9px] font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-all z-50 pointer-events-none border-2 border-purple-600 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] scale-95 group-hover/tooltip:scale-100">
                              <div className="flex items-center gap-2 mb-2 text-purple-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t.mediatedByUs}</span>
                              </div>
                              {t.viaJobParsingDesc}
                            </div>
                          </div>
                        )}
                        {!job.viaJobParsing && job.verified && (
                          <div className="relative group/tooltip">
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 border-2 border-blue-600 italic cursor-help brutal-shadow">
                              <Sparkles className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{t.verified}</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-black text-white text-[9px] font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-all z-50 pointer-events-none border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] scale-95 group-hover/tooltip:scale-100">
                              <div className="flex items-center gap-2 mb-2 text-blue-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t.trustFactorHigh}</span>
                              </div>
                              {t.verifiedDesc}
                            </div>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/vacatures/${job.id}`}
                        className="inline-block text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-3 group-hover:text-blue-600 transition-colors italic decoration-slate-100 underline underline-offset-4 decoration-4 break-words hyphens-auto max-w-full"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-3 group/company relative">
                            <div className="w-8 h-8 bg-black text-white flex items-center justify-center border-2 border-blue-600 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)]">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="flex items-center gap-2 text-slate-500">
                              {job.company}
                            </span>
                          </span>
                        </div>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> {job.location}</span>
                        <span className="flex items-center gap-2 text-black"><DollarSign className="w-4 h-4 text-emerald-600" /> {job.salary}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-6 w-full md:w-auto">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          aria-label={`Bewaar vacature ${job.title}`}
                          aria-pressed={savedJobs.includes(job.id)}
                          className={cn(
                            "p-3 border-2 transition-all brutal-shadow",
                            savedJobs.includes(job.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-black text-slate-300 hover:text-black"
                          )}
                        >
                          <Bookmark className={cn("w-5 h-5", savedJobs.includes(job.id) && "fill-current")} />
                        </button>
                      </div>
                      <div className="flex gap-3 w-full">
                        {buildWhatsAppUrl(`Ik heb interesse in de vacature voor ${job.title}`) && (
                          <a
                            href={buildWhatsAppUrl(`Ik heb interesse in de vacature voor ${job.title}`)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-emerald-500 text-white px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all border-2 border-black brutal-shadow"
                          >
                            <MessageCircle className="w-4 h-4" /> {t.whatsapp}
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vacatures/${job.id}`);
                          }}
                          className="flex-1 md:flex-none brutal-button-primary px-8 py-4 text-[11px] shadow-none bg-black text-white hover:bg-blue-600"
                        >
                          {t.details}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredJobs.length === 0 && (
                <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t.emptyTitle}</p>
                  <p className="text-sm font-bold text-slate-600 max-w-md mx-auto mb-8 normal-case tracking-normal">
                    {t.emptyBody}
                  </p>
                  <Link
                    href="/cv-upload"
                    className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                  >
                    <Sparkles className="w-4 h-4" /> {t.uploadCv}
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-10 flex justify-center gap-4">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-24 border-2 border-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  {t.previous}
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-12 h-12 border-2 border-black flex items-center justify-center text-xs font-black transition-all",
                      currentPage === i + 1 ? "bg-black text-white" : "bg-white hover:bg-slate-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-24 border-2 border-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-black text-white px-10 py-12 border-t-8 border-blue-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Jobparsing<span className="text-blue-600">+</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose">
              {t.footerTagline}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 col-span-3">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">{t.platform}</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/vacatures" className="hover:text-blue-600">{t.vacaturesLink}</Link></li>
                <li><Link href="/cv-upload" className="hover:text-blue-600">{t.cvUploadLink}</Link></li>
                <li><Link href="/mijn-matches" className="hover:text-blue-600">{t.mijnMatchesLink}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">{t.help}</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/faq" className="hover:text-blue-600">{t.faq}</Link></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-blue-600">{t.contact}</a></li>
                <li><Link href="/over-ons" className="hover:text-blue-600">{t.overOns}</Link></li>
                <li><Link href="/algemene-voorwaarden" className="hover:text-blue-600">{t.terms}</Link></li>
                <li><Link href="/privacyverklaring" className="hover:text-blue-600">{t.privacy}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          {t.rights}
        </div>
      </footer>
    </div>
  );
}

export default function VacaturesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <VacaturesContent />
    </Suspense>
  );
}
