'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import {
  MapPin,
  Sparkles,
  Building2,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Users,
  MessageCircle,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { cn, normalizeEmploymentType } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildWhatsAppUrl, SUPPORT_EMAIL } from '@/lib/config';
import { useT } from '@/lib/i18n/LanguageProvider';

const HOME_T = {
  nl: {
    badge: 'AI-Powered Vacaturebank', heroA: 'Vind je nieuwe', heroHighlight: 'Uitdaging',
    searchPlaceholder: 'Functie, trefwoord of bedrijf...', search: 'Zoeken',
    sectors: 'Sectoren:', allSectors: 'Alle sectoren →',
    employerLead: 'Werkgever?', employerLink: 'Vind direct talent', employerTail: 'via onze geanonimiseerde kandidaat-database.',
    forSeekers: 'Voor werkzoekenden', uploadCv: 'Upload je CV', aiSeconds: 'AI-Matches in seconden',
    uploadDesc: 'Drop je CV en zie direct welke openstaande vacatures bij jouw profiel passen. Geen registratie vooraf.',
    bullet1: 'AI vergelijkt je profiel met alle vacatures', bullet2: 'Top-matches per score, met sollicitatieknop', bullet3: 'Optioneel een account voor follow-up',
    buildCv: 'Of bouw een nieuw CV', fileHint: 'PDF · DOCX · max 4.5 MB',
    resultsFor: 'Resultaten voor', recent: 'Recente Vacatures', viewAll: 'Bekijk Alle →',
    verified: 'Geverifieerd', employerLabel: 'Werkgever', details: 'Details', viewAllJobs: 'Bekijk Alle Vacatures',
    whyA: 'Waarom de traditionele vacaturebanken', whyHighlight: 'falen',
    why1t: "Geen 'Schaduw' Bedrijven", why1d: 'Elk bedrijf op Jobparsing+ ondergaat een identiteitscheck. Geen valse beloftes meer.',
    why2t: 'Salaris Transparantie', why2d: 'Wij stimuleren werkgevers om salarisranges te delen. Je tijd is kostbaar.',
    why3t: 'AI-Gedreven Inzicht', why3d: 'Onze algoritmes kijken verder dan trefwoorden. Ze begrijpen loopbaanpaden.',
    footerTagline: 'De meest geavanceerde talent hub van Suriname. Powered by AI-driven insights.',
    districten: 'Districten', proTip: 'Pro Tip', proTipBody: 'Websites in Suriname missen vaak directe communicatie. Wij integreren WhatsApp Direct voor snelle sollicitaties.',
    platform: 'Platform', vacatures: 'Vacatures', cvUploadLink: 'CV Upload', mijnMatches: 'Mijn Matches', overOns: 'Over Ons',
    help: 'Hulp', faq: 'FAQ', contact: 'Contact', terms: 'Algemene Voorwaarden',
    rights: '© 2026 Jobparsing. Alle rechten voorbehouden.',
  },
  en: {
    badge: 'AI-Powered Job Board', heroA: 'Find your next', heroHighlight: 'Challenge',
    searchPlaceholder: 'Role, keyword or company...', search: 'Search',
    sectors: 'Sectors:', allSectors: 'All sectors →',
    employerLead: 'Employer?', employerLink: 'Find talent directly', employerTail: 'through our anonymised candidate database.',
    forSeekers: 'For job seekers', uploadCv: 'Upload your CV', aiSeconds: 'AI matches in seconds',
    uploadDesc: 'Drop your CV and instantly see which open vacancies fit your profile. No sign-up required.',
    bullet1: 'AI compares your profile with all vacancies', bullet2: 'Top matches by score, with an apply button', bullet3: 'Optional account for follow-up',
    buildCv: 'Or build a new CV', fileHint: 'PDF · DOCX · max 4.5 MB',
    resultsFor: 'Results for', recent: 'Recent Vacancies', viewAll: 'View All →',
    verified: 'Verified', employerLabel: 'Employer', details: 'Details', viewAllJobs: 'View All Vacancies',
    whyA: 'Why traditional job boards', whyHighlight: 'fail',
    why1t: 'No “Shadow” Companies', why1d: 'Every company on Jobparsing+ passes an identity check. No more false promises.',
    why2t: 'Salary Transparency', why2d: 'We push employers to share salary ranges. Your time is valuable.',
    why3t: 'AI-Driven Insight', why3d: 'Our algorithms look beyond keywords. They understand career paths.',
    footerTagline: 'The most advanced talent hub in Suriname. Powered by AI-driven insights.',
    districten: 'Districts', proTip: 'Pro Tip', proTipBody: 'Websites in Suriname often lack direct communication. We integrate WhatsApp Direct for fast applications.',
    platform: 'Platform', vacatures: 'Jobs', cvUploadLink: 'CV Upload', mijnMatches: 'My Matches', overOns: 'About',
    help: 'Help', faq: 'FAQ', contact: 'Contact', terms: 'Terms & Conditions',
    rights: '© 2026 Jobparsing. All rights reserved.',
  },
  es: {
    badge: 'Bolsa de empleo con IA', heroA: 'Encuentra tu nuevo', heroHighlight: 'Desafío',
    searchPlaceholder: 'Puesto, palabra clave o empresa...', search: 'Buscar',
    sectors: 'Sectores:', allSectors: 'Todos los sectores →',
    employerLead: '¿Empleador?', employerLink: 'Encuentra talento directamente', employerTail: 'a través de nuestra base de candidatos anonimizada.',
    forSeekers: 'Para candidatos', uploadCv: 'Sube tu CV', aiSeconds: 'Coincidencias con IA en segundos',
    uploadDesc: 'Sube tu CV y ve al instante qué vacantes abiertas encajan con tu perfil. Sin registro previo.',
    bullet1: 'La IA compara tu perfil con todas las vacantes', bullet2: 'Mejores coincidencias por puntuación, con botón de postulación', bullet3: 'Cuenta opcional para seguimiento',
    buildCv: 'O crea un CV nuevo', fileHint: 'PDF · DOCX · máx. 4,5 MB',
    resultsFor: 'Resultados para', recent: 'Vacantes recientes', viewAll: 'Ver todas →',
    verified: 'Verificado', employerLabel: 'Empleador', details: 'Detalles', viewAllJobs: 'Ver todas las vacantes',
    whyA: 'Por qué fallan las bolsas de empleo tradicionales', whyHighlight: '',
    why1t: 'Sin empresas “fantasma”', why1d: 'Cada empresa en Jobparsing+ pasa una verificación de identidad. No más falsas promesas.',
    why2t: 'Transparencia salarial', why2d: 'Impulsamos a los empleadores a compartir rangos salariales. Tu tiempo es valioso.',
    why3t: 'Perspectiva impulsada por IA', why3d: 'Nuestros algoritmos van más allá de las palabras clave. Entienden las trayectorias profesionales.',
    footerTagline: 'El hub de talento más avanzado de Surinam. Impulsado por IA.',
    districten: 'Distritos', proTip: 'Consejo', proTipBody: 'Los sitios web en Surinam a menudo carecen de comunicación directa. Integramos WhatsApp Direct para postulaciones rápidas.',
    platform: 'Plataforma', vacatures: 'Vacantes', cvUploadLink: 'Subir CV', mijnMatches: 'Mis Coincidencias', overOns: 'Nosotros',
    help: 'Ayuda', faq: 'Preguntas frecuentes', contact: 'Contacto', terms: 'Términos y Condiciones',
    rights: '© 2026 Jobparsing. Todos los derechos reservados.',
  },
};

