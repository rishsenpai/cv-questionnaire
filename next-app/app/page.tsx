'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Building2, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Users,
  Star,
  Zap,
  Cpu,
  Droplets,
  Sprout,
  Smartphone,
  ChevronRight,
  MessageCircle,
  UploadCloud,
  TrendingUp,
  FileText,
  Terminal,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    type: v.employmentType || 'Full-time',
    salary: formatSalary(v.salary),
    verified: true,
    aiMatch: null,
    sector: '',
  };
}

export default function Home() {
  const router = useRouter();
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

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<null | any>(null);

  const scanSteps = [
    'Initialiseren Parser Engine...',
    'OCR Extractie: Tekstlagen scannen...',
    'Detecteren van Entiteiten (Bedrijven, Data, Titels)...',
    'Normaliseren van Skills via taxonomische mapping...',
    'Berekenen van Marktwaarde Rapport...'
  ];

  const startScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setScanStep(0);

    // Simulate multi-step parsing like jobparsing.com
    const interval = setInterval(() => {
      setScanStep(prev => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval);
          setScanResult({
            candidate: {
              name: 'Jurgen Dijkstra',
              contact: { email: 'j.dijkstra@example.sr', phone: '+597 888-1234' },
              location: 'Paramaribo, Suriname'
            },
            experience: [
              { title: 'Senior Developer', company: 'TechSur', duration: '4 jaar' },
              { title: 'Frontend Lead', company: 'Global Solutions', duration: '2 jaar' }
            ],
            skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'AI Integration'],
            score: 94,
            raw: {
              parsing_engine: "SuriJobs-v4-Parser",
              confidence: 0.982,
              processing_time: "1.4s"
            }
          });
          setIsScanning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-3xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6"
              >
                <Sparkles className="w-3 h-3" />
                AI-Powered Vacaturebank
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl xs:text-6xl sm:text-8xl font-black font-display tracking-tighter text-slate-900 leading-[0.85] uppercase mb-12"
              >
                Vind je <br className="hidden xs:block" /> nieuwe <span className="inline-block text-blue-600 italic underline decoration-black decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">Uitdaging</span>
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col md:flex-row gap-4 items-end mb-12"
              >
                <div className="flex-1 w-full border-b-4 border-black py-2 group focus-within:border-blue-600 transition-colors">
                  <input 
                    type="text" 
                    placeholder="Functie, trefwoord of bedrijf..." 
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
                  Zoeken
                </Link>
              </motion.div>

              <div className="flex flex-wrap gap-4 items-center text-xs font-bold text-slate-400">
                <span className="uppercase tracking-widest italic">Populaire zoekopdrachten:</span>
                {['Mijnbouw', 'Energie & Water', 'Cybersecurity', 'Transport'].map(tag => (
                  <Link 
                    key={tag} 
                    href={`/vacatures?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 border border-slate-200 hover:border-black transition-colors cursor-pointer text-slate-600"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Professional Job Parser Widget (Inspired by jobparsing.com) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white border-2 border-black p-8 relative shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <Terminal className="text-blue-400 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-2xl">Parsing Engine</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Interactive Parsing Preview</p>
                  </div>
                </div>
                {scanResult && (
                  <button 
                    onClick={() => setScanResult(null)}
                    className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 hover:bg-black hover:text-white transition-colors"
                  >
                    Herstart Demo
                  </button>
                )}
              </div>

              {!scanResult ? (
                <div 
                  onClick={startScan}
                  className={cn(
                    "border-4 border-dashed border-slate-200 p-12 text-center cursor-pointer transition-all hover:border-blue-600 hover:bg-blue-50/30 group relative",
                    isScanning && "pointer-events-none border-blue-600"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isScanning ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-center gap-2">
                          {[0, 1, 2].map(i => (
                            <motion.div 
                              key={i}
                              animate={{ 
                                height: [20, 40, 20],
                                opacity: [0.3, 1, 0.3]
                              }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                              className="w-2 bg-blue-600"
                            />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 italic">
                            {scanSteps[scanStep]}
                          </p>
                          <div className="max-w-[200px] mx-auto h-1 bg-slate-100 overflow-hidden">
                            <motion.div 
                              animate={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                              className="h-full bg-blue-600"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <UploadCloud className="w-12 h-12 text-blue-600 mx-auto group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-xl font-black uppercase tracking-tight text-slate-900">Bekijk Parsing Demo</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Klik om te zien hoe cv-data wordt omgezet naar structuur</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  <div className="space-y-6">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-blue-600 pl-2">Kandidaat Analyse</div>
                      <div className="space-y-2 font-bold text-sm">
                        <p className="text-xl font-black uppercase italic tracking-tighter text-blue-600">{scanResult.candidate.name}</p>
                        <p className="flex items-center gap-2 text-slate-500 underline">{scanResult.candidate.contact.email}</p>
                        <p className="flex items-center gap-2 text-slate-900">{scanResult.candidate.location}</p>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-blue-600 pl-2">Ervarings-Graphen</div>
                      <div className="space-y-3">
                        {scanResult.experience.map((exp: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-3 border border-slate-200">
                            <div className="font-black text-xs uppercase tracking-tight">{exp.title}</div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 italic mt-1 uppercase">
                              <span>{exp.company}</span>
                              <span className="text-blue-600">{exp.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 p-4 rounded-none font-mono text-[10px] text-emerald-400 overflow-hidden relative group">
                      <div className="flex items-center gap-2 mb-2 text-white/40 border-b border-white/10 pb-2">
                        <Code2 className="w-3 h-3" />
                        <span className="font-bold tracking-widest uppercase">Structured Output (JSON)</span>
                      </div>
                      <pre className="max-h-[160px] overflow-y-auto scrollbar-hide">
                        {JSON.stringify(scanResult, null, 2)}
                      </pre>
                      <div className="absolute top-2 right-4 text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1">PARSED</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-blue-600 pl-2">Genormaliseerde Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.skills.map((s: string) => (
                          <span key={s} className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest italic">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="absolute -top-3 -right-3 bg-yellow-400 px-4 py-1 font-black text-[12px] uppercase tracking-widest rotate-6 border-2 border-black shadow-lg">
                Demo Preview
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Sectors */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Groei-Sectoren</h2>
              <h3 className="text-4xl font-black uppercase tracking-tighter italic">Ontdek de kansen in 2026</h3>
            </div>
            <button 
              onClick={() => router.push('/vacatures')}
              className="text-sm font-bold flex items-center gap-2 group italic"
            >
              Alle sectoren <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: 'Energie & Water', count: '124 Vacatures', icon: Droplets },
              { label: 'Mijnbouw', count: '87 Vacatures', icon: Cpu },
              { label: 'Financiën', count: '210 Vacatures', icon: DollarSign },
              { label: 'Landbouw', count: '45 Vacatures', icon: Sprout },
              { label: 'Technologie', count: '156 Vacatures', icon: Smartphone },
            ].map((sect, i) => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={sect.label}
                onClick={() => router.push(`/vacatures?q=${encodeURIComponent(sect.label)}`)}
                className="border-2 border-black p-6 hover:bg-black hover:text-white transition-all cursor-pointer group"
              >
                <sect.icon className="w-8 h-8 mb-4 group-hover:text-blue-400 transition-colors" />
                <h4 className="font-black uppercase tracking-tight mb-1">{sect.label}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{sect.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Filters */}
          <aside className="lg:w-80 flex-shrink-0 border-r border-slate-200 pr-12 pb-12">
            <div className="sticky top-24 space-y-12">
              <Link
                href="/cv-upload"
                className="block bg-blue-600 text-white p-6 border-2 border-blue-600 hover:bg-black hover:border-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-black uppercase tracking-tighter">Upload je CV</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Krijg AI-matches op basis van je profiel
                </p>
              </Link>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Districten</h3>
                <div className="space-y-6">
                  {[
                    { name: 'Paramaribo', count: 412, active: true },
                    { name: 'Wanica', count: 89, active: false },
                    { name: 'Nickerie', count: 34, active: false },
                    { name: 'Commewijne', count: 21, active: false }
                  ].map((dist) => (
                    <label key={dist.name} className={cn("flex items-center gap-3 group cursor-pointer", !dist.active && "opacity-40")}>
                      <div className={cn("w-5 h-5 border-2 flex items-center justify-center transition-colors px-1", dist.active ? "border-black" : "border-slate-300")}>
                        {dist.active && <div className="w-full h-full bg-black shrink-0" />}
                      </div>
                      <span className="text-black font-black text-lg uppercase tracking-tight">{dist.name}</span>
                      <span className="ml-auto text-slate-400 font-mono text-sm">{dist.count}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 border-l-4 border-blue-600">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Pro Tip</p>
                <p className="text-sm font-bold leading-relaxed text-slate-900">Websites in Suriname missen vaak directe communicatie. Wij integreren WhatsApp Direct voor snelle sollicitaties.</p>
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 pb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic underline decoration-blue-600 decoration-4 underline-offset-8">
                {searchTerm ? `Resultaten voor "${searchTerm}"` : 'Recente Vacatures'}
              </h2>
              <Link href="/vacatures" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">Bekijk Alle →</Link>
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
                          {job.company}
                        </span>
                        {job.verified && (
                          <div className="text-[10px] font-black uppercase tracking-tighter text-blue-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Geverifieerd
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
                        <a 
                          href={`https://wa.me/5971234567?text=Hoi, ik heb interesse in de vacature voor ${job.title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer group" title="Solliciteer via WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vacatures/${job.id}`);
                          }}
                          className="border-2 border-black px-6 py-2 font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="pt-8 flex justify-center">
              <Link href="/vacatures" className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                Bekijk Alle Vacatures
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Why SuriJobs? */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-black font-display mb-12 leading-[0.9] uppercase tracking-tighter">
                Waarom de traditionele vacaturebanken <span className="text-blue-500 italic">falen</span>.
              </h2>
              <div className="space-y-12">
                {[
                  { 
                    icon: Users, 
                    title: "Geen 'Schaduw' Bedrijven", 
                    desc: "Elk bedrijf op SuriJobs+ ondergaat een identiteitscheck. Geen valse beloftes meer." 
                  },
                  { 
                    icon: DollarSign, 
                    title: "Salaris Transparantie", 
                    desc: "Wij stimuleren werkgevers om salarisranges te delen. Je tijd is kostbaar." 
                  },
                  { 
                    icon: Sparkles, 
                    title: "AI-Gedreven Inzicht", 
                    desc: "Onze algoritmes kijken verder dan trefwoorden. Ze begrijpen loopbaanpaden." 
                  }
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
            
            <div className="relative">
              <div className="bg-white p-10 border-4 border-black relative z-10 text-slate-900 shadow-[24px_24px_0px_0px_rgba(59,130,246,1)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black flex items-center justify-center text-white font-black text-xl">JD</div>
                  <div className="border-l-4 border-slate-100 pl-4">
                    <div className="font-black uppercase tracking-tighter">Jurgen Dijkstra</div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Senior Developer</div>
                  </div>
                </div>
                <p className="text-3xl font-black leading-[0.95] tracking-tight mb-8 uppercase italic underline decoration-blue-200 decoration-8 underline-offset-4">
                  &quot;Eindelijk een platform dat aanvoelt als 2026. Geen eindeloze lijsten.&quot;
                </p>
                <div className="flex justify-between items-center border-t-2 border-slate-100 pt-6">
                  <div className="flex gap-1 text-black">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Verified Review</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Salary Comparison Section */}
      <section className="bg-blue-50 py-24 overflow-hidden border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-6">
                <TrendingUp className="w-3 h-3" /> Marktdata
              </div>
              <h2 className="text-6xl font-black font-display uppercase leading-[0.85] tracking-tighter mb-8">
                Is je salaris <br/><span className="text-blue-600 italic">Eerlijk?</span>
              </h2>
              <p className="text-slate-600 font-bold text-lg leading-relaxed mb-8">
                Ontrafel de Surinaamse salarisstandaarden. Onze database van 2026 biedt real-time inzicht in wat je écht hoort te verdienen.
              </p>
              <Link href="/vacatures" className="bg-black text-white px-8 py-4 font-black uppercase tracking-tighter flex items-center gap-4 group">
                Bekijk Vacatures <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="lg:col-span-7 flex flex-col gap-4">
              {[
                { label: 'Junior Marketeer', range: 'SRD 6.500 - 9.000', trend: '+12%' },
                { label: 'Olie & Gas Techneut', range: 'SRD 22.000 - 35.000', trend: '+28%' },
                { label: 'Verpleegkundige', range: 'SRD 7.500 - 11.000', trend: '+5%' },
              ].map((item, i) => (
                <div key={i} className="bg-white border-2 border-black p-6 flex justify-between items-center hover:scale-[1.02] transition-transform">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-2xl font-black text-slate-900 italic tracking-tighter">{item.range}</div>
                  </div>
                  <div className="bg-blue-600 text-white px-3 py-1 font-black text-xs uppercase italic tracking-widest">{item.trend}</div>
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
            <Link href="/" className="text-2xl font-black uppercase tracking-tighter mb-6 block">SuriJobs<span className="text-blue-600">+</span></Link>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose">
              De meest geavanceerde talent hub <br/>van Suriname. Powered by <br/>AI-driven insights.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 col-span-3">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Platform</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/vacatures" className="hover:text-blue-600 transition-colors">Vacatures</Link></li>
                <li><Link href="/cv-upload" className="hover:text-blue-600 transition-colors">CV Upload</Link></li>
                <li><Link href="/mijn-matches" className="hover:text-blue-600 transition-colors">Mijn Matches</Link></li>
                <li><Link href="/over-ons" className="hover:text-blue-600 transition-colors">Over Ons</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Hulp</h4>
              <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest">
                <li><Link href="/over-ons" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
                <li><Link href="/over-ons" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><span className="text-blue-400">Status: Online</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex justify-between">
          <span>© 2026 SuriJobs. Alle rechten voorbehouden.</span>
          <div className="flex gap-6">
            <span className="text-blue-400 cursor-pointer">Systeem Status</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
