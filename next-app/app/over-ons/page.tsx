'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Target, 
  Users, 
  Sparkles, 
  Globe, 
  Cpu, 
  MessageCircle, 
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function OverOnsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b-8 border-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl"
          >
            <div className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-8 italic flex items-center gap-2">
              <Globe className="w-4 h-4" /> Gebouwd in Suriname voor Suriname
            </div>
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-12">
              Onze Missie: <br/><span className="text-blue-600 italic underline decoration-blue-100 decoration-8 underline-offset-8">Transparantie</span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold uppercase tracking-tight italic text-slate-500 leading-tight max-w-3xl">
              SuriJobs+ is niet zomaar een vacaturebank. Wij zijn het antwoord op de chaos en onzekerheid van de huidige Surinaamse arbeidsmarkt.
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/2" />
      </section>

      {/* The Origin Story */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none underline decoration-blue-600 decoration-8 underline-offset-8">
                Waarom SuriJobs+?
              </h2>
              <div className="space-y-8 text-lg font-bold text-slate-600 leading-relaxed italic">
                <p>
                  In 2026 was de Surinaamse arbeidsmarkt gefragmenteerd. Vacatures stonden op Facebook, WhatsApp-groepen en verouderde websites zonder enige controle of transparantie over salarissen.
                </p>
                <p>
                  Wij zagen hoe goed talent verloren ging door gebrekkige matching en hoe bedrijven maandenlang zochten naar de juiste mensen. SuriJobs+ is gebouwd om deze barrières te doorbreken met behulp van AI en een compromisloze focus op data-integriteit.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-5xl font-black text-blue-600 mb-2">20k+</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matchings per maand</div>
                </div>
                <div>
                  <div className="text-5xl font-black text-blue-600 mb-2">800+</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Geverifieerde Bedrijven</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-black p-12 border-8 border-blue-600 shadow-[32px_32px_0px_0px_rgba(241,245,249,1)]">
                <blockquote className="text-3xl font-black text-white uppercase italic leading-[0.9] tracking-tighter mb-12">
                  &quot;Wij geloven dat een eerlijke baan de basis is voor een sterke economie. Wij maken die verbinding mogelijk.&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-none border-2 border-white" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white">Founder Team</div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SuriJobs Intelligence Unit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Bento Style */}
      <section className="py-32 bg-slate-50 border-y-2 border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4 italic">Onze Kernwaarden</h3>
            <h4 className="text-6xl font-black uppercase tracking-tighter italic">Geen Bullshit. Alleen <span className="text-blue-600 italic">Resultaat</span>.</h4>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-4 border-black p-10 hover:-translate-y-2 transition-transform">
              <Sparkles className="w-12 h-12 text-blue-600 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">Radicale Transparantie</h5>
              <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                Wij pushen werkgevers om eerlijk te zijn over salarissen en secundaire voorwaarden. Geen verrassingen bij het eerste gesprek.
              </p>
            </div>
            <div className="bg-black text-white p-10 hover:-translate-y-2 transition-transform shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
              <Cpu className="w-12 h-12 text-blue-400 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">AI-Eerst Engineering</h5>
              <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                Onze CV-parsers en match-algoritmes zijn getraind op de lokale context, inclusief Surinaamse diploma&apos;s en bedrijfsculturen.
              </p>
            </div>
            <div className="bg-white border-4 border-black p-10 hover:-translate-y-2 transition-transform">
              <Target className="w-12 h-12 text-blue-600 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">Focus op Impact</h5>
              <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                Ons succes wordt niet gemeten in clicks, maar in de duizenden mensen die we helpen hun carrière te transformeren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Roadmap */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none max-w-xl">
              De Toekomst van <br/><span className="text-blue-600 italic">Werk</span>.
            </h2>
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400 italic">
              Roadmap 2026-2028 <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-12">
            {[
              { year: 'Q3 2026', title: 'Video Interview Engine', desc: 'Lanceer van ingebouwde video-screenings voor snellere selectie.' },
              { year: 'Q1 2027', title: 'Freelance Marketplace', desc: 'Een speciale hub voor Surinaamse zzp-ers en projectmatige opdrachten.' },
              { year: 'Q4 2027', title: 'Intelligence API for Gov', desc: 'Data-partnerships om de arbeidsmarkt landelijk te optimaliseren.' },
            ].map((milestone, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 items-start border-b-2 border-slate-100 pb-12 group">
                <div className="text-4xl font-black text-blue-100 group-hover:text-blue-600 transition-colors shrink-0">{milestone.year}</div>
                <div>
                  <h6 className="text-2xl font-black uppercase tracking-tight italic mb-2">{milestone.title}</h6>
                  <p className="text-lg font-bold text-slate-500 italic uppercase tracking-tight">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Join CTA */}
      <section className="bg-black text-white py-32 relative overflow-hidden border-t-8 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic mb-12 leading-none">
            Join the <br/><span className="text-blue-600 italic">Revolution.</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth" className="bg-blue-600 px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
              Ik zoek personeel
            </Link>
            <Link href="/vacatures" className="bg-white text-black px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-blue-600 hover:text-white transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
              Ik zoek een baan
            </Link>
          </div>
        </div>
        <TrendingUp className="absolute -bottom-20 -left-20 w-[600px] h-[600px] text-white/5 pointer-events-none" />
      </section>

      {/* Footer Minimal */}
      <footer className="bg-white py-12 border-t-2 border-slate-100 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          SuriJobs+ — Building The Future of Suriname
        </div>
      </footer>
    </div>
  );
}