interface VacancyCard {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  verified: boolean;
  aiMatch: number | null;
  sector: string;
}

interface ApiVacancy {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  employmentType?: string;
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  source?: string;
}

function formatSalary(salary?: ApiVacancy['salary']): string {
  if (!salary || (!salary.min && !salary.max)) return 'Op aanvraag';
  const cur = salary.currency || 'SRD';
  if (salary.min && salary.max) return `${cur} ${salary.min.toLocaleString()}-${salary.max.toLocaleString()}`;
  if (salary.min) return `${cur} ${salary.min.toLocaleString()}+`;
  return `${cur} tot ${salary.max!.toLocaleString()}`;
}

function vacancyToCard(v: ApiVacancy): VacancyCard {
  return {
    id: v._id,
    title: v.title,
    company: 'Werkgever',
    location: v.location || 'Locatie onbekend',
    type: normalizeEmploymentType(v.employmentType),
    salary: formatSalary(v.salary),
    verified: true,
    aiMatch: null,
    sector: '',
  };
}

export default function Home() {
  const router = useRouter();
  const t = useT(HOME_T);
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicJobs, setDynamicJobs] = useState<VacancyCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vacancies?limit=20')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.success) return;
        setDynamicJobs((data.vacancies as ApiVacancy[]).map(vacancyToCard));
      })
      .catch(() => {
        // Empty state is fine for the home preview
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6"
              >
                <Sparkles className="w-3 h-3" />
                {t.badge}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black font-display tracking-tighter text-slate-900 leading-[0.85] uppercase mb-10"
              >
                {t.heroA} <span className="inline-block text-blue-600 italic underline decoration-black decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">{t.heroHighlight}</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col md:flex-row gap-4 items-end mb-10"
              >
                <div className="flex-1 w-full border-b-4 border-black py-2 group focus-within:border-blue-600 transition-colors">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold placeholder:text-slate-300 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        router.push(`/vacatures?q=${encodeURIComponent(searchTerm)}`);
                      }
                    }}
                  />
                </div>
                <Link
                  href={`/vacatures?q=${encodeURIComponent(searchTerm)}`}
                  className="bg-black text-white px-10 py-5 font-black uppercase tracking-tighter hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap text-center"
                >
                  {t.search}
                </Link>
              </motion.div>

              <div className="flex flex-wrap gap-3 items-center text-xs font-bold text-slate-400">
                <span className="uppercase tracking-widest italic">{t.sectors}</span>
                {['Mijnbouw', 'Energie & Water', 'Cybersecurity', 'Transport'].map(tag => (
                  <Link
                    key={tag}
                    href={`/vacatures?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 border border-slate-200 hover:border-black transition-colors cursor-pointer text-slate-600"
                  >
                    {tag}
                  </Link>
                ))}
                <Link href="/sectoren" className="px-3 py-1 text-blue-600 hover:underline uppercase tracking-widest">
                  {t.allSectors}
                </Link>
              </div>

              <p className="mt-6 text-[11px] font-bold text-slate-400 italic">
                {t.employerLead} <Link href="/voor-werkgevers" className="underline hover:text-blue-600">{t.employerLink}</Link> {t.employerTail}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="lg:col-span-1 lg:sticky lg:top-24"
            >
              <div className="relative bg-white border-4 border-black p-7 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
                <div className="absolute -top-3 -left-3 bg-blue-600 text-white px-3 py-1 text-[9px] font-black tracking-[0.2em] uppercase border-2 border-black -rotate-3">
                  {t.forSeekers}
                </div>

                <div className="flex items-center gap-3 mb-5 pt-2">
                  <div className="w-12 h-12 bg-black flex items-center justify-center text-blue-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{t.uploadCv}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{t.aiSeconds}</p>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-600 mb-6 leading-snug">
                  {t.uploadDesc}
                </p>

                <ul className="space-y-2 mb-6 text-[11px] font-bold text-slate-700">
                  {[t.bullet1, t.bullet2, t.bullet3].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/cv-upload"
                  className="block w-full bg-blue-600 text-white text-center py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {t.uploadCv} <ArrowRight className="w-3 h-3" />
                </Link>

                <Link
                  href="/cv-builder"
                  className="mt-3 block w-full text-center py-3 font-black uppercase tracking-widest text-[10px] border-2 border-black hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-3 h-3" /> {t.buildCv}
                </Link>

                <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">
                  {t.fileHint}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Filters */}
          <aside className="lg:w-80 flex-shrink-0 border-r-0 lg:border-r border-slate-200 pr-0 lg:pr-12 pb-12">
            <div className="sticky top-24 space-y-12">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t.districten}</h3>
                <div className="space-y-4">
                  {['Paramaribo', 'Wanica', 'Nickerie', 'Commewijne', 'Para', 'Marowijne', 'Saramacca'].map((district) => (
                    <Link
                      key={district}
                      href={`/vacatures?location=${encodeURIComponent(district)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-5 h-5 border-2 border-slate-300 flex items-center justify-center transition-colors group-hover:border-black shrink-0">
                        <div className="w-2.5 h-2.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-slate-500 group-hover:text-black font-black text-lg uppercase tracking-tight transition-colors">{district}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 border-l-4 border-blue-600">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">{t.proTip}</p>
                <p className="text-sm font-bold leading-relaxed text-slate-900">{t.proTipBody}</p>
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 pb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic underline decoration-blue-600 decoration-4 underline-offset-8">
                {searchTerm ? `${t.resultsFor} "${searchTerm}"` : t.recent}
              </h2>
              <Link href="/vacatures" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">{t.viewAll}</Link>
            </div>

            <div className="grid gap-4">
              {dynamicJobs.slice(0, 5).map((job, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={job.id}
                  onClick={() => router.push(`/vacatures/${job.id}`)}
                  className="group bg-white border border-slate-200 p-6 hover:border-black transition-colors cursor-pointer relative"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Logo placeholder */}
                    <div className="w-16 h-16 bg-black text-blue-600 flex-shrink-0 flex items-center justify-center border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Building2 className="w-7 h-7" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                          {t.employerLabel}
                        </span>
                        {job.verified && (
                          <div className="text-[10px] font-black uppercase tracking-tighter text-blue-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t.verified}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {job.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-4 text-xs font-bold text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-600" /> {job.location}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" /> {job.salary}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-600 uppercase font-black">{job.type}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-6 pt-4 md:pt-0">
                      <div className="flex items-center gap-3">
                        {buildWhatsAppUrl(`Hoi, ik heb interesse in de vacature voor ${job.title}`) && (
                          <a
                            href={buildWhatsAppUrl(`Hoi, ik heb interesse in de vacature voor ${job.title}`)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer group" title="Solliciteer via WhatsApp"
                          >
                            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vacatures/${job.id}`);
                          }}
                          className="border-2 border-black px-6 py-2 font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                        >
                          {t.details}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="pt-8 flex justify-center">
              <Link href="/vacatures" className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                {t.viewAllJobs}
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Why Jobparsing? */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display mb-12 leading-[0.9] uppercase tracking-tighter">
              {t.whyA} <span className="text-blue-500 italic">{t.whyHighlight}</span>.
            </h2>
            <div className="space-y-12">
              {[
                { icon: Users, title: t.why1t, desc: t.why1d },
                { icon: DollarSign, title: t.why2t, desc: t.why2d },
                { icon: Sparkles, title: t.why3t, desc: t.why3d }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-white text-black flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors cursor-default">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight mb-2 italic">{item.title}</h4>
                    <p className="text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white px-10 py-12 border-t-8 border-blue-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-black uppercase tracking-tighter mb-6 block">Jobparsing<span className="text-blue-600">+</span></Link>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose">
              {t.footerTagline}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 col-span-3">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">{t.platform}</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/vacatures" className="hover:text-blue-600 transition-colors">{t.vacatures}</Link></li>
                <li><Link href="/cv-upload" className="hover:text-blue-600 transition-colors">{t.cvUploadLink}</Link></li>
                <li><Link href="/mijn-matches" className="hover:text-blue-600 transition-colors">{t.mijnMatches}</Link></li>
                <li><Link href="/over-ons" className="hover:text-blue-600 transition-colors">{t.overOns}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">{t.help}</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/faq" className="hover:text-blue-600 transition-colors">{t.faq}</Link></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-blue-600 transition-colors">{t.contact}</a></li>
                <li><Link href="/over-ons" className="hover:text-blue-600 transition-colors">{t.overOns}</Link></li>
                <li><Link href="/algemene-voorwaarden" className="hover:text-blue-600 transition-colors">{t.terms}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          <span>{t.rights}</span>
        </div>
      </footer>
    </div>
  );
}
