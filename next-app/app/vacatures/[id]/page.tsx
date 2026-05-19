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
  Upload,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { dedupeBy, isNonEmpty, isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const APPLY_MAX_FILE_BYTES = 4.5 * 1024 * 1024;

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
  const searchParams = useSearchParams();
  const cvIdFromUrl = searchParams.get('cvId');
  const autoApply = searchParams.get('apply') === '1';

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
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [applyData, setApplyData] = useState({ name: '', email: '' });
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [linkedCvName, setLinkedCvName] = useState<string | null>(null);
  const [linkedCvEmail, setLinkedCvEmail] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const closeApplyModal = useCallback(() => {
    if (isApplying) return;
    setShowApplyModal(false);
    setIsSuccess(false);
    setApplyErrors({});
    setUploadedCvName(null);
    setApplyFile(null);
    setApplyData({ name: user?.name || '', email: user?.email || linkedCvEmail || '' });
  }, [isApplying, user, linkedCvEmail]);

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

    if (cvIdFromUrl) {
      const stored = readJson<{ _id?: string; fullName?: string; email?: string } | null>('jobparsing_last_cv', null);
      if (stored && stored._id === cvIdFromUrl) {
        setLinkedCvName(stored.fullName || null);
        setLinkedCvEmail(stored.email || null);
      } else {
        setLinkedCvName('Je geüploade CV');
      }
    }

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

  useEffect(() => {
    if (autoApply && hasLoaded && job && !showApplyModal && !isSuccess) {
      setApplyData({
        name: user?.name || linkedCvName || '',
        email: user?.email || linkedCvEmail || '',
      });
      setShowApplyModal(true);
    }
  }, [autoApply, hasLoaded, job, showApplyModal, isSuccess, user, linkedCvName, linkedCvEmail]);

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
      title: job.title,
      text: `Bekijk deze vacature op Jobparsing+: ${job.title}`,
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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    const nextErrors: Record<string, string> = {};
    if (!isNonEmpty(applyData.name)) nextErrors.name = 'Naam is verplicht.';
    if (!isValidEmail(applyData.email)) nextErrors.email = 'Voer een geldig e-mailadres in.';
    if (!cvIdFromUrl && !applyFile) {
      nextErrors.file = 'Upload je CV om te kunnen solliciteren.';
    }
    if (applyFile && applyFile.size > APPLY_MAX_FILE_BYTES) {
      nextErrors.file = 'CV is te groot (max 4.5 MB).';
    }
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

    try {
      const payload: Record<string, unknown> = {
        vacancyId: job.id,
        applicantName: applyData.name.trim(),
        applicantEmail: normalizedEmail,
      };
      if (cvIdFromUrl) {
        payload.cvId = cvIdFromUrl;
      } else if (applyFile) {
        payload.fileName = applyFile.name;
        payload.fileType = applyFile.type || 'application/octet-stream';
        payload.fileSize = applyFile.size;
        payload.fileData = await readFileAsBase64(applyFile);
      }
      const res = await fetch('/api/apply-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data: { success?: boolean; message?: string; cvId?: string | null } = {};
      try {
        data = await res.json();
      } catch {
        setApplyErrors({ form: `Onverwachte response (HTTP ${res.status})` });
        setIsApplying(false);
        return;
      }
      if (!data.success) {
        setApplyErrors({ form: data.message || 'Sollicitatie mislukt.' });
        setIsApplying(false);
        return;
      }

      const newApp = {
        id: getNextLocalApplicationId(existingApplications),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        candidateName: applyData.name.trim(),
        email: normalizedEmail,
        status: 'In Review',
        appliedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' }),
      };
      writeJson('suri_applications', dedupeBy([newApp, ...existingApplications], (item) => `${item.jobId}-${item.email}`));

      if (data.cvId) {
        writeJson('jobparsing_last_cv', { _id: data.cvId, fullName: applyData.name.trim(), email: normalizedEmail });
      }

      setIsApplying(false);
      setIsSuccess(true);
    } catch (err) {
      setApplyErrors({ form: err instanceof Error ? err.message : 'Sollicitatie mislukt.' });
      setIsApplying(false);
    }
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
              <h1 className="text-3xl sm:text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8 italic">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
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
                      setApplyErrors({});
                      setUploadedCvName(null);
                      setApplyFile(null);
                      setApplyData({
                        name: user?.name || linkedCvName || '',
                        email: user?.email || linkedCvEmail || '',
                      });
                      setShowApplyModal(true);
                    }}
                    className="flex-1 px-12 py-5 font-black uppercase tracking-widest text-sm transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-black border-2 border-transparent"
                  >
                    <Sparkles className="w-4 h-4" />
                    Direct Solliciteren
                  </button>
               </div>
            </div>
          </div>
        </div>
        <Zap className="absolute -bottom-20 -right-20 w-96 h-96 text-white/5 -rotate-12 pointer-events-none" />
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-12 gap-6 sm:gap-12">
           <div className="col-span-12 lg:col-span-8 space-y-8 sm:space-y-12">
              <div className="bg-white border-4 border-black p-6 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)]">
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

              {/* Company Preview Card — generiek (identiteit geheim) */}
              <div className="bg-slate-900 text-white p-12 border-b-8 border-blue-600 flex flex-col md:flex-row justify-between items-center gap-12">
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-4 italic">Over de Werkgever</h3>
                    <h4 className="text-4xl font-black uppercase tracking-tighter italic mb-4">Geverifieerde Werkgever</h4>
                    <p className="text-slate-400 font-bold text-sm max-w-sm">
                       De identiteit van de werkgever wordt na een succesvolle match via Jobparsing+ gedeeld.
                       Solliciteer hier om in contact te komen.
                    </p>
                 </div>
                 <div className="w-32 h-32 bg-white border-8 border-blue-600 flex items-center justify-center text-black -rotate-6 shadow-[16px_16px_0px_0px_rgba(59,130,246,0.2)]">
                    <Building2 className="w-16 h-16" />
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{j.location}</p>
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
              className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto relative z-10 border-4 border-black p-6 sm:p-12 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] sm:shadow-[32px_32px_0px_0px_rgba(59,130,246,1)]"
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
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-3">Sollicitatie verzonden!</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8 max-w-md mx-auto">
                    Je sollicitatie voor <strong>{job.title}</strong> is doorgestuurd naar de werkgever.
                  </p>

                  {!user && (
                    <div className="bg-blue-50 border-4 border-blue-600 p-6 mb-6 text-left">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Tip</p>
                          <p className="text-base font-black uppercase tracking-tight italic mb-1">Maak een account aan</p>
                          <p className="text-[11px] font-bold text-slate-600">
                            Dan kun je je matches blijven bekijken, je sollicitaties volgen en sneller solliciteren op andere vacatures.
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/auth?signup=1&role=candidate&email=${encodeURIComponent(applyData.email)}&name=${encodeURIComponent(applyData.name)}`}
                        className="block w-full bg-blue-600 text-white text-center py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all"
                      >
                        Account aanmaken
                      </Link>
                    </div>
                  )}

                  <button onClick={closeApplyModal} className="border-2 border-black text-black px-10 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all">
                    Sluiten
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-8">
                   <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none border-b-4 border-slate-100 pb-6 mb-8">
                     Solliciteren via <span className="text-blue-600">Jobparsing+</span>
                   </h2>

                   <div className="bg-slate-50 p-8 border-l-8 border-blue-600">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Functie</p>
                      <p className="text-xl font-black uppercase tracking-tight italic">{job.title}</p>
                   </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
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

                   <div className={cn(
                      'bg-slate-50 p-6 border-2',
                      applyErrors.file ? 'border-red-500' : 'border-dashed border-slate-200',
                   )}>
                      <input
                        ref={cvInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setApplyFile(file);
                          setUploadedCvName(file.name);
                          setApplyErrors(prev => ({ ...prev, file: '' }));
                        }}
                      />
                      {cvIdFromUrl ? (
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest">{linkedCvName || 'Je geüploade CV'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Wordt automatisch meegestuurd</p>
                          </div>
                        </div>
                      ) : applyFile ? (
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white border-2 border-slate-100 flex items-center justify-center text-blue-600">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-black uppercase tracking-widest truncate">{uploadedCvName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(applyFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => cvInputRef.current?.click()}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                          >
                            Wijzig
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cvInputRef.current?.click()}
                          className="w-full flex items-center gap-4 text-left hover:bg-slate-100 -m-2 p-2 transition-colors"
                        >
                          <div className="w-12 h-12 bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest">CV uploaden</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF of DOCX, max 4.5 MB</p>
                          </div>
                        </button>
                      )}
                      {applyErrors.file && (
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-red-600">{applyErrors.file}</p>
                      )}
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
