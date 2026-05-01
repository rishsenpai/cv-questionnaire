'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Sparkles, 
  Search, 
  Award, 
  Zap, 
  Target, 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Navigation,
  Globe,
  Star,
  ChevronRight,
  LineChart,
  Users,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function KandidatenPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-24 sm:py-32 border-b-8 border-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Upgrade je carrière 2026
            </div>
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-12 italic">
              Word de <br/>Beste <span className="text-black underline decoration-white decoration-8 underline-offset-8">Versie</span> van jezelf
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-blue-100 uppercase tracking-tight italic max-w-2xl leading-tight mb-12">
              Krijg toegang tot exclusieve vacatures, AI-gedreven loopbaanadvies en geverifieerde werkgevers in Suriname.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                href="/dashboard/candidate"
                className="bg-black text-white px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center gap-3"
              >
                Maak Gratis Profiel Aan <UserPlus className="w-5 h-5" />
              </Link>
              <Link 
                href="/vacatures"
                className="bg-blue-500/20 backdrop-blur-md border-2 border-white px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-3"
              >
                Bekijk Vacatures <Search className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
        <Globe className="absolute -bottom-20 -right-20 w-[600px] h-[600px] text-blue-500/20 animate-pulse pointer-events-none" />
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-white border-b-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none mb-6">
              Waarom <span className="text-blue-600">SuriJobs+?</span>
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs italic">De voordelen van het modernste platform in de regio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { 
                title: 'AI CV Optimalisatie', 
                desc: 'Onze engine analyseert je CV en geeft direct tips om de ATS-filters van topbedrijven te passeren.', 
                icon: FileText,
                color: 'text-blue-600'
              },
              { 
                title: 'Eerlijke Salarissen', 
                desc: 'Geen geraden meer. Wij pushen op transparantie zodat je weet wat een marktconform salaris is.', 
                icon: Target,
                color: 'text-emerald-600'
              },
              { 
                title: 'Direct Contact', 
                desc: 'Communiceer via onze chat direct met recruiters van Staatsolie, Telesur en andere topmaatschappijen.', 
                icon: MessageSquare,
                color: 'text-purple-600'
              },
              { 
                title: 'Skill Tracking', 
                desc: 'Ontdek welke skills in trek zijn in Suriname en welke trainingen je nodig hebt om je waarde te verhogen.', 
                icon: LineChart,
                color: 'text-orange-600'
              },
              { 
                title: 'Geverifieerd Talent', 
                desc: 'Krijg een "Verified" badge na onze AI-screening, waardoor je 4x vaker wordt uitgenodigd voor gesprekken.', 
                icon: ShieldCheck,
                color: 'text-blue-600'
              },
              { 
                title: 'Mobile First', 
                desc: 'Solliciteer met één klik vanaf je smartphone. Overal en altijd toegang tot je carrière.', 
                icon: Zap,
                color: 'text-yellow-500'
              },
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group border-4 border-black p-10 hover:shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] transition-all bg-white"
              >
                <div className={cn("w-16 h-16 bg-slate-50 border-2 border-black flex items-center justify-center mb-8 group-hover:bg-black transition-colors", benefit.color)}>
                  <benefit.icon className="w-8 h-8 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic leading-tight">{benefit.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Candidate Journey (Process) */}
      <section className="py-32 bg-slate-50 border-b-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.85] mb-12">
                In 3 Stappen naar <br/><span className="text-blue-600 italic">Succes</span>.
              </h2>
              <div className="space-y-16">
                {[
                  { step: '01', title: 'Upload & Parse', desc: 'Sleep je CV in onze parser. Wij extraheren je skills en vullen je profiel automatisch in.' },
                  { step: '02', title: 'AI Matching', desc: 'Onze engine matcht je real-time met openstaande vacatures die écht bij je passen.' },
                  { step: '03', title: 'Krijg je Boarding Pass', desc: 'Wordt uitgenodigd voor gesprekken via ons platform en start je nieuwe avontuur.' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="text-6xl font-black text-blue-200 group-hover:text-blue-600 transition-colors italic leading-none">{step.step}</div>
                    <div>
                      <h4 className="text-2xl font-black uppercase tracking-tight mb-2 italic">{step.title}</h4>
                      <p className="text-lg font-bold text-slate-500 leading-tight italic">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-black p-12 border-8 border-blue-600 shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] rotate-3">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                </div>
                <div className="space-y-6">
                  <div className="h-4 w-3/4 bg-blue-600/30 rounded" />
                  <div className="h-4 w-1/2 bg-blue-600/20 rounded" />
                  <div className="h-20 w-full bg-blue-600/10 border-2 border-dashed border-blue-600 flex items-center justify-center text-blue-600 font-black uppercase text-xs tracking-widest">
                    CV Gedetecteerd
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-zinc-800 rounded flex items-center px-4 text-[10px] items-center gap-2 font-black text-emerald-400">
                      <Sparkles className="w-3 h-3" /> MATCH: 94%
                    </div>
                    <div className="h-10 bg-emerald-600 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      Solliciteer Nu
                    </div>
                  </div>
                </div>
              </div>
              <Navigation className="absolute -top-12 -left-12 w-24 h-24 text-blue-600 -rotate-12 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-24 bg-white border-b-8 border-black overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee gap-24 items-center">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="flex items-center gap-6 text-4xl font-black uppercase tracking-tighter italic text-slate-200">
              <Star className="w-8 h-8 text-yellow-400 fill-current" />
              Gemiddelde Score 4.8/5
              <Briefcase className="w-8 h-8 text-blue-600" />
              150+ Hires deze week
              <Users className="w-8 h-8 text-emerald-400" />
              Samenwerking met de Top 100
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-32 bg-black text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
               <div className="w-full aspect-square bg-blue-600 rotate-6 border-8 border-white p-8">
                  <div className="bg-white h-full w-full p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="text-black font-black text-3xl uppercase tracking-tighter leading-none italic">AI Career Insight</div>
                      <p className="text-slate-400 font-bold text-sm leading-tight uppercase tracking-widest italic">
                        Gebaseerd op de marktbehoefte in Paramaribo Noord adviseren wij je om &quot;Cloud Security&quot; aan je portfolio toe te voegen.
                      </p>
                    </div>
                    <Link href="/dashboard/candidate" className="block bg-blue-600 text-white w-full py-4 font-black uppercase tracking-widest text-xs text-center">Bekijk Roadmap</Link>
                  </div>
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] mb-12">
                Niet Alleen <br/>Een Baan, Maar <br/><span className="text-blue-600 underline decoration-white decoration-8 underline-offset-8">Groei</span>.
              </h2>
              <p className="text-xl font-bold text-slate-400 uppercase tracking-tight italic mb-12">
                Onze dashboards gaan verder dan alleen &quot;apply&quot;. We geven je de tools om je marktwaarde te begrijpen en te verhogen.
              </p>
              <ul className="space-y-6">
                {[
                  'Inzicht in wie je profiel bekijkt',
                  'Salaris benchmark voor jouw functie',
                  'Gepersonaliseerde leerpaden',
                  'Directe feedback op afwijzingen'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-lg font-black italic">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.8] mb-12">
            Pak de <br/><span className="text-blue-600 italic">Controle</span>.
          </h2>
          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest italic mb-16">
            Sluit je aan bij de duizenden Surinaamse professionals die hun carrière hebben getransformeerd.
          </p>
          <Link 
            href="/dashboard/candidate"
            className="inline-block bg-black text-white px-16 py-8 font-black uppercase tracking-widest text-xl hover:bg-blue-600 transition-all shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] hover:shadow-none animate-pulse"
          >
            Meld Je Nu Aan
          </Link>
          <div className="mt-12 text-slate-300 font-black uppercase tracking-[0.5em] text-[10px]">
             GRATIS VOOR ALTIJD VOOR KANDIDATEN
          </div>
        </div>
      </section>

    </div>
  );
}
