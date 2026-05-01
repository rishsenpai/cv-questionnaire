'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Globe, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { readJson, writeJson } from '@/lib/storage';
import { COMPANY_PROFILES, findCompanyProfile, matchesCompanyName } from '@/lib/companies';
import { DEMO_JOBS } from '@/lib/jobs';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyName = decodeURIComponent(resolvedParams.id);
  const router = useRouter();
  const companyProfile = useMemo(
    () => findCompanyProfile(companyName) || COMPANY_PROFILES.find((company) => company.name === companyName) || null,
    [companyName]
  );
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<number[]>(() => readJson<number[]>('suri_saved_jobs', []));
  const [isFollowing, setIsFollowing] = useState(false);

  const storageCompanyKey = companyProfile?.name || companyName;

  const loadData = useCallback(() => {
    const storedJobs = readJson<any[]>('suri_jobs', []);
    const allJobs = [...storedJobs, ...DEMO_JOBS];
    const companyJobs = allJobs.filter((job) => matchesCompanyName(job.company, companyName));
    setJobs(companyJobs);

    const saved = readJson<number[]>('suri_saved_jobs', []);
    setSavedJobs(saved);

    const followed = readJson<string[]>('suri_followed_companies', []);
    setIsFollowing(
      followed.includes(storageCompanyKey) ||
      followed.includes(companyName)
    );
  }, [companyName, storageCompanyKey]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    window.addEventListener('storage', loadData);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const toggleSaveJob = (jobId: number) => {
    const storedUser = readJson('suri_user', null);
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    setSavedJobs(newSaved);
    writeJson('suri_saved_jobs', newSaved);
    loadData();
  };

  const toggleFollowCompany = () => {
    const storedUser = readJson('suri_user', null);
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    const followed = readJson<string[]>('suri_followed_companies', []).filter(
      (name) => name !== companyName && name !== storageCompanyKey
    );
    const next = isFollowing
      ? followed
      : [...followed, storageCompanyKey];
    writeJson('suri_followed_companies', next);
    setIsFollowing(next.includes(storageCompanyKey));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Brand Header */}
      <div className="bg-slate-900 text-white pt-20 pb-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/bedrijven" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Terug naar bedrijven
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-12">
            <div className="w-48 h-48 bg-white border-[12px] border-blue-600 flex items-center justify-center text-black font-black text-7xl shadow-[24px_24px_0px_0px_rgba(59,130,246,0.2)] -rotate-6">
               {companyName[0]}
            </div>
            <div className="flex-1 text-center md:text-left">
               <div className="flex flex-col md:flex-row items-center gap-4 mb-6 justify-center md:justify-start">
                  <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">{companyName}</h1>
                  {companyProfile?.verified && (
                    <div className="bg-blue-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                       <ShieldCheck className="w-4 h-4" /> Geverifieerd
                    </div>
                  )}
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600" /> {companyProfile?.location || 'Suriname'}</span>
                  <span className="flex items-center gap-3"><Users className="w-5 h-5 text-blue-600" /> {companyProfile?.employees || '500+'} Werknemers</span>
                  <span className="flex items-center gap-3"><Globe className="w-5 h-5 text-blue-600" /> www.{companyName.toLowerCase().replace(/\s+/g, '')}.sr</span>
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 translate-x-1/2 border-l border-white/5" />
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-12 gap-12">
          {/* Company Info Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            <div className="bg-white border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)]">
               <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8 border-b-2 border-slate-100 pb-4">Bedrijfsstatistieken</h3>
               <div className="space-y-8">
                  {[
                    { label: 'Open Vacatures', val: jobs.length, icon: Briefcase, color: 'text-blue-600' },
                    { label: 'Gem. Match Score', val: '88%', icon: Sparkles, color: 'text-yellow-500' },
                    { label: 'Groei Sector', val: 'High', icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Employer Brand', val: 'A+', icon: Award, color: 'text-purple-600' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                             <stat.icon className={cn("w-5 h-5", stat.color)} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                       </div>
                       <span className="text-lg font-black italic">{stat.val}</span>
                    </div>
                  ))}
               </div>
               
               <button onClick={toggleFollowCompany} className="w-full mt-10 bg-black text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                  {isFollowing ? 'Gevolgd' : 'Volg Bedrijf'}
               </button>
            </div>

            <div className="bg-white border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)]">
               <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8 border-b-2 border-slate-100 pb-4">Top 3 Rollen</h3>
               <div className="flex flex-col gap-3">
                  {(companyProfile?.topRoles || ['Management Specialist', 'Technical Lead', 'Project Coördinator']).map((role, i) => (
                    <div key={i} className="bg-slate-50 border-2 border-slate-100 px-6 py-3 flex items-center justify-between group">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{role}</span>
                       <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
               </div>
               <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic text-center">
                  Gebaseerd op AI-talent data van SuriJobs+
               </p>
            </div>

            <div className="bg-blue-600 text-white p-10 border-b-8 border-black">
               <Zap className="w-10 h-10 mb-6 fill-current" />
               <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4 leading-none">AI-Gedreven Matching voor {companyName}</h3>
               <p className="text-sm font-bold text-blue-100 uppercase tracking-widest leading-relaxed mb-8 italic">
                  Gekwalificeerde kandidaten via SuriJobs+ worden 3x sneller aangenomen door {companyName}.
               </p>
               <Link href="/auth" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-black px-6 py-3 hover:bg-white hover:text-black transition-all">
                  Word ook Matchable <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Job Listings Area */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <div className="bg-white border-4 border-black p-12">
               <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-10 border-b-4 border-slate-50 pb-6 flex items-center gap-4">
                  Open <span className="text-blue-600">Vacatures</span>
                  <span className="text-sm font-black text-slate-300 ml-auto uppercase tracking-widest">({jobs.length})</span>
               </h2>

               <div className="grid gap-8">
                  {jobs.map((job) => (
                    <motion.div 
                      layout
                      key={job.id} 
                      className="group bg-slate-50 border-2 border-transparent hover:border-black p-8 transition-all relative"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-blue-600 transition-colors">
                            <Link href={`/vacatures/${job.id}`}>{job.title}</Link>
                          </h3>
                          <div className="flex flex-wrap gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> {job.location}</span>
                            <span className="flex items-center gap-2 text-black"><Briefcase className="w-4 h-4 text-emerald-600" /> {job.type}</span>
                            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-600" /> {job.sector}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 w-full md:w-auto">
                           <button 
                             onClick={() => toggleSaveJob(job.id)}
                             className={cn(
                               "p-3 border-2 transition-all",
                               savedJobs.includes(job.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-slate-100 text-slate-300 hover:border-black hover:text-black"
                             )}
                           >
                             <Bookmark className={cn("w-5 h-5", savedJobs.includes(job.id) && "fill-current")} />
                           </button>
                           <Link 
                             href={`/vacatures/${job.id}`}
                             className="flex-1 md:flex-none text-center bg-black text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-[6px_6px_0px_0px_rgba(59,130,246,1)]"
                           >
                             Bekijk Details
                           </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
               </div>

               {jobs.length === 0 && (
                 <div className="py-20 text-center border-4 border-dashed border-slate-100">
                    <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-300 italic">Momenteel geen actieve vacatures bij {companyName}.</p>
                 </div>
               )}
            </div>

            {/* Company Bio Section */}
            <div className="bg-white border-4 border-black p-12">
               <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 border-b-4 border-slate-50 pb-4">Over de Organisatie</h3>
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <p className="text-lg font-bold text-slate-600 leading-relaxed italic">
                        {companyProfile?.description || `${companyName} is een toonaangevende speler in de Surinaamse markt, bekend om haar toewijding aan kwaliteit en de ontwikkeling van lokaal talent.`}
                     </p>
                     <p className="text-slate-500 font-medium leading-relaxed">
                        {companyProfile?.sectorDescription || 'Met een rijke historie en een blik op de toekomst, werken we dagelijks aan oplossingen die Suriname verder helpen.'} Onze teams bestaan uit gepassioneerde professionals die samen het verschil maken.
                     </p>
                  </div>
                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
                        <div>
                           <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Innovatie</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altijd op zoek naar betere oplossingen.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
                        <div>
                           <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Impact</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Werken aan de groei van ons land.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
                        <div>
                           <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Ontwikkeling</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investeren in het talent van morgen.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
