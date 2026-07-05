'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Code2,
  Zap,
  DollarSign,
  HardHat,
  Truck,
  BarChart3,
  Star,
  ShieldCheck,
  Sprout,
  Target,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';

const SECTOREN_T = {
  nl: {
    heroBadge: 'Onze Specialismen',
    heroTitleA: 'Sectoren waarin wij',
    heroTitleHighlight: 'thuis zijn',
    heroSubtitle:
      'Van IT tot offshore, van finance tot hospitality — onze headhunters kennen de spelers, de skills en de schaarste in elke vitale industrie van Suriname.',
    notListedTitleA: 'Staat uw sector er',
    notListedTitleHighlight: 'niet bij?',
    notListedDesc:
      'Onze headhunters zijn getraind in specialistische search over alle vitale industrieën in Suriname.',
    customSearch: 'Custom Search',
    sectors: [
      { label: 'IT, Data & Digital', desc: 'Expertise voor complexe digitale ecosystemen en transformaties.' },
      { label: 'Energy & Offshore', desc: 'Strategisch talent voor de offshore en hernieuwbare energie revolutie.' },
      { label: 'Finance & Legal', desc: 'Top-tier profielen voor de financiële architectuur van uw organisatie.' },
      { label: 'Construction & Engineering', desc: 'Visionairs voor de infrastructuur en civiele projecten van de toekomst.' },
      { label: 'Logistics & Maritime', desc: 'Specialisten voor supply chain optimalisatie en maritieme operaties.' },
      { label: 'Risk & Insurance', desc: 'Risico-strategen en experts voor continuïteit en zekerheid.' },
      { label: 'Hospitality & Tourism', desc: 'Service excellence voor de toonaangevende spelers in toerisme.' },
      { label: 'Security & Facility', desc: 'Professionals voor de integrale veiligheid van uw assets.' },
      { label: 'Agri & Bio-productie', desc: 'Innovatiekracht voor de modernisering van de agrarische sector.' },
      { label: 'HR & Executive Search', desc: 'Strategisch leiderschap en ontwikkeling van menselijk kapitaal.' },
      { label: 'Retail & Distributie', desc: 'Management talent voor de dynamische wereld van retail en distributie.' },
    ],
  },
  en: {
    heroBadge: 'Our Specialisms',
    heroTitleA: 'Sectors we call',
    heroTitleHighlight: 'home',
    heroSubtitle:
      'From IT to offshore, from finance to hospitality — our headhunters know the players, the skills and the scarcity in every vital industry in Suriname.',
    notListedTitleA: "Don't see your",
    notListedTitleHighlight: 'sector?',
    notListedDesc:
      'Our headhunters are trained in specialist search across every vital industry in Suriname.',
    customSearch: 'Custom Search',
    sectors: [
      { label: 'IT, Data & Digital', desc: 'Expertise for complex digital ecosystems and transformations.' },
      { label: 'Energy & Offshore', desc: 'Strategic talent for the offshore and renewable energy revolution.' },
      { label: 'Finance & Legal', desc: 'Top-tier profiles for your organisation’s financial architecture.' },
      { label: 'Construction & Engineering', desc: 'Visionaries for the infrastructure and civil projects of the future.' },
      { label: 'Logistics & Maritime', desc: 'Specialists for supply chain optimisation and maritime operations.' },
      { label: 'Risk & Insurance', desc: 'Risk strategists and experts for continuity and certainty.' },
      { label: 'Hospitality & Tourism', desc: 'Service excellence for the leading players in tourism.' },
      { label: 'Security & Facility', desc: 'Professionals for the integral security of your assets.' },
      { label: 'Agri & Bio-production', desc: 'Innovation power for the modernisation of the agricultural sector.' },
      { label: 'HR & Executive Search', desc: 'Strategic leadership and the development of human capital.' },
      { label: 'Retail & Distribution', desc: 'Management talent for the dynamic world of retail and distribution.' },
    ],
  },
  es: {
    heroBadge: 'Nuestras Especialidades',
    heroTitleA: 'Sectores en los que nos sentimos',
    heroTitleHighlight: 'como en casa',
    heroSubtitle:
      'De TI a offshore, de finanzas a hostelería — nuestros headhunters conocen a los actores, las competencias y la escasez en cada industria vital de Surinam.',
    notListedTitleA: '¿No aparece tu',
    notListedTitleHighlight: 'sector?',
    notListedDesc:
      'Nuestros headhunters están capacitados en búsqueda especializada en todas las industrias vitales de Surinam.',
    customSearch: 'Búsqueda a Medida',
    sectors: [
      { label: 'TI, Datos & Digital', desc: 'Experiencia para ecosistemas digitales complejos y transformaciones.' },
      { label: 'Energía & Offshore', desc: 'Talento estratégico para la revolución offshore y de energías renovables.' },
      { label: 'Finanzas & Legal', desc: 'Perfiles de primer nivel para la arquitectura financiera de tu organización.' },
      { label: 'Construcción & Ingeniería', desc: 'Visionarios para la infraestructura y los proyectos civiles del futuro.' },
      { label: 'Logística & Marítimo', desc: 'Especialistas en optimización de la cadena de suministro y operaciones marítimas.' },
      { label: 'Riesgo & Seguros', desc: 'Estrategas de riesgo y expertos para la continuidad y la certeza.' },
      { label: 'Hostelería & Turismo', desc: 'Excelencia en el servicio para los principales actores del turismo.' },
      { label: 'Seguridad & Instalaciones', desc: 'Profesionales para la seguridad integral de tus activos.' },
      { label: 'Agro & Bioproducción', desc: 'Fuerza innovadora para la modernización del sector agrícola.' },
      { label: 'RRHH & Executive Search', desc: 'Liderazgo estratégico y desarrollo del capital humano.' },
      { label: 'Retail & Distribución', desc: 'Talento directivo para el dinámico mundo del retail y la distribución.' },
    ],
  },
};

