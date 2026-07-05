'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Sparkles,
  Globe,
  Cpu,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/LanguageProvider';

const OVERONS_T = {
  nl: {
    heroBadge: 'Gebouwd in Suriname voor Suriname',
    heroTitleA: 'Onze Missie:',
    heroTitleHighlight: 'Transparantie',
    heroSubtitle: 'Jobparsing+ is niet zomaar een vacaturebank. Wij zijn het antwoord op de chaos en onzekerheid van de huidige Surinaamse arbeidsmarkt.',
    whyTitle: 'Waarom Jobparsing+?',
    whyP1: 'In 2026 was de Surinaamse arbeidsmarkt gefragmenteerd. Vacatures stonden op Facebook, WhatsApp-groepen en verouderde websites zonder enige controle of transparantie over salarissen.',
    whyP2: 'Wij zagen hoe goed talent verloren ging door gebrekkige matching en hoe bedrijven maandenlang zochten naar de juiste mensen. Jobparsing+ is gebouwd om deze barrières te doorbreken met behulp van AI en een compromisloze focus op data-integriteit.',
    quote: '"Wij geloven dat een eerlijke baan de basis is voor een sterke economie. Wij maken die verbinding mogelijk."',
    quoteName: 'Founder Team',
    quoteRole: 'Jobparsing Intelligence Unit',
    valuesEyebrow: 'Onze Kernwaarden',
    valuesTitleA: 'Geen Bullshit. Alleen',
    valuesTitleHighlight: 'Resultaat',
    value1Title: 'Radicale Transparantie',
    value1Desc: 'Wij pushen werkgevers om eerlijk te zijn over salarissen en secundaire voorwaarden. Geen verrassingen bij het eerste gesprek.',
    value2Title: 'AI-Eerst Engineering',
    value2Desc: "Onze CV-parsers en match-algoritmes zijn getraind op de lokale context, inclusief Surinaamse diploma's en bedrijfsculturen.",
    value3Title: 'Focus op Impact',
    value3Desc: 'Ons succes wordt niet gemeten in clicks, maar in de duizenden mensen die we helpen hun carrière te transformeren.',
    ctaTitleA: 'Join the',
    ctaTitleHighlight: 'Revolution.',
    ctaEmployer: 'Ik zoek personeel',
    ctaSeeker: 'Ik zoek een baan',
    footerTagline: 'Jobparsing+ — Building The Future of Suriname',
  },
  en: {
    heroBadge: 'Built in Suriname for Suriname',
    heroTitleA: 'Our Mission:',
    heroTitleHighlight: 'Transparency',
    heroSubtitle: 'Jobparsing+ is not just another job board. We are the answer to the chaos and uncertainty of the current Surinamese labour market.',
    whyTitle: 'Why Jobparsing+?',
    whyP1: 'In 2026 the Surinamese labour market was fragmented. Vacancies were scattered across Facebook, WhatsApp groups and outdated websites without any oversight or transparency about salaries.',
    whyP2: 'We saw great talent go to waste due to poor matching, and companies searching for months to find the right people. Jobparsing+ was built to break down these barriers using AI and an uncompromising focus on data integrity.',
    quote: '"We believe a fair job is the foundation of a strong economy. We make that connection possible."',
    quoteName: 'Founder Team',
    quoteRole: 'Jobparsing Intelligence Unit',
    valuesEyebrow: 'Our Core Values',
    valuesTitleA: 'No Bullshit. Only',
    valuesTitleHighlight: 'Results',
    value1Title: 'Radical Transparency',
    value1Desc: 'We push employers to be honest about salaries and benefits. No surprises at the first interview.',
    value2Title: 'AI-First Engineering',
    value2Desc: 'Our CV parsers and matching algorithms are trained on the local context, including Surinamese diplomas and company cultures.',
    value3Title: 'Focus on Impact',
    value3Desc: 'Our success is not measured in clicks, but in the thousands of people we help transform their careers.',
    ctaTitleA: 'Join the',
    ctaTitleHighlight: 'Revolution.',
    ctaEmployer: "I'm hiring",
    ctaSeeker: "I'm looking for a job",
    footerTagline: 'Jobparsing+ — Building The Future of Suriname',
  },
  es: {
    heroBadge: 'Construido en Surinam para Surinam',
    heroTitleA: 'Nuestra Misión:',
    heroTitleHighlight: 'Transparencia',
    heroSubtitle: 'Jobparsing+ no es una simple bolsa de empleo. Somos la respuesta al caos y la incertidumbre del actual mercado laboral surinamés.',
    whyTitle: '¿Por qué Jobparsing+?',
    whyP1: 'En 2026 el mercado laboral surinamés estaba fragmentado. Las vacantes estaban en Facebook, grupos de WhatsApp y sitios web obsoletos, sin ningún control ni transparencia sobre los salarios.',
    whyP2: 'Vimos cómo se perdía buen talento por una mala selección y cómo las empresas buscaban durante meses a las personas adecuadas. Jobparsing+ se creó para derribar estas barreras con IA y un enfoque intransigente en la integridad de los datos.',
    quote: '"Creemos que un empleo justo es la base de una economía fuerte. Nosotros hacemos posible esa conexión."',
    quoteName: 'Founder Team',
    quoteRole: 'Jobparsing Intelligence Unit',
    valuesEyebrow: 'Nuestros Valores',
    valuesTitleA: 'Sin tonterías. Solo',
    valuesTitleHighlight: 'Resultados',
    value1Title: 'Transparencia Radical',
    value1Desc: 'Impulsamos a los empleadores a ser honestos sobre salarios y condiciones. Sin sorpresas en la primera entrevista.',
    value2Title: 'Ingeniería AI-First',
    value2Desc: 'Nuestros analizadores de CV y algoritmos de coincidencia están entrenados en el contexto local, incluidos los diplomas y las culturas empresariales de Surinam.',
    value3Title: 'Enfoque en el Impacto',
    value3Desc: 'Nuestro éxito no se mide en clics, sino en las miles de personas a las que ayudamos a transformar su carrera.',
    ctaTitleA: 'Únete a la',
    ctaTitleHighlight: 'Revolución.',
    ctaEmployer: 'Busco personal',
    ctaSeeker: 'Busco empleo',
    footerTagline: 'Jobparsing+ — Building The Future of Suriname',
  },
};

