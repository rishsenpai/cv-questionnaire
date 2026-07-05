'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { writeJson } from '@/lib/storage';
import { trackEvent } from '@/lib/analytics-client';
import { useT } from '@/lib/i18n/LanguageProvider';

const MATCHES_T = {
  nl: {
    badge: 'AI-Powered Matches',
    matchesFor: 'Matches voor',
    heroSubtitle: 'Op basis van je CV-inhoud — gerangschikt op AI similarity score.',
    matchesLoading: 'Matches laden...',
    comparing: 'Vacatures vergelijken met je CV...',
    problemOccurred: 'Probleem opgetreden',
    matchingFailed: 'Matching mislukt.',
    connectionFailed: 'Verbinding mislukt. Probeer het opnieuw.',
    vacancyPool: 'Vacaturepool',
    noMatchesYet: 'Nog geen matches',
    topMatches: (n: number) => `Top ${n} matches`,
    rankedBy: 'Gerangschikt op AI similarity met je profiel.',
    viewAllVacancies: 'Bekijk Alle Vacatures →',
    noMatchingVacancies: 'Geen matchende vacatures gevonden.',
    noMatchingHelp: 'Mogelijk staan er nog geen vacatures in onze database, of past je CV-profiel niet bij wat er nu open staat.',
    didntFind: 'Vond je niet wat je zocht?',
    updateCvHelp: 'Update je CV met meer details of bouw een nieuwe versie via onze vragenlijst.',
    uploadNewCv: 'Nieuwe CV Uploaden',
    buildCv: 'CV Bouwen',
    topMatch: 'Top Match',
    employer: 'Werkgever',
    matchLabel: 'Match',
    apply: 'Solliciteer',
    viewVacancy: 'Bekijk vacature',
    noCvFound: 'Nog geen CV gevonden',
    noCvHelp: 'Upload of bouw eerst je CV om je AI-matches te zien.',
    uploadCv: 'CV Uploaden',
    onRequest: 'Op aanvraag',
    upTo: 'tot',
  },
  en: {
    badge: 'AI-Powered Matches',
    matchesFor: 'Matches for',
    heroSubtitle: 'Based on your CV content — ranked by AI similarity score.',
    matchesLoading: 'Loading matches...',
    comparing: 'Comparing vacancies with your CV...',
    problemOccurred: 'A problem occurred',
    matchingFailed: 'Matching failed.',
    connectionFailed: 'Connection failed. Please try again.',
    vacancyPool: 'Vacancy pool',
    noMatchesYet: 'No matches yet',
    topMatches: (n: number) => `Top ${n} matches`,
    rankedBy: 'Ranked by AI similarity with your profile.',
    viewAllVacancies: 'View All Vacancies →',
    noMatchingVacancies: 'No matching vacancies found.',
    noMatchingHelp: 'There may not be any vacancies in our database yet, or your CV profile may not fit what is currently open.',
    didntFind: 'Didn’t find what you were looking for?',
    updateCvHelp: 'Update your CV with more details or build a new version via our questionnaire.',
    uploadNewCv: 'Upload New CV',
    buildCv: 'Build CV',
    topMatch: 'Top Match',
    employer: 'Employer',
    matchLabel: 'Match',
    apply: 'Apply',
    viewVacancy: 'View vacancy',
    noCvFound: 'No CV found yet',
    noCvHelp: 'Upload or build your CV first to see your AI matches.',
    uploadCv: 'Upload CV',
    onRequest: 'On request',
    upTo: 'up to',
  },
  es: {
    badge: 'Coincidencias con IA',
    matchesFor: 'Coincidencias para',
    heroSubtitle: 'Según el contenido de tu CV — clasificado por puntuación de similitud de IA.',
    matchesLoading: 'Cargando coincidencias...',
    comparing: 'Comparando vacantes con tu CV...',
    problemOccurred: 'Se produjo un problema',
    matchingFailed: 'La coincidencia falló.',
    connectionFailed: 'Error de conexión. Inténtalo de nuevo.',
    vacancyPool: 'Grupo de vacantes',
    noMatchesYet: 'Sin coincidencias todavía',
    topMatches: (n: number) => `Top ${n} coincidencias`,
    rankedBy: 'Clasificado por similitud de IA con tu perfil.',
    viewAllVacancies: 'Ver Todas las Vacantes →',
    noMatchingVacancies: 'No se encontraron vacantes coincidentes.',
    noMatchingHelp: 'Puede que aún no haya vacantes en nuestra base de datos, o que tu perfil de CV no coincida con lo que está disponible ahora.',
    didntFind: '¿No encontraste lo que buscabas?',
    updateCvHelp: 'Actualiza tu CV con más detalles o crea una nueva versión mediante nuestro cuestionario.',
    uploadNewCv: 'Subir Nuevo CV',
    buildCv: 'Crear CV',
    topMatch: 'Mejor Coincidencia',
    employer: 'Empleador',
    matchLabel: 'Coincidencia',
    apply: 'Postularse',
    viewVacancy: 'Ver vacante',
    noCvFound: 'Aún no se encontró ningún CV',
    noCvHelp: 'Sube o crea primero tu CV para ver tus coincidencias con IA.',
    uploadCv: 'Subir CV',
    onRequest: 'Bajo petición',
    upTo: 'hasta',
  },
};