interface SectorMeta {
  icon: typeof Code2;
  accent: 'orange' | 'emerald' | 'slate';
}

const SECTOR_META: SectorMeta[] = [
  { icon: Code2, accent: 'orange' },
  { icon: Zap, accent: 'orange' },
  { icon: DollarSign, accent: 'emerald' },
  { icon: HardHat, accent: 'orange' },
  { icon: Truck, accent: 'slate' },
  { icon: BarChart3, accent: 'emerald' },
  { icon: Star, accent: 'orange' },
  { icon: ShieldCheck, accent: 'slate' },
  { icon: Sprout, accent: 'emerald' },
  { icon: Target, accent: 'orange' },
  { icon: ShoppingBag, accent: 'slate' },
];

export default function SectorenPage() {
  const router = useRouter();
  const t = useT(SECTOREN_T);

  return (
    <div className="min-h-screen bg-white font-sans pb-24">
      {/* Hero */}
      <section className="bg-black text-white py-20 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Briefcase className="w-3 h-3" /> {t.heroBadge}
          </div>
          <h1 className="text-5xl xs:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6 max-w-4xl">
            {t.heroTitleA} <span className="text-blue-600 italic">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-slate-400 max-w-2xl">
            {t.heroSubtitle}
          </p>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.sectors.map((sect, i) => {
            const meta = SECTOR_META[i];
            return (
              <SectorCard
                key={sect.label}
                index={i + 1}
                label={sect.label}
                desc={sect.desc}
                icon={meta.icon}
                accent={meta.accent}
                href={`/vacatures?q=${encodeURIComponent(sect.label)}`}
              />
            );
          })}

          <Link
            href="/voor-werkgevers"
            className="bg-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between min-h-[280px] hover:bg-black transition-all group"
          >
            <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-tight">
              {t.notListedTitleA} <span className="text-orange-500">{t.notListedTitleHighlight}</span>
            </h4>
            <div>
              <p className="text-sm font-bold text-slate-400 mb-6">
                {t.notListedDesc}
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {t.customSearch} <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

function SectorCard({
  index, label, desc, icon: Icon, accent, href,
}: {
  index: number;
  label: string;
  desc: string;
  icon: typeof Code2;
  accent: 'orange' | 'emerald' | 'slate';
  href: string;
}) {
  const accentClasses = {
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-700',
  }[accent];
  const idx = String(index).padStart(2, '0');
  // Echte <Link> i.p.v. button+router.push: middenklik/nieuw tabblad werkt,
  // toetsenbord-navigatie en crawlers zien de sector-pagina's.
  return (
    <Link
      href={href}
      className="bg-slate-50 rounded-2xl p-7 flex flex-col text-left min-h-[280px] hover:bg-white hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all group border border-transparent hover:border-slate-200"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', accentClasses)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-300 tracking-widest">/{idx}</span>
      </div>
      <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-tight mb-3">{label}</h4>
      <p className="text-sm font-bold text-slate-500 leading-relaxed mb-auto">{desc}</p>
    </Link>
  );
}
