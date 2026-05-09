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

interface Sector {
  label: string;
  desc: string;
  icon: typeof Code2;
  accent: 'orange' | 'emerald' | 'slate';
}

const SECTORS: Sector[] = [
  { label: 'IT, Data & Digital', desc: 'Expertise voor complexe digitale ecosystemen en transformaties.', icon: Code2, accent: 'orange' },
  { label: 'Energy & Offshore', desc: 'Strategisch talent voor de offshore en hernieuwbare energie revolutie.', icon: Zap, accent: 'orange' },
  { label: 'Finance & Legal', desc: 'Top-tier profielen voor de financiële architectuur van uw organisatie.', icon: DollarSign, accent: 'emerald' },
  { label: 'Construction & Engineering', desc: 'Visionairs voor de infrastructuur en civiele projecten van de toekomst.', icon: HardHat, accent: 'orange' },
  { label: 'Logistics & Maritime', desc: 'Specialisten voor supply chain optimalisatie en maritieme operaties.', icon: Truck, accent: 'slate' },
  { label: 'Risk & Insurance', desc: 'Risico-strategen en experts voor continuïteit en zekerheid.', icon: BarChart3, accent: 'emerald' },
  { label: 'Hospitality & Tourism', desc: 'Service excellence voor de toonaangevende spelers in toerisme.', icon: Star, accent: 'orange' },
  { label: 'Security & Facility', desc: 'Professionals voor de integrale veiligheid van uw assets.', icon: ShieldCheck, accent: 'slate' },
  { label: 'Agri & Bio-productie', desc: 'Innovatiekracht voor de modernisering van de agrarische sector.', icon: Sprout, accent: 'emerald' },
  { label: 'HR & Executive Search', desc: 'Strategisch leiderschap en ontwikkeling van menselijk kapitaal.', icon: Target, accent: 'orange' },
  { label: 'Retail & Distributie', desc: 'Management talent voor de dynamische wereld van retail en distributie.', icon: ShoppingBag, accent: 'slate' },
];

export default function SectorenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans pb-24">
      {/* Hero */}
      <section className="bg-black text-white py-20 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Briefcase className="w-3 h-3" /> Onze Specialismen
          </div>
          <h1 className="text-5xl xs:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6 max-w-4xl">
            Sectoren waarin wij <span className="text-blue-600 italic">thuis zijn</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-slate-400 max-w-2xl">
            Van IT tot offshore, van finance tot hospitality — onze headhunters kennen de spelers, de skills en de schaarste in elke vitale industrie van Suriname.
          </p>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTORS.map((sect, i) => (
            <SectorCard
              key={sect.label}
              index={i + 1}
              label={sect.label}
              desc={sect.desc}
              icon={sect.icon}
              accent={sect.accent}
              onClick={() => router.push(`/vacatures?q=${encodeURIComponent(sect.label)}`)}
            />
          ))}

          <Link
            href="/voor-werkgevers"
            className="bg-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between min-h-[280px] hover:bg-black transition-all group"
          >
            <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-tight">
              Staat uw sector er <span className="text-orange-500">niet bij?</span>
            </h4>
            <div>
              <p className="text-sm font-bold text-slate-400 mb-6">
                Onze headhunters zijn getraind in specialistische search over alle vitale industrieën in Suriname.
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Custom Search <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

function SectorCard({
  index, label, desc, icon: Icon, accent, onClick,
}: {
  index: number;
  label: string;
  desc: string;
  icon: typeof Code2;
  accent: 'orange' | 'emerald' | 'slate';
  onClick: () => void;
}) {
  const accentClasses = {
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-700',
  }[accent];
  const idx = String(index).padStart(2, '0');
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-slate-50 rounded-2xl p-7 flex flex-col text-left min-h-[280px] hover:bg-white hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.06)] transition-all group border border-transparent hover:border-slate-200"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', accentClasses)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-300 tracking-widest">/{idx}</span>
      </div>
      <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-tight mb-3">{label}</h4>
      <p className="text-sm font-bold text-slate-500 leading-relaxed mb-auto">{desc}</p>
    </motion.button>
  );
}
