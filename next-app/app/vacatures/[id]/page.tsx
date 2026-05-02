'use client';

import React, { startTransition, use, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Briefcase, 
  Building2, 
  ChevronLeft, 
  DollarSign,
  Calendar,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  Clock,
  ArrowRight,
  Share2,
  Bookmark,
  CheckCircle2,
  FileText,
  X,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { dedupeBy, isNonEmpty, isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';

const DEFAULT_UPLOADED_CV_NAME = 'CV_Jurgen_Dijkstra_2026.pdf';

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
  postedAt?: string;
  createdAt?: string;
}

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  match: number;
  verified: boolean;
  description?: string;
  requirements?: string[];
  postedAt?: string;
}

function formatSalary(s?: ApiVacancy['salary']): string {
  if (!s || (!s.min && !s.max)) return 'Op aanvraag';
  const cur = s.currency || 'SRD';
  if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
  if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
  return `${cur} tot ${s.max!.toLocaleString()}`;
}

function vacancyToJob(v: ApiVacancy): JobDetail {
  return {
    id: v._id,
    title: v.title,
    company: v.company || 'Onbekend bedrijf',
    location: v.location || 'Locatie onbekend',
    type: v.employmentType || 'Full-time',
    salary: formatSalary(v.salary),
    match: 0,
    verified: Boolean(v.company),
    description: v.description,
    requirements: v.requirements ? v.requirements.split('\n').filter(Boolean) : undefined,
    postedAt: v.postedAt || v.createdAt,
  };
}