export default function OverOnsPage() {
  const t = useT(OVERONS_T);
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
              <Globe className="w-4 h-4" /> {t.heroBadge}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-12">
              {t.heroTitleA} <br/><span className="text-blue-600 italic underline decoration-blue-100 decoration-8 underline-offset-8">{t.heroTitleHighlight}</span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold uppercase tracking-tight italic text-slate-500 leading-tight max-w-3xl">
              {t.heroSubtitle}
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/2" />
      </section>

      {/* The Origin Story */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 lg:gap-24 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter italic leading-none">
                  {t.whyTitle}
                </h2>
                <span className="block w-24 h-1.5 bg-blue-600 mt-4" />
              </div>
              <div className="space-y-8 text-lg font-bold text-slate-600 leading-relaxed italic">
                <p>
                  {t.whyP1}
                </p>
                <p>
                  {t.whyP2}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-black p-12 border-8 border-blue-600 shadow-[32px_32px_0px_0px_rgba(241,245,249,1)]">
                <blockquote className="text-3xl font-black text-white uppercase italic leading-[0.9] tracking-tighter mb-12">
                  {t.quote}
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-none border-2 border-white" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white">{t.quoteName}</div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t.quoteRole}</div>
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
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4 italic">{t.valuesEyebrow}</h3>
            <h4 className="text-6xl font-black uppercase tracking-tighter italic">{t.valuesTitleA} <span className="text-blue-600 italic">{t.valuesTitleHighlight}</span>.</h4>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-4 border-black p-6 md:p-10 hover:-translate-y-2 transition-transform">
              <Sparkles className="w-12 h-12 text-blue-600 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t.value1Title}</h5>
              <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                {t.value1Desc}
              </p>
            </div>
            <div className="bg-black text-white p-10 hover:-translate-y-2 transition-transform shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
              <Cpu className="w-12 h-12 text-blue-400 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t.value2Title}</h5>
              <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                {t.value2Desc}
              </p>
            </div>
            <div className="bg-white border-4 border-black p-6 md:p-10 hover:-translate-y-2 transition-transform">
              <Target className="w-12 h-12 text-blue-600 mb-8" />
              <h5 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t.value3Title}</h5>
              <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                {t.value3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Join CTA */}
      <section className="bg-black text-white py-32 relative overflow-hidden border-t-8 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic mb-12 leading-none">
            {t.ctaTitleA} <br/><span className="text-blue-600 italic">{t.ctaTitleHighlight}</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth" className="bg-blue-600 px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
              {t.ctaEmployer}
            </Link>
            <Link href="/vacatures" className="bg-white text-black px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-blue-600 hover:text-white transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
              {t.ctaSeeker}
            </Link>
          </div>
        </div>
        <TrendingUp className="absolute -bottom-20 -left-20 w-[600px] h-[600px] text-white/5 pointer-events-none" />
      </section>

      {/* Footer Minimal */}
      <footer className="bg-white py-12 border-t-2 border-slate-100 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          {t.footerTagline}
        </div>
      </footer>
    </div>
  );
}