interface ApiCvSummary {
  _id: string;
  fullName: string;
  jobTitle?: string;
  email?: string;
  createdAt: string;
}

interface MatchVacancy {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  employmentType?: string;
  salary?: { min?: number; max?: number; currency?: string };
  source?: string;
  applyLink?: string;
  matchScore: number;
  matchType: string;
}

interface MatchResponse {
  success: boolean;
  cv: { _id: string; fullName: string };
  matches: MatchVacancy[];
  totalVacancies?: number;
  message?: string;
}

function formatSalary(s: MatchVacancy['salary'], labels: { onRequest: string; upTo: string }): string {
  if (!s || (!s.min && !s.max)) return labels.onRequest;
  const cur = s.currency || 'SRD';
  if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
  if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
  return `${cur} ${labels.upTo} ${s.max!.toLocaleString()}`;
}

function MatchesContent() {
  const t = useT(MATCHES_T);
  const params = useSearchParams();
  const router = useRouter();
  const cvIdFromUrl = params.get('cvId');

  const [activeCvId, setActiveCvId] = useState<string | null>(cvIdFromUrl);
  const [cv, setCv] = useState<{ _id: string; fullName: string; jobTitle?: string } | null>(null);
  const [matches, setMatches] = useState<MatchVacancy[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolvingCandidate, setResolvingCandidate] = useState(false);

  // Geen cvId in URL? Probeer via candidate-login te resolven (meest recente CV).
  useEffect(() => {
    if (activeCvId) return;
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('suri_candidate_token');
    if (!token) return;
    setResolvingCandidate(true);
    fetch('/api/candidate/me', { headers: { 'x-candidate-token': token } })
      .then(r => r.json())
      .then((data: { success: boolean; candidate?: { cvs?: Array<{ _id: string }> } }) => {
        if (data.success && data.candidate?.cvs && data.candidate.cvs.length > 0) {
          setActiveCvId(data.candidate.cvs[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setResolvingCandidate(false));
  }, [activeCvId]);

  useEffect(() => {
    if (!activeCvId) return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/cvs/${activeCvId}/matching-vacancies?lang=nl`)
      .then(r => r.json())
      .then((data: MatchResponse) => {
        if (cancelled) return;
        if (!data.success) {
          setErrorMsg(data.message || t.matchingFailed);
          setMatches([]);
          return;
        }
        setCv(data.cv);
        setMatches(data.matches);
        if (data.cv?._id) {
          writeJson('jobparsing_last_cv', { _id: data.cv._id, fullName: data.cv.fullName });
        }
        const highMatches = (data.matches || []).filter(m => (m.matchScore ?? 0) >= 70);
        if (highMatches.length > 0) {
          const topScore = Math.max(...highMatches.map(m => m.matchScore));
          trackEvent('high_match', { metadata: { highMatches: highMatches.length, topScore, total: data.matches?.length || 0 } });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg(t.connectionFailed);
          setMatches([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCvId, t]);

  void router;

  // No CV id in URL — prompt to upload (na candidate-resolve)
  if (!activeCvId) {
    if (resolvingCandidate) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      );
    }
    return <NoCvState />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-16 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </div>
          {cv ? (
            <>
              <h1 className="text-2xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
                {t.matchesFor} <span className="text-blue-600 italic">{cv.fullName.split(' ')[0]}</span>
              </h1>
              <p className="text-base md:text-lg font-bold text-slate-400 uppercase tracking-tight italic">
                {t.heroSubtitle}
              </p>
            </>
          ) : (
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
              <span className="text-blue-600 italic">{t.matchesLoading}</span>
            </h1>
          )}
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-12">
        {loading && (
          <div className="bg-white border-4 border-black p-16 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest">{t.comparing}</p>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="bg-white border-4 border-red-500 p-12 shadow-[16px_16px_0px_0px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">{t.problemOccurred}</h3>
                <p className="text-sm font-bold text-slate-600">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && matches !== null && (
          <section>
            <div className="flex items-end justify-between mb-8 pb-4 border-b-2 border-slate-100">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
                  {t.vacancyPool}
                </h2>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                  {matches.length === 0 ? t.noMatchesYet : t.topMatches(matches.length)}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
                  {t.rankedBy}
                </p>
              </div>
              <Link
                href="/vacatures"
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2"
              >
                {t.viewAllVacancies}
              </Link>
            </div>

            {matches.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  {t.noMatchingVacancies}
                </p>
                <p className="text-[11px] font-bold text-slate-300 mt-2 italic">
                  {t.noMatchingHelp}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {matches.map((match, i) => (
                    <MatchCard key={match._id} match={match} index={i} cvId={activeCvId} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        )}

        {!loading && matches !== null && !errorMsg && (
          <div className="bg-blue-50 border-4 border-blue-600 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3">{t.didntFind}</h3>
            <p className="text-sm font-bold text-slate-600 mb-6 max-w-md mx-auto">
              {t.updateCvHelp}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cv-upload"
                className="bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
              >
                {t.uploadNewCv}
              </Link>
              <Link
                href="/cv-builder"
                className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all"
              >
                {t.buildCv}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match, index, cvId }: { match: MatchVacancy; index: number; cvId: string | null }) {
  const t = useT(MATCHES_T);
  const cvSuffix = cvId ? `?cvId=${cvId}` : '';
  const applySuffix = cvId ? `?cvId=${cvId}&apply=1` : '?apply=1';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'bg-white border-2 p-6 md:p-8 transition-all relative group shadow-[8px_8px_0px_0px_rgba(241,245,249,1)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.2)] hover:border-blue-600',
        match.matchScore >= 80 ? 'border-blue-600/40' : 'border-slate-100',
      )}
    >
      {match.matchScore >= 80 && (
        <div className="absolute -top-3 -left-3 bg-blue-600 text-white px-3 py-1 font-black text-[9px] uppercase tracking-widest -rotate-3 border-2 border-black flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {t.topMatch}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 items-start lg:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2 text-slate-500">
              <Building2 className="w-3 h-3 text-blue-600" /> {t.employer}
            </span>
          </div>

          <Link
            href={`/vacatures/${match._id}${cvSuffix}`}
            className="block text-2xl md:text-3xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-blue-600 transition-colors"
          >
            {match.title}
          </Link>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {match.location && (
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-600" /> {match.location}</span>
            )}
            {match.salary && (match.salary.min || match.salary.max) && (
              <span className="flex items-center gap-2 text-black"><DollarSign className="w-3 h-3 text-emerald-600" /> {formatSalary(match.salary, { onRequest: t.onRequest, upTo: t.upTo })}</span>
            )}
            {match.employmentType && (
              <span className="text-blue-600">{match.employmentType}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 self-stretch lg:self-center w-full lg:w-auto">
          <div className="text-right shrink-0">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.matchLabel}</div>
            <div className={cn(
              'text-4xl font-black leading-none italic',
              match.matchScore >= 80 ? 'text-blue-600' : match.matchScore >= 60 ? 'text-emerald-600' : 'text-slate-700',
            )}>
              {match.matchScore}%
            </div>
          </div>
          <Link
            href={`/vacatures/${match._id}${applySuffix}`}
            className="flex-1 lg:flex-none bg-blue-600 text-white px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <Sparkles className="w-3 h-3" /> {t.apply}
          </Link>
          <Link
            href={`/vacatures/${match._id}${cvSuffix}`}
            className="bg-white border-2 border-black text-black p-4 hover:bg-black hover:text-white transition-colors"
            aria-label={t.viewVacancy}
            title={t.viewVacancy}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function NoCvState() {
  const t = useT(MATCHES_T);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full bg-white border-4 border-black p-12 text-center shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-4">{t.noCvFound}</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8 italic">
          {t.noCvHelp}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cv-upload"
            className="bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {t.uploadCv}
          </Link>
          <Link
            href="/cv-builder"
            className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all"
          >
            {t.buildCv}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MijnMatchesPage() {
  return (
    <Suspense fallback={null}>
      <MatchesContent />
    </Suspense>
  );
}
