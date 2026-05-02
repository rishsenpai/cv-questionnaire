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

function formatSalary(s?: MatchVacancy['salary']): string {
  if (!s || (!s.min && !s.max)) return 'Op aanvraag';
  const cur = s.currency || 'SRD';
  if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
  if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
  return `${cur} tot ${s.max!.toLocaleString()}`;
}

function MatchesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const cvIdFromUrl = params.get('cvId');

  const [activeCvId, setActiveCvId] = useState<string | null>(cvIdFromUrl);
  const [cv, setCv] = useState<{ _id: string; fullName: string; jobTitle?: string } | null>(null);
  const [matches, setMatches] = useState<MatchVacancy[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          setErrorMsg(data.message || 'Matching mislukt.');
          setMatches([]);
          return;
        }
        setCv(data.cv);
        setMatches(data.matches);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg('Verbinding mislukt. Probeer het opnieuw.');
          setMatches([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCvId]);

  void setActiveCvId;
  void router;

  // No CV id in URL — prompt to upload
  if (!activeCvId) {
    return <NoCvState />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-16 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Sparkles className="w-3 h-3" /> AI-Powered Matches
          </div>
          {cv ? (
            <>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
                Matches voor <span className="text-blue-600 italic">{cv.fullName.split(' ')[0]}</span>
              </h1>
              <p className="text-base md:text-lg font-bold text-slate-400 uppercase tracking-tight italic">
                Op basis van je CV-inhoud — gerangschikt op AI similarity score.
              </p>
            </>
          ) : (
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
              <span className="text-blue-600 italic">Matches laden...</span>
            </h1>
          )}
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-12">
        {loading && (
          <div className="bg-white border-4 border-black p-16 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest">Vacatures vergelijken met je CV...</p>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="bg-white border-4 border-red-500 p-12 shadow-[16px_16px_0px_0px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">Probleem opgetreden</h3>
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
                  Vacaturepool
                </h2>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                  {matches.length === 0 ? 'Nog geen matches' : `Top ${matches.length} matches`}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
                  Gerangschikt op AI similarity met je profiel.
                </p>
              </div>
              <Link
                href="/vacatures"
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2"
              >
                Bekijk Alle Vacatures →
              </Link>
            </div>

            {matches.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Geen matchende vacatures gevonden.
                </p>
                <p className="text-[11px] font-bold text-slate-300 mt-2 italic">
                  Mogelijk staan er nog geen vacatures in onze database, of past je CV-profiel niet bij wat er nu open staat.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {matches.map((match, i) => (
                    <MatchCard key={match._id} match={match} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        )}

        {!loading && matches !== null && !errorMsg && (
          <div className="bg-blue-50 border-4 border-blue-600 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3">Vond je niet wat je zocht?</h3>
            <p className="text-sm font-bold text-slate-600 mb-6 max-w-md mx-auto">
              Update je CV met meer details of bouw een nieuwe versie via onze vragenlijst.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cv-upload"
                className="bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
              >
                Nieuwe CV Uploaden
              </Link>
              <Link
                href="/cv-builder"
                className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all"
              >
                CV Bouwen
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match, index }: { match: MatchVacancy; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'bg-white border-2 p-8 transition-all relative group shadow-[8px_8px_0px_0px_rgba(241,245,249,1)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.2)] hover:border-blue-600',
        match.matchScore >= 80 ? 'border-blue-600/40' : 'border-slate-100',
      )}
    >
      {match.matchScore >= 80 && (
        <div className="absolute -top-3 -left-3 bg-blue-600 text-white px-3 py-1 font-black text-[9px] uppercase tracking-widest -rotate-3 border-2 border-black flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Top Match
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-widest">
            {match.company && (
              <span className="flex items-center gap-2 text-slate-500">
                <Building2 className="w-3 h-3 text-blue-600" /> {match.company}
              </span>
            )}
          </div>

          <Link
            href={`/vacatures/${match._id}`}
            className="block text-2xl md:text-3xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-blue-600 transition-colors"
          >
            {match.title}
          </Link>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {match.location && (
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-600" /> {match.location}</span>
            )}
            {match.salary && (match.salary.min || match.salary.max) && (
              <span className="flex items-center gap-2 text-black"><DollarSign className="w-3 h-3 text-emerald-600" /> {formatSalary(match.salary)}</span>
            )}
            {match.employmentType && (
              <span className="text-blue-600">{match.employmentType}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch md:self-center">
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Match</div>
            <div className={cn(
              'text-4xl font-black leading-none italic',
              match.matchScore >= 80 ? 'text-blue-600' : match.matchScore >= 60 ? 'text-emerald-600' : 'text-slate-700',
            )}>
              {match.matchScore}%
            </div>
          </div>
          <Link
            href={`/vacatures/${match._id}`}
            className="bg-black text-white p-4 hover:bg-blue-600 transition-colors"
            aria-label="Bekijk vacature"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function NoCvState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full bg-white border-4 border-black p-12 text-center shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-4">Nog geen CV gevonden</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8 italic">
          Upload of bouw eerst je CV om je AI-matches te zien.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cv-upload"
            className="bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            CV Uploaden
          </Link>
          <Link
            href="/cv-builder"
            className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all"
          >
            CV Bouwen
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
