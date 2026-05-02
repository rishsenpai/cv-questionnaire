'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';

interface JobCard {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  sector: string;
  match: number;
  verified: boolean;
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
  postedAt?: string;
  createdAt?: string;
}

function formatSalary(s?: ApiVacancy['salary']): string {
  if (!s || (!s.min && !s.max)) return 'Op aanvraag';
  const cur = s.currency || 'SRD';
  if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
  if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
  return `${cur} tot ${s.max!.toLocaleString()}`;
}

function vacancyToCard(v: ApiVacancy): JobCard {
  return {
    id: v._id,
    title: v.title,
    company: v.company || 'Onbekend bedrijf',
    location: v.location || 'Locatie onbekend',
    type: v.employmentType || 'Full-time',
    salary: formatSalary(v.salary),
    sector: v.source === 'adzuna' ? 'Adzuna' : 'Lokaal',
    match: 0,
    verified: v.source === 'adzuna' || Boolean(v.company),
    description: v.description,
    requirements: v.requirements ? [v.requirements] : undefined,
    postedAt: v.postedAt || v.createdAt,
  };
}

function VacaturesContent() {
  const router = useRouter();

  const [activeSector, setActiveSector] = useState('Alle');
  const [activeType, setActiveType] = useState('Alle');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  });
  const [sortBy, setSortBy] = useState('Nieuwste');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Heel Suriname');
  const [jobAlertEmail, setJobAlertEmail] = useState('');
  const [jobAlertMessage, setJobAlertMessage] = useState('');
  const [priceRange, setPriceRange] = useState(50000);
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

  const sectors = ['Alle', ...Array.from(new Set(jobs.map(j => j.sector).filter(Boolean)))];
  const types = ['Alle', ...Array.from(new Set(jobs.map(j => j.type).filter(Boolean)))];

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

  const filteredJobs = jobs.filter(job => {
    const matchesSector = activeSector === 'Alle' || job.sector === activeSector;
    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (job.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Heel Suriname' || String(job.location || '').toLowerCase().includes(selectedLocation.toLowerCase());
    
    // Parse salary for filtering (handle both SRD and USD mock data)
    const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, '')) || 0;
    const matchesType = activeType === 'Alle' || job.type === activeType;
    const matchesPrice = salaryNum >= 0 && salaryNum <= priceRange;

    return matchesSector && matchesSearch && matchesPrice && matchesType && matchesLocation;
  }).sort((a, b) => {
    if (sortBy === 'Match Score') return b.match - a.match;
    if (sortBy === 'Salaris') {
      const salA = parseInt(a.salary.replace(/[^0-9]/g, '')) || 0;
      const salB = parseInt(b.salary.replace(/[^0-9]/g, '')) || 0;
      return salB - salA;
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
      setJobAlertMessage('Voer eerst een geldig e-mailadres in.');
      return;
    }
    setJobAlertMessage(`Job alert geactiveerd voor ${jobAlertEmail}.`);
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
              Vind je <br/><span className="text-blue-600 italic underline decoration-white/20 underline-offset-4 sm:underline-offset-8">Perfecte Match</span>
            </h1>
            <p className="text-[10px] md:text-xl font-black uppercase tracking-widest text-slate-400 max-w-2xl mx-auto italic px-4">
              Blader door geverifieerde vacatures in de meest invloedrijke sectoren van Suriname.
            </p>
          </motion.div>

          <div className="bg-white p-4 md:p-6 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto brutal-card">
            <div className="flex-1 w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Functie of Bedrijf..." 
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
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="bg-transparent text-black font-black uppercase tracking-widest text-xs outline-none cursor-pointer">
                <option>Heel Suriname</option>
                <option>Paramaribo</option>
                <option>Wanica</option>
                <option>Nickerie</option>
              </select>
            </div>
            <button 
              onClick={handleSearch}
              className="brutal-button-primary w-full md:w-auto shadow-none"
            >
              Zoeken
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 translate-x-1/2 border-l border-white/5" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-12 gap-12">
          {/* Filters Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">Type Dienstverband</h3>
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
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">Sectoren</h3>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {sectors.map(s => (
                  <button 
                    key={s}
                    onClick={() => {
                      setActiveSector(s);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "text-left font-black uppercase tracking-widest text-[11px] py-2 px-3 transition-all flex justify-between items-center group shrink-0",
                      activeSector === s ? "bg-black text-white" : "hover:bg-slate-50 text-slate-400"
                    )}
                  >
                    {s}
                    <ChevronRight className={cn("w-3 h-3 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100", activeSector === s && "opacity-100 translate-x-0")} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit">Salaris Filter</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>SRD 0</span>
                  <span>SRD {priceRange.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50000" 
                  step="1000"
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-2 bg-slate-100 appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Filter op maximaal maandsalaris
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-8 border-2 border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic underline decoration-blue-600 decoration-2 underline-offset-4">Job Alert</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
                Ontvang direct een melding zodra er nieuwe vacatures in jouw sector zijn.
              </p>
              <form onSubmit={handleJobAlertSubmit}>
                <input value={jobAlertEmail} onChange={(e) => setJobAlertEmail(e.target.value)} required type="email" placeholder="E-mailadres..." className="w-full bg-white p-3 text-[10px] font-bold border-2 border-slate-200 outline-none focus:border-black mb-4 uppercase tracking-widest" />
                <button type="submit" className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                  Activeer Alert
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
                    placeholder="Zoek op titel, bedrijf of trefwoorden..."
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 focus:border-black outline-none font-bold uppercase tracking-widest text-xs"
                  />
                </div>
                <button onClick={handleSearch} className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">
                  Zoeken
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                {activeSector} <span className="text-slate-300">Vacatures</span>
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Sorteer op:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="font-black text-black bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <option>Nieuwste</option>
                  <option>Match Score</option>
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
                  className={cn(
                    "bg-white border-2 p-8 transition-all relative group shadow-[8px_8px_0px_0px_rgba(241,245,249,1)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.1)] hover:border-blue-600",
                    job.match >= 90 ? "border-blue-600/30 bg-blue-50/10" : "border-slate-100"
                  )}
                >
                  {job.match >= 90 && (
                    <div className="absolute -top-3 -left-3 bg-blue-600 text-white px-3 py-1 font-black text-[9px] uppercase tracking-widest -rotate-3 border-2 border-black shadow-lg z-10 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> High Match
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-100 text-[9px] font-black px-2 py-1 uppercase tracking-widest text-slate-500 italic border border-slate-200">{job.sector}</span>
                        {job.verified && (
                          <div className="relative group/tooltip">
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 border-2 border-blue-600 italic cursor-help brutal-shadow">
                              <Sparkles className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Geverifieerd</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-black text-white text-[9px] font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-all z-50 pointer-events-none border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] scale-95 group-hover/tooltip:scale-100">
                              <div className="flex items-center gap-2 mb-2 text-blue-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Trust Factor: High</span>
                              </div>
                              Geverifieerde partners ondergaan een identiteitscheck om veiligheid te waarborgen.
                            </div>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/vacatures/${job.id}`}
                        className="inline-block text-3xl font-black uppercase tracking-tighter leading-none mb-3 group-hover:text-blue-600 transition-colors italic decoration-slate-100 underline underline-offset-4 decoration-4"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-3 group/company relative">
                            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs border-2 border-blue-600 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)]">
                              {job.company[0]}
                            </div>
                            <span className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600" /> {job.company}
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
                          className={cn(
                            "p-3 border-2 transition-all brutal-shadow",
                            savedJobs.includes(job.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-black text-slate-300 hover:text-black"
                          )}
                        >
                          <Bookmark className={cn("w-5 h-5", savedJobs.includes(job.id) && "fill-current")} />
                        </button>
                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Match Score</div>
                          <div className={cn(
                            "text-4xl font-black leading-none italic",
                            job.match >= 90 ? "text-blue-600" : job.match >= 80 ? "text-emerald-600" : "text-slate-900"
                          )}>{job.match}%</div>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full">
                        <a 
                          href={`https://wa.me/5971234567?text=Ik heb interesse in de vacature voor ${job.title} bij ${job.company}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-emerald-500 text-white px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all border-2 border-black brutal-shadow"
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vacatures/${job.id}`);
                          }}
                          className="flex-1 md:flex-none brutal-button-primary px-8 py-4 text-[11px] shadow-none bg-black text-white hover:bg-blue-600"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredJobs.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-200">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Geen vacatures gevonden voor deze zoekopdracht.</p>
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
                  Vorige
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
                  Volgende
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-black text-white px-10 py-12 border-t-8 border-blue-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">SuriJobs<span className="text-blue-600">+</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose">
              De meest geavanceerde talent hub <br/>van Suriname. Powered by <br/>AI-driven insights.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 col-span-3">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Platform</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/vacatures" className="hover:text-blue-600">Vacatures</Link></li>
                <li><Link href="/cv-upload" className="hover:text-blue-600">CV Upload</Link></li>
                <li><Link href="/mijn-matches" className="hover:text-blue-600">Mijn Matches</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Hulp</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/over-ons" className="hover:text-blue-600">FAQ</Link></li>
                <li><Link href="/over-ons" className="hover:text-blue-600">Contact</Link></li>
                <li><Link href="/over-ons" className="hover:text-blue-600">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          © 2026 SuriJobs. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
}

export default function VacaturesPage() {
  return <VacaturesContent />;
}
