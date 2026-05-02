'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  MapPin,
  Users,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  BarChart3,
  Award,
  CheckCircle2,
  Target,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { COMPANY_PROFILES, findCompanyProfile } from '@/lib/companies';

interface ApiCompany {
  name: string;
  openJobs: number;
  location: string;
  sector: string;
  verified: boolean;
  logo: string | null;
}

interface CompanyDisplay {
  name: string;
  openJobs: number;
  location: string;
  sector: string;
  sectorDescription: string;
  verified: boolean;
  logo: string | null;
  employees: string;
  description: string;
  topRoles: string[];
}

function enrich(c: ApiCompany): CompanyDisplay {
  const profile = findCompanyProfile(c.name);
  return {
    name: c.name,
    openJobs: c.openJobs,
    location: profile?.location || c.location,
    sector: profile?.sector || c.sector,
    sectorDescription: profile?.sectorDescription || 'Werkgever uit onze platform-gids.',
    verified: profile?.verified ?? c.verified,
    logo: profile?.logo || c.logo,
    employees: profile?.employees || '—',
    description: profile?.description || `Werkgever met ${c.openJobs} open vacature${c.openJobs !== 1 ? 's' : ''}.`,
    topRoles: profile?.topRoles || [],
  };
}

export default function BedrijvenPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSector, setActiveSector] = useState('Alle');
  const [companies, setCompanies] = useState<CompanyDisplay[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.success) return;
        setCompanies((data.companies as ApiCompany[]).map(enrich));
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  const sectors = ['Alle', ...Array.from(new Set([
    ...COMPANY_PROFILES.map(c => c.sector),
    ...companies.map(c => c.sector),
  ]))];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = activeSector === 'Alle' || company.sector === activeSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="bg-black text-white py-24 border-b-8 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-8">
              <Award className="w-4 h-4" /> Top Werkgevers 2026
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
              Ontdek de <span className="text-blue-600 italic">Marktleiders</span>
            </h1>
            <p className="text-lg md:text-xl font-bold text-slate-400 uppercase tracking-tight italic max-w-xl">
              Maak kennis met de meest invloedrijke bedrijven van Suriname en vind je plek bij de besten.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Employer Value Proposition Section */}
      <section className="py-24 bg-white border-b-8 border-black overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-12">
                Recruit <span className="text-blue-600 italic">Slimmer</span>,<br />Niet Harder.
              </h2>
              <div className="space-y-8">
                {[
                  { title: 'AI-Gedreven Matching', desc: 'Ons algoritme vindt de beste 1% kandidaten voor uw specifieke rol.', icon: Zap },
                  { title: 'Verified Talent Pool', desc: 'Geen valse CV\'s meer. Elke kandidaat ondergaat een AI-vetting.', icon: Shield },
                  { title: 'Employer Branding', desc: 'Toon uw bedrijfscultuur met een professioneel en modern profiel.', icon: Target },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-12 h-12 bg-slate-100 flex items-center justify-center shrink-0 border-2 border-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight mb-2 italic">{item.title}</h3>
                      <p className="text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth" className="mt-12 inline-block bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                Start Nu Met Recruiten
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-slate-50 border-4 border-black p-12 relative"
            >
              <div className="absolute -top-6 -left-6 bg-blue-600 text-white px-6 py-3 font-black uppercase tracking-widest text-xs rotate-[-3deg]">
                Het Proces
              </div>
              <div className="space-y-12">
                {[
                  { step: '01', title: 'Registreren', desc: 'Maak in 2 minuten uw bedrijfsprofiel aan.' },
                  { step: '02', title: 'Vacatures Plaatsen', desc: 'Publiceer uw rollen met AI-geoptimaliseerde teksten.' },
                  { step: '03', title: 'AI Screening', desc: 'Laat onze engine de kandidaten sorteren op kwaliteit.' },
                  { step: '04', title: 'Direct Contact', icon: ArrowRight },
                ].map((p, i) => (
                  <div key={i} className="flex gap-8 items-center border-b-2 border-slate-200 pb-6 last:border-0 last:pb-0">
                    <span className="text-4xl font-black text-blue-600 italic leading-none">{p.step}</span>
                    <div className="flex-1">
                      <h4 className="text-lg font-black uppercase tracking-widest mb-1 italic">{p.title}</h4>
                      {p.desc && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.desc}</p>}
                    </div>
                    {p.icon && <p.icon className="w-6 h-6 text-black group-hover:translate-x-2 transition-transform" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        <TrendingUp className="absolute -bottom-20 -right-20 w-[600px] h-[600px] text-slate-50 pointer-events-none" />
      </section>

      {/* What You Get Section */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none mb-6">
              Wat u <span className="text-blue-600">Krijgt</span>
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Een compleet arsenaal voor moderne recruitment</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Geavanceerd Dashboard', desc: 'Beheer al uw vacatures en kandidaten vanaf één centrale plek met real-time analytics.', icon: LayoutDashboard },
              { title: 'AI CV-Parsing', desc: 'Bespaar uren aan handmatig werk. Onze AI extraheert automatisch de belangrijkste data.', icon: Sparkles },
              { title: 'Team Samenwerking', desc: 'Voeg teamleden toe, deel notities en beoordeel kandidaten gezamenlijk.', icon: Users },
              { title: 'Priority Support', desc: 'Geniet van directe toegang tot ons supportteam voor al uw vragen en hulp.', icon: MessageSquare },
              { title: 'Markt Insights', desc: 'Krijg inzicht in salaristrends en concurrentie binnen uw sector in Suriname.', icon: BarChart3 },
              { title: 'Multi-posten', desc: 'Plaats uw vacatures met één klik ook op onze partnernetwerken.', icon: ExternalLink },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border-2 border-zinc-800 p-10 hover:border-blue-600 transition-colors group"
              >
                <feature.icon className="w-10 h-10 text-blue-600 mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-4 italic">{feature.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Featured Companies Section Info */}
      <section className="py-20 bg-slate-50 border-b-2 border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-4">
            Bedrijvengids <span className="text-blue-600">Suriname</span>
          </h2>
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Blader door de grootste namen op de markt</p>
        </div>
      </section>

      {/* Corporate Search */}
      <section className="py-12 bg-slate-50 border-b-2 border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 focus:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Zoek bedrijf op naam of sector..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-black p-5 pl-14 font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-all brutal-shadow"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:flex-none">
                <button className="w-full border-2 border-black px-8 py-5 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 brutal-shadow">
                  <Filter className="w-4 h-4" /> {activeSector}
                </button>
                <div className="absolute right-0 top-full mt-3 w-64 bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                  {sectors.map(s => (
                    <button 
                      key={s}
                      onClick={() => setActiveSector(s)}
                      className={cn(
                        "w-full text-left px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-b-2 border-slate-100 last:border-0",
                        activeSector === s && "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Link href="/dashboard/company" className="flex-1 md:flex-none border-2 border-black px-8 py-5 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 brutal-shadow">
                <BarChart3 className="w-4 h-4" /> Trends
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Company List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid gap-16">
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((company, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                key={company.name}
                className="group bg-white border-4 border-black p-10 md:p-14 hover:shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] transition-all flex flex-col md:flex-row gap-12 items-start brutal-card shadow-none"
              >
                <div className="w-28 h-28 md:w-40 md:h-40 bg-black text-blue-600 flex items-center justify-center font-black text-5xl border-4 border-blue-600 shrink-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-3 transition-all overflow-hidden relative">
                  {company.logo ? (
                    <Image src={company.logo} alt={company.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{company.name[0]}</span>
                  )}
                </div>
                
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-5">
                      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none group-hover:text-blue-600 transition-colors decoration-blue-600/10 underline underline-offset-8">
                        {company.name}
                      </h2>
                      {company.verified && (
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-2 border-emerald-600 brutal-shadow">
                          <CheckCircle2 className="w-4 h-4" /> Trust Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-10 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="relative group/sector">
                        <span className="flex items-center gap-3 hover:text-black transition-colors cursor-help bg-slate-50 px-3 py-1 border-2 border-slate-100">
                          <Building2 className="w-5 h-5 text-blue-600" /> {company.sector}
                        </span>
                        <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover/sector:opacity-100 transition-all pointer-events-none z-30 border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                          {company.sectorDescription}
                        </div>
                      </div>
                      <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600" /> {company.location}</span>
                      <span className="flex items-center gap-3"><Users className="w-5 h-5 text-blue-600" /> {company.employees} Medewerkers</span>
                    </div>
                  </div>

                  <p className="text-xl font-bold text-slate-600 leading-relaxed max-w-3xl italic">
                    &quot;{company.description}&quot;
                  </p>

                  <div className="space-y-5">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 italic border-b-2 border-blue-600 w-fit pb-1">Top Talent Behoeften</h4>
                    <div className="flex flex-wrap gap-4">
                      {company.topRoles.map(role => (
                        <span key={role} className="bg-white border-2 border-black px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-900 brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 pt-6">
                    <Link href={`/bedrijven/${encodeURIComponent(company.name)}`} className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] group-hover:shadow-none text-center">
                      Bekijk Bedrijfsprofiel
                    </Link>
                    <Link href={`/vacatures?q=${encodeURIComponent(company.name)}`} className="border-2 border-black px-12 py-5 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center gap-4 justify-center brutal-shadow">
                      {company.openJobs} Open Vacatures <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredCompanies.length === 0 && (
              <div className="py-32 text-center bg-slate-50 border-4 border-dashed border-slate-200">
                <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-300">Geen bedrijven gevonden die voldoen aan uw criteria.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Load More */}
        <div className="mt-20 flex justify-center">
          <Link href="/vacatures" className="px-12 py-6 border-4 border-black font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all text-sm italic">
            Ontdek Meer Vacatures
          </Link>
        </div>
      </main>

      {/* Footer Segment */}
      <footer className="bg-black text-white py-20 border-t-8 border-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">
            Wil je jouw bedrijf ook <span className="text-blue-600 italic">Profileren?</span>
          </h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-12 italic">
            Word lid van SuriJobs+ en krijg toegang tot de grootste talent pool van Suriname.
          </p>
          <Link href="/auth" className="bg-blue-600 text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
            Aanmelden als Werkgever
          </Link>
        </div>
      </footer>
    </div>
  );
}
