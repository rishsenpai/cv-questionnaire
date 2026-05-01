'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  estimateSalaryRange,
  formatSrd,
  getSalaryMarketSample,
  SALARY_CONTRACT_LABELS as CONTRACT_LABELS,
  SALARY_EXPERIENCE_LABELS,
  SALARY_LOCATION_OPTIONS,
  SALARY_SECTOR_OPTIONS,
  SURINAME_CPI_REFERENCE,
  SURINAME_MINIMUM_HOURLY_WAGE_SRD,
  SURINAME_MINIMUM_WAGE_EFFECTIVE_DATE,
  type SalaryContractType,
  type SalaryExperienceLevel,
} from '@/lib/salary';

const MARKET_SAMPLE = getSalaryMarketSample();

export default function SalariswijzerPage() {
  const [mode, setMode] = useState<'candidate' | 'employer'>('candidate');
  const [sector, setSector] = useState('Technologie & IT');
  const [location, setLocation] = useState('Paramaribo');
  const [experience, setExperience] = useState<SalaryExperienceLevel>('mid');
  const [contractType, setContractType] = useState<SalaryContractType>('fulltime');
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [currentSalary, setCurrentSalary] = useState('');

  const parsedHours = Number(weeklyHours) || 40;
  const parsedSalary = Number(currentSalary) || null;

  const estimate = useMemo(
    () =>
      estimateSalaryRange({
        sector,
        location,
        experience,
        contractType,
        weeklyHours: parsedHours,
        currentMonthlySalary: parsedSalary,
      }),
    [contractType, experience, location, parsedHours, parsedSalary, sector]
  );

  return (
    <div className="min-h-screen bg-[#f6f4ed] text-slate-900">
      <section className="relative overflow-hidden border-b-8 border-black bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_35%),linear-gradient(135deg,#f6f4ed_0%,#efe9dc_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] font-black tracking-[0.25em] uppercase mb-6">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                Suriname Salary Check
              </div>
              <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
                Check of je salaris <span className="text-blue-600 italic underline decoration-black decoration-4 underline-offset-4">marktconform</span> is
              </h1>
              <p className="max-w-2xl text-lg font-bold leading-relaxed text-slate-600 mb-8">
                Een eerste SuriJobs+ salariswijzer voor de Surinaamse markt, gebaseerd op publieke salary ranges,
                vacaturedata en een officiële minimumloonbodem.
              </p>
              <div className="flex flex-wrap gap-4 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <span className="border-2 border-black px-4 py-2 bg-white">Minimumuurloon: SRD {SURINAME_MINIMUM_HOURLY_WAGE_SRD.toFixed(2)}</span>
                <span className="border-2 border-black px-4 py-2 bg-white">Ingangsdatum: {SURINAME_MINIMUM_WAGE_EFFECTIVE_DATE}</span>
                <span className="border-2 border-black px-4 py-2 bg-white">Macro referentie: {SURINAME_CPI_REFERENCE}</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-black text-white border-4 border-blue-600 p-8 shadow-[20px_20px_0px_0px_rgba(59,130,246,0.25)]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Mode</p>
                    <h2 className="text-3xl font-black uppercase tracking-tight italic">Salary Intelligence</h2>
                  </div>
                  <BadgeDollarSign className="w-10 h-10 text-blue-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { id: 'candidate', label: 'Kandidaat', icon: Users },
                    { id: 'employer', label: 'Werkgever', icon: Building2 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as 'candidate' | 'employer')}
                      className={cn(
                        'border-2 px-4 py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all',
                        mode === item.id
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/40'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</span>
                    <select
                      value={sector}
                      onChange={(event) => setSector(event.target.value)}
                      className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                    >
                      {SALARY_SECTOR_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-slate-900">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locatie</span>
                      <select
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                      >
                        {SALARY_LOCATION_OPTIONS.map((option) => (
                          <option key={option} value={option} className="text-slate-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ervaring</span>
                      <select
                        value={experience}
                        onChange={(event) => setExperience(event.target.value as SalaryExperienceLevel)}
                        className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                      >
                        {Object.entries(SALARY_EXPERIENCE_LABELS).map(([value, label]) => (
                          <option key={value} value={value} className="text-slate-900">
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</span>
                      <select
                        value={contractType}
                        onChange={(event) => setContractType(event.target.value as SalaryContractType)}
                        className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                      >
                        {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
                          <option key={value} value={value} className="text-slate-900">
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uren per week</span>
                      <input
                        type="number"
                        min="8"
                        max="60"
                        value={weeklyHours}
                        onChange={(event) => setWeeklyHours(event.target.value)}
                        className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {mode === 'candidate' ? 'Huidig bruto maandsalaris (optioneel)' : 'Voorgesteld bruto maandsalaris (optioneel)'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={currentSalary}
                      onChange={(event) => setCurrentSalary(event.target.value)}
                      placeholder="Bijv. 18000"
                      className="border-2 border-white/10 bg-white/5 px-4 py-4 font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-400"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="grid xl:grid-cols-12 gap-10">
          <div className="xl:col-span-7 bg-white border-4 border-black p-8 shadow-[16px_16px_0px_0px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4 mb-8 border-b-4 border-slate-100 pb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Resultaat</p>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Jouw marktband</h2>
              </div>
              <div className="bg-slate-100 px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest">
                Confidence: {estimate.confidence}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-slate-200 p-6 bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lage band</p>
                <p className="text-3xl font-black italic tracking-tight">{formatSrd(estimate.expectedMonthlyMin)}</p>
              </div>
              <div className="border-2 border-blue-600 p-6 bg-blue-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Marktmidden</p>
                <p className="text-3xl font-black italic tracking-tight text-blue-600">{formatSrd(estimate.midpoint)}</p>
              </div>
              <div className="border-2 border-slate-200 p-6 bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hoge band</p>
                <p className="text-3xl font-black italic tracking-tight">{formatSrd(estimate.expectedMonthlyMax)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-l-8 border-black bg-[#f6f4ed] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Wettelijke bodem</p>
                <p className="text-2xl font-black italic">{formatSrd(estimate.minimumMonthlyFloor)}</p>
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Gebaseerd op {parsedHours} uur per week en het minimumuurloon van SRD {SURINAME_MINIMUM_HOURLY_WAGE_SRD.toFixed(2)}.
                </p>
              </div>

              <div
                className={cn(
                  'border-l-8 p-6',
                  estimate.signal === 'Onder markt'
                    ? 'border-red-600 bg-red-50'
                    : estimate.signal === 'Boven markt'
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-blue-600 bg-blue-50'
                )}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Marktsignaal</p>
                <p className="text-2xl font-black italic">{estimate.signal}</p>
                {typeof estimate.marketDelta === 'number' && (
                  <p className="mt-3 text-sm font-bold text-slate-600">
                    Delta t.o.v. marktmidden: {estimate.marketDelta >= 0 ? '+' : '-'}
                    {formatSrd(Math.abs(estimate.marketDelta))}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-black text-white p-6 border-l-8 border-blue-600">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Advies</p>
                <p className="text-sm font-bold leading-relaxed">{mode === 'candidate' ? estimate.negotiationTip : estimate.employerTip}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="border-2 border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Kandidaat</p>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-slate-700">{estimate.negotiationTip}</p>
                </div>
                <div className="border-2 border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Werkgever</p>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-slate-700">{estimate.employerTip}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-8 border-b-8 border-blue-600">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Hoe dit werkt</h3>
              </div>
              <ul className="space-y-4 text-sm font-bold text-slate-300">
                <li>We combineren sectorbaseline, locatie, ervaringsniveau, contractvorm en uren.</li>
                <li>De wettelijke bodem beschermt tegen ranges onder het minimumloon.</li>
                <li>Deze MVP is bedoeld als marktindicatie, niet als juridisch of payroll-oordeel.</li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4">Live market sample</p>
              <div className="space-y-4">
                {MARKET_SAMPLE.slice(0, 5).map((job) => (
                  <div key={job.id} className="border-2 border-slate-100 p-4 bg-slate-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{job.company}</p>
                        <p className="text-lg font-black uppercase tracking-tight italic">{job.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{job.location}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">{job.salary}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Voor kandidaten',
              body: 'Check of je aanbod of huidige loon onder, op of boven markt ligt en krijg meteen een onderhandelingshint.',
              icon: Users,
            },
            {
              title: 'Voor werkgevers',
              body: 'Voorkom dat vacatures onnodig zwak converteren door salary bands te toetsen vóór publicatie.',
              icon: Building2,
            },
            {
              title: 'Voor SuriJobs+',
              body: 'Deze tool kan later gevoed worden door echte salary ranges uit vacatures, kandidaatverwachtingen en hires.',
              icon: TrendingUp,
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border-4 border-black p-8 hover:shadow-[14px_14px_0px_0px_rgba(59,130,246,0.18)] transition-all"
            >
              <item.icon className="w-10 h-10 text-blue-600 mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-tight italic mb-4">{item.title}</h3>
              <p className="text-sm font-bold leading-relaxed text-slate-600">{item.body}</p>
            </motion.div>
          ))}
        </section>

        <section className="bg-black text-white p-10 md:p-14 border-b-8 border-blue-600">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-400 mb-3">Next step</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-[0.9] mb-4">
                Maak salary transparency een productvoordeel
              </h2>
              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                De volgende stap is salary bands opslaan bij vacatures en dezelfde benchmark-logica gebruiken in het werkgeverdashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/vacatures" className="bg-white text-black px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3">
                Bekijk Vacatures <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/company" className="border-2 border-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all flex items-center gap-3">
                Werkgeversdashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