function getNextLocalApplicationId(existingApplications: Array<{ id?: number | string }>) {
  const numericIds = existingApplications
    .map((application) => Number(application.id))
    .filter((id) => Number.isFinite(id));

  return (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();
  
  const [job, setJob] = useState<JobDetail | null>(null);
  const [similarJobs, setSimilarJobs] = useState<JobDetail[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [shareFeedback, setShareFeedback] = useState('');
  const [uploadedCvName, setUploadedCvName] = useState(DEFAULT_UPLOADED_CV_NAME);
  const [applyData, setApplyData] = useState({ name: '', email: '' });
  const modalRef = useRef<HTMLDivElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const closeApplyModal = useCallback(() => {
    if (isApplying) return;
    setShowApplyModal(false);
    setIsSuccess(false);
    setApplyErrors({});
    setUploadedCvName(DEFAULT_UPLOADED_CV_NAME);
    setApplyData({ name: user?.name || '', email: user?.email || '' });
  }, [isApplying, user]);

  useDismissibleLayer(showApplyModal && !isApplying, modalRef, closeApplyModal);
  useFocusTrap(showApplyModal, modalRef);

  useEffect(() => {
    let cancelled = false;
    const loadAuthState = () => {
      const saved = readJson<string[]>('suri_saved_jobs', []);
      const storedUser = readJson('suri_user', null);
      startTransition(() => {
        setIsSaved(saved.includes(jobId));
        setUser(storedUser);
      });
    };

    fetch(`/api/vacancies/${jobId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        startTransition(() => {
          setJob(data.success && data.vacancy ? vacancyToJob(data.vacancy as ApiVacancy) : null);
          setHasLoaded(true);
        });
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setJob(null);
            setHasLoaded(true);
          });
        }
      });

    fetch('/api/vacancies?limit=3')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.success) return;
        const others = (data.vacancies as ApiVacancy[])
          .filter(v => v._id !== jobId)
          .slice(0, 2)
          .map(vacancyToJob);
        setSimilarJobs(others);
      })
      .catch(() => { /* ignore */ });

    loadAuthState();
    window.addEventListener('storage', loadAuthState);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', loadAuthState);
    };
  }, [jobId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showApplyModal && !isApplying) {
        closeApplyModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeApplyModal, isApplying, showApplyModal]);

  const toggleSave = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const saved = readJson<string[]>('suri_saved_jobs', []);
    const newSaved = saved.includes(jobId)
      ? saved.filter(id => id !== jobId)
      : [...saved, jobId];

    writeJson('suri_saved_jobs', newSaved);
    setIsSaved(!isSaved);
  };

  const handleShareJob = async () => {
    if (!job) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `/vacatures/${jobId}`;
    const sharePayload = {
      title: `${job.title} bij ${job.company}`,
      text: `Bekijk deze vacature op SuriJobs+: ${job.title} bij ${job.company}`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(sharePayload);
        setShareFeedback('Vacature gedeeld.');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link gekopieerd.');
      } else {
        setShareFeedback('Delen is hier niet beschikbaar.');
      }
    } catch {
      setShareFeedback('Delen geannuleerd.');
    }

    window.setTimeout(() => setShareFeedback(''), 2400);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    const nextErrors: Record<string, string> = {};
    if (!isNonEmpty(applyData.name)) nextErrors.name = 'Naam is verplicht.';
    if (!isValidEmail(applyData.email)) nextErrors.email = 'Voer een geldig e-mailadres in.';
    const existingApplications = readJson<any[]>('suri_applications', []);
    const normalizedEmail = applyData.email.trim().toLowerCase();
    if (existingApplications.some((application) => application.jobId === job.id && String(application.email || '').trim().toLowerCase() === normalizedEmail)) {
      nextErrors.form = 'Je hebt al op deze vacature gesolliciteerd.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setApplyErrors(nextErrors);
      return;
    }
    setApplyErrors({});
    setIsApplying(true);
    
    setTimeout(() => {
      setIsApplying(false);
      setIsSuccess(true);
      
      const newApp = {
        id: getNextLocalApplicationId(existingApplications),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        candidateName: applyData.name.trim(),
        email: normalizedEmail,
        status: 'In Review',
        appliedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
      };
      writeJson('suri_applications', dedupeBy([newApp, ...existingApplications], (item) => `${item.jobId}-${item.email}`));

      setTimeout(() => {
        closeApplyModal();
      }, 2000);
    }, 1500);
  };

  if (!hasLoaded) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white border-4 border-black p-10 text-center shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Vacature niet gevonden</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-8">
          Deze vacature bestaat niet meer of kon niet worden geladen.
        </p>
        <Link href="/vacatures" className="inline-flex items-center gap-2 bg-black text-white px-6 py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
          <ChevronLeft className="w-4 h-4" /> Terug naar vacatures
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Hero Header */}
      <div className="bg-black text-white pt-16 pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/vacatures" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Terug naar overzicht
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                {job.verified && (
                  <div className="flex items-center gap-2 text-blue-400 italic">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Employer</span>
                  </div>
                )}
              </div>
              <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8 italic">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
                 <span className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" /> {job.company}
                 </span>
                 <span className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" /> {job.location}
                 </span>
                 <span className="flex items-center gap-3 text-white">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> {job.salary}
                 </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-6 w-full lg:w-auto">
               <div className="p-6 bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Match Score</span>
                  <span className="text-6xl font-black text-blue-600 italic leading-none">{job.match}%</span>
               </div>
               <div className="flex gap-4 w-full lg:w-auto">
                  <button 
                    onClick={toggleSave}
                    className={cn(
                      "p-5 border-2 transition-all",
                      isSaved ? "bg-red-50 text-red-500 border-red-200" : "bg-white text-black border-white hover:bg-slate-100"
                    )}
                  >
                     <Bookmark className={cn("w-6 h-6", isSaved && "fill-current")} />
                  </button>
                  <button 
                    onClick={() => {
                      if (!user) {
                        router.push('/auth');
                        return;
                      }
                      setApplyErrors({});
                      setUploadedCvName(DEFAULT_UPLOADED_CV_NAME);
                      setApplyData({ name: user.name || '', email: user.email || '' });
                      setShowApplyModal(true);
                    }}
                    className={cn(
                      "flex-1 px-12 py-5 font-black uppercase tracking-widest text-sm transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3",
                      !user ? "bg-slate-200 text-slate-500 border-2 border-slate-300 hover:bg-black hover:text-white" : "bg-blue-600 text-white hover:bg-white hover:text-black border-2 border-transparent"
                    )}
                  >
                    {!user && <Building2 className="w-4 h-4" />}
                    {user ? "Direct Solliciteren" : "Inloggen om te Solliciteren"}
                  </button>
               </div>
            </div>
          </div>
        </div>
        <Zap className="absolute -bottom-20 -right-20 w-96 h-96 text-white/5 -rotate-12 pointer-events-none" />
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-12 gap-12">
           <div className="col-span-12 lg:col-span-8 space-y-12">
              <div className="bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)]">
                 <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-slate-100 pb-4">Functieomschrijving</h2>
                 <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-p:font-bold prose-p:text-slate-600 prose-li:font-bold prose-li:text-slate-600 mb-12">
                    <ReactMarkdown>
                      {job.description || "Geen gedetailleerde omschrijving beschikbaar voor deze positie. Neem contact op met de werkgever voor meer informatie."}
                    </ReactMarkdown>
                  </div>


                 <h3 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-blue-600" /> Vereisten
                 </h3>
                 <ul className="space-y-4 mb-12">
                   {(job.requirements || ['Ervaring in een relevante sector', 'Sterke communicatieve vaardigheden', 'Woonachtig in Suriname']).map((req: string, i: number) => (
                     <li key={i} className="flex items-start gap-4 text-sm font-bold text-slate-500 bg-slate-50 p-4 border-l-4 border-blue-600">
                        <ArrowRight className="w-5 h-5 shrink-0 text-blue-600" />
                        {req}
                     </li>
                   ))}
                 </ul>

                 <div className="grid md:grid-cols-2 gap-8 pt-8 border-t-4 border-slate-100">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-blue-600 border-2 border-slate-100"><Clock className="w-8 h-8" /></div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                          <p className="text-sm font-black uppercase tracking-widest">Direct Beschikbaar</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-emerald-600 border-2 border-slate-100"><DollarSign className="w-8 h-8" /></div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                          <p className="text-sm font-black uppercase tracking-widest">{job.type}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Company Preview Card */}
              <div className="bg-slate-900 text-white p-12 border-b-8 border-blue-600 flex flex-col md:flex-row justify-between items-center gap-12">
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-4 italic">Over de Werkgever</h3>
                    <h4 className="text-4xl font-black uppercase tracking-tighter italic mb-4">{job.company}</h4>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mb-8">
                       Een van de meest gerespecteerde organisaties in Suriname, gedreven door innovatie en lokale groei.
                    </p>
                    <Link href={`/vacatures?q=${encodeURIComponent(job.company)}`} className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border-2 border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all">
                       Meer van dit bedrijf <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
                 <div className="w-32 h-32 bg-white border-8 border-blue-600 flex items-center justify-center text-black font-black text-4xl -rotate-6 shadow-[16px_16px_0px_0px_rgba(59,130,246,0.2)]">
                    {job.company[0]}
                 </div>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4 space-y-12">
              {/* Highlights Box */}
              <div className="bg-white border-2 border-black p-8">
                 <h3 className="text-xs font-black uppercase tracking-widest mb-8 italic underline decoration-blue-600 decoration-4 underline-offset-8">Job Highlights</h3>
                 <div className="space-y-6">
                    {[
                      { icon: Globe, label: 'Locatie', val: job.location },
                      { icon: Briefcase, label: 'Dienstverband', val: job.type },
                      { icon: Calendar, label: 'Geplaatst', val: job.postedAt || 'Vandaag' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-blue-600 rounded-sm">
                            <item.icon className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                            <p className="text-[11px] font-black uppercase tracking-widest">{item.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <button
                    type="button"
                    onClick={handleShareJob}
                    className="w-full mt-12 bg-black text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                 >
                    <Share2 className="w-4 h-4" /> Deel Vacature
                 </button>
                 {shareFeedback && (
                   <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-600">
                     {shareFeedback}
                   </p>
                 )}
              </div>

              {/* Similar Jobs Simulation */}
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic">Vergelijkbare Vacatures</h3>
                 {similarJobs.map(j => (
                   <Link key={j.id} href={`/vacatures/${j.id}`} className="block bg-white border-2 border-slate-100 p-6 hover:border-black transition-all group">
                      <h4 className="text-lg font-black uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors mb-3">{j.title}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{j.company} • {j.location}</p>
                   </Link>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeApplyModal} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              ref={modalRef}
              className="bg-white w-full max-w-2xl relative z-10 border-4 border-black p-12 shadow-[32px_32px_0px_0px_rgba(59,130,246,1)]"
            >
              <button 
                onClick={closeApplyModal}
                aria-label="Sluit sollicitatieformulier"
                className="absolute top-8 right-8 p-2 hover:bg-slate-100 transition-colors"
                disabled={isApplying}
              >
                <X className="w-8 h-8" />
              </button>

              {isSuccess ? (
                <div className="text-center py-10">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-emerald-500 shadow-[12px_12px_0px_0px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-4">SOLLICITATIE VERZONDEN!</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10 max-w-sm mx-auto">
                    Je profiel en documenten zijn succesvol gedeeld met {job.company}.
                  </p>
                  <button onClick={closeApplyModal} className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                    Sluiten
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-8">
                   <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none border-b-4 border-slate-100 pb-6 mb-8">
                     Solliciteren bij <span className="text-blue-600">{job.company}</span>
                   </h2>

                   <div className="bg-slate-50 p-8 border-l-8 border-blue-600">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Functie</p>
                      <p className="text-xl font-black uppercase tracking-tight italic">{job.title}</p>
                   </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest">Naam</label>
                         <input 
                           required 
                           type="text"
                           value={applyData.name} 
                           onChange={(e) => setApplyData(prev => ({ ...prev, name: e.target.value }))}
                           className={cn("w-full p-4 border-2 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all uppercase tracking-widest", applyErrors.name ? "border-red-500" : "border-slate-100")} 
                         />
                         {applyErrors.name && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{applyErrors.name}</p>}
                       </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest">E-mail</label>
                         <input 
                           required 
                           type="email"
                           value={applyData.email} 
                           onChange={(e) => setApplyData(prev => ({ ...prev, email: e.target.value }))}
                           className={cn("w-full p-4 border-2 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all uppercase tracking-widest", applyErrors.email ? "border-red-500" : "border-slate-100")} 
                         />
                         {applyErrors.email && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{applyErrors.email}</p>}
                       </div>
                    </div>
                    {applyErrors.form && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{applyErrors.form}</p>}

                   <div className="bg-slate-50 p-8 border-2 border-dashed border-slate-200">
                      <input
                        ref={cvInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setUploadedCvName(file.name);
                        }}
                      />
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border-2 border-slate-100 flex items-center justify-center text-blue-600">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[11px] font-black uppercase tracking-widest">{uploadedCvName}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Geverifieerd door SuriJobs+ AI</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cvInputRef.current?.click()}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                        >
                          Wijzig
                        </button>
                      </div>
                   </div>

                   <button 
                     disabled={isApplying}
                     type="submit"
                     className="w-full bg-blue-600 text-white py-6 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,0.3)] flex items-center justify-center gap-4 disabled:opacity-50"
                   >
                     {isApplying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "NU SOLLICITEREN"}
                   </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
