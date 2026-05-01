'use client';

import React, { useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  Code2, 
  BrainCircuit, 
  Award,
  Zap,
  Terminal,
  ChevronRight,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, MessageSquare, Phone, Mail, FileText } from 'lucide-react';
import { dedupeBy, isNonEmpty } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';
import { useFocusTrap } from '@/hooks/use-focus-trap';


const TALENT = [
  {
    name: 'Jurgen Dijkstra',
    title: 'Senior Software Engineer',
    skills: ['React', 'Node.js', 'Next.js', 'PostgreSQL'],
    location: 'Paramaribo',
    experience: '8 Jaar',
    matchScore: 98,
    marketSkills: ['Cloud Architecture', 'System Scalability', 'Advanced API Design'],
    status: 'Direct Beschikbaar',
    verified: true
  },
  {
    name: 'Sita Ramdin',
    title: 'UX/UI Designer',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'Accessibility'],
    location: 'Wanica',
    experience: '5 Jaar',
    matchScore: 94,
    marketSkills: ['Design Systems', 'User Research', 'Motion Design'],
    status: 'In Gesprek',
    verified: true
  },
  {
    name: 'Marvin Pinas',
    title: 'DevOps Lead',
    skills: ['Kubernetes', 'AWS', 'Docker', 'CI/CD'],
    location: 'Paramaribo',
    experience: '6 Jaar',
    matchScore: 91,
    marketSkills: ['Infrastructure as Code', 'Security Audit', 'Automation'],
    status: 'Open voor Aanbod',
    verified: true
  },
  {
    name: 'Anjali Sewratan',
    title: 'Marketing Strategist',
    skills: ['Growth Hacking', 'SEO/SEM', 'Content Strategy'],
    location: 'Heel Suriname',
    experience: '4 Jaar',
    matchScore: 89,
    marketSkills: ['Data Analytics', 'Viral Marketing', 'Brand Identity'],
    status: 'Direct Beschikbaar',
    verified: false
  }
];

const DEFAULT_CONNECT_FORM = { job: 'Senior Systems Engineer', message: '' };

function getNextLocalConnectionId(existingConnections: Array<{ id?: number | string }>) {
  const numericIds = existingConnections
    .map((connection) => Number(connection.id))
    .filter((id) => Number.isFinite(id));

  return (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
}

export default function TalentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [connectForm, setConnectForm] = useState(DEFAULT_CONNECT_FORM);
  const [connectErrors, setConnectErrors] = useState<{ job?: string; message?: string }>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(() => {
    return readJson('suri_user', null);
  });

  const closeTalentModal = useCallback(() => {
    if (isConnecting) return;
    setSelectedTalent(null);
    setIsSuccess(false);
    setConnectErrors({});
    setConnectForm(DEFAULT_CONNECT_FORM);
  }, [isConnecting]);

  useDismissibleLayer(Boolean(selectedTalent) && !isConnecting, modalRef, closeTalentModal);
  useFocusTrap(Boolean(selectedTalent), modalRef);

  useEffect(() => {
    const handleStorage = () => {
      setUser(readJson('suri_user', null));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredTalent = TALENT.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'employer') {
      router.push('/auth');
      return;
    }

    const nextErrors: typeof connectErrors = {};
    if (!isNonEmpty(connectForm.job)) nextErrors.job = 'Selecteer een vacature of kies algemene interesse.';
    if (!isNonEmpty(connectForm.message) || connectForm.message.trim().length < 20) {
      nextErrors.message = 'Schrijf een bericht van minimaal 20 tekens.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setConnectErrors(nextErrors);
      return;
    }

    setIsConnecting(true);
    setConnectErrors({});

    setTimeout(() => {
      setIsConnecting(false);
      setIsSuccess(true);
      
      const existing = readJson<any[]>('suri_connections', []);
      const normalizedJob = connectForm.job.trim();
      const normalizedMessage = connectForm.message.trim();
      const existingConnection = existing.find((connection) =>
        connection.talentId === selectedTalent.name &&
        String(connection.employerEmail || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase() &&
        String(connection.job || '').trim().toLowerCase() === normalizedJob.toLowerCase()
      );

      if (existingConnection) {
        setStatusMessage(`Connectie met ${selectedTalent.name} voor ${normalizedJob} bestond al en is bijgewerkt.`);
      }

      const newConn = {
        id: existingConnection?.id ?? getNextLocalConnectionId(existing),
        talentId: selectedTalent.name,
        employerEmail: user.email,
        employerName: user.name,
        job: normalizedJob,
        message: normalizedMessage,
        date: new Date().toISOString()
      };
      writeJson('suri_connections', dedupeBy([newConn, ...existing], (item) => `${item.talentId}-${item.employerEmail}-${item.job}`));

      setTimeout(() => {
        closeTalentModal();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Talent Hero */}
      <section className="bg-blue-600 text-white py-24 border-b-8 border-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-8">
              <Zap className="w-4 h-4 text-yellow-400" /> Talent Feed 2026
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8 italic">
              Vind het <br/>Beste <span className="text-black underline decoration-white decoration-8 underline-offset-8">Talent</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-blue-100 uppercase tracking-tight italic max-w-2xl leading-tight">
              Toegang tot de meest gekwalificeerde professionals in Suriname. <br className="hidden md:block"/>Geverifieerd door de SuriJobs+ AI Engine.
            </p>
          </motion.div>
        </div>
        <Terminal className="absolute -bottom-10 -right-20 w-96 h-96 text-black/10 rotate-12" />
      </section>

      {/* Advanced Talent Filter */}
      <section className="py-12 bg-white border-b-2 border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Zoek talent op skill (bv. React, Project Management)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-black p-5 pl-14 font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-all brutal-shadow"
              />
            </div>
            <div className="md:col-span-4 flex gap-4">
              <select className="flex-1 bg-white border-2 border-black p-5 font-black uppercase tracking-[0.2em] text-[10px] outline-none cursor-pointer hover:bg-slate-50 brutal-shadow">
                <option>Alle Sectoren</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
              </select>
              <select className="flex-1 bg-white border-2 border-black p-5 font-black uppercase tracking-[0.2em] text-[10px] outline-none cursor-pointer hover:bg-slate-50 brutal-shadow">
                <option>Beschikbaarheid</option>
                <option>Direct</option>
                <option>In Overleg</option>
              </select>
            </div>
            <button onClick={() => setStatusMessage('Talent feed ververst. Resultaten zijn opnieuw geladen.')} className="md:col-span-2 brutal-button-primary py-5 text-xs shadow-none">
              Refresh Feed
            </button>
          </div>
          {statusMessage && <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">{statusMessage}</p>}
        </div>
      </section>

      {/* Talent Pipeline View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b-4 border-slate-100 pb-10 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
              Top Matches <span className="text-blue-600">Voor Werkgevers</span>
            </h2>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {TALENT.length} geverifieerde profielen gevonden deze week in Suriname
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-14 h-14 border-4 border-black flex items-center justify-center bg-black text-white brutal-shadow cursor-pointer hover:bg-blue-600 transition-all"><Filter className="w-6 h-6" /></div>
            <div className="w-14 h-14 border-4 border-black flex items-center justify-center bg-white text-black hover:bg-slate-50 transition-all brutal-shadow cursor-help tooltip-trigger relative group">
              <BrainCircuit className="w-6 h-6" />
              <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-black text-white text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] scale-90 group-hover:scale-100">
                AI Match Score analyseert 200+ datapunten voor maximale fit.
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {filteredTalent.map((person, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              key={person.name}
              className="group bg-white border-4 border-black p-10 relative hover:border-blue-600 transition-colors brutal-card shadow-none hover:shadow-[24px_24px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="absolute top-10 right-10 flex flex-col items-end">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Vetting Score</div>
                <div className="text-5xl font-black italic group-hover:text-blue-600 transition-colors leading-none">{person.matchScore}%</div>
              </div>

              <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 bg-slate-900 text-white font-black text-3xl border-4 border-blue-600 group-hover:rotate-6 transition-transform flex items-center justify-center brutal-shadow-sm">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-2 leading-none">{person.name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest">{person.title}</p>
                    {person.verified && (
                      <div className="bg-yellow-400 border-2 border-black px-3 py-0.5 font-black text-[9px] uppercase tracking-widest -rotate-2">
                        AI Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3 italic border-b-2 border-blue-600 w-fit pb-0.5">Core Tech Stack</h4>
                    <div className="flex flex-wrap gap-3">
                      {person.skills.map(skill => (
                        <span key={skill} className="bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black brutal-shadow-sm group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3 italic border-b-2 border-emerald-600 w-fit pb-0.5">Strategische Skills (Analysed)</h4>
                    <div className="flex flex-wrap gap-3">
                      {(person.marketSkills || []).map(skill => (
                        <span key={skill} className="bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-emerald-200 text-emerald-700 italic brutal-shadow-sm !shadow-emerald-600/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-t-2 border-slate-50 pt-6">
                  <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600" /> {person.location}</span>
                  <span className="flex items-center gap-3"><Award className="w-5 h-5 text-blue-600" /> {person.experience} Exp.</span>
                  <span className={cn(
                    "flex items-center gap-3 italic",
                    person.status === 'Direct Beschikbaar' ? "text-emerald-600 underline underline-offset-4" : "text-slate-400"
                  )}>
                    <Zap className={cn("w-5 h-5 fill-current transition-all", person.status === 'Direct Beschikbaar' ? "text-emerald-500 scale-110" : "text-slate-200")} /> {person.status}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <button type="button" disabled title="Portfolio komt binnenkort beschikbaar" className="bg-black text-white py-5 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 brutal-shadow opacity-60 cursor-not-allowed">
                  Portfolio Inzien <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    if (!user || user.role !== 'employer') {
                      router.push('/auth');
                      return;
                    }
                    setConnectErrors({});
                    setConnectForm(DEFAULT_CONNECT_FORM);
                    setSelectedTalent(person);
                  }}
                  className={cn(
                    "border-4 py-5 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 brutal-shadow",
                    !user || user.role !== 'employer' ? "bg-slate-100 text-slate-400 border-slate-200 hover:bg-black hover:text-white" : "bg-white text-black border-black hover:bg-slate-50"
                  )}
                >
                  {(!user || user.role !== 'employer') && <Building2 className="w-5 h-5" />}
                  {user?.role === 'employer' ? "Direct Connectie" : "Login als Werkgever"}
                </button>
              </div>
            </motion.div>
          ))}
          
          {filteredTalent.length === 0 && (
            <div className="col-span-2 py-20 text-center border-4 border-dashed border-slate-100">
               <Users className="w-16 h-16 text-slate-100 mx-auto mb-6" />
               <p className="text-sm font-black uppercase tracking-widest text-slate-300 italic">Geen talent gevonden voor deze criteria.</p>
            </div>
          )}
        </div>

        {/* CTA Area */}
        <div className="mt-24 bg-slate-900 p-12 md:p-20 text-white text-center border-b-8 border-blue-600 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
              Krijg toegang tot de <span className="text-emerald-400 italic">Pre-Vetted</span> Pipeline.
            </h3>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mb-12 italic">
              Recruit sneller met onze automatische matching en background checks.
            </p>
            <button 
              onClick={() => {
                setStatusMessage('Enterprise aanvraag verzonden. Ons team neemt binnen 24 uur contact op.');
              }}
              className="bg-white text-black px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-blue-600 hover:text-white transition-all shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]"
            >
              Request Enterprise Access
            </button>
          </div>
          <Code2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-white/5 pointer-events-none" />
        </div>
      </main>

      {/* Connect Talent Modal */}
      {selectedTalent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Connect met talent"
            className="bg-white w-full max-w-xl relative z-10 border-4 border-black p-10 shadow-[24px_24px_0px_0px_rgba(59,130,246,1)]"
          >
            <button onClick={closeTalentModal} aria-label="Sluit connectie venster" className="absolute top-6 right-6 p-2 hover:bg-slate-100 transition-colors" disabled={isConnecting}>
              <X className="w-6 h-6" />
            </button>

            {isSuccess ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Aanvraag Verzonden!</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTalent.name} heeft een bericht ontvangen.</p>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Connect met {selectedTalent.name.split(' ')[0]}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 italic leading-relaxed">
                  Stuur een bericht om direct in contact te komen over een functie.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Selecteer Vacature</label>
                  <select value={connectForm.job} onChange={(e) => setConnectForm((prev) => ({ ...prev, job: e.target.value }))} className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[10px]">
                    <option>Senior Systems Engineer</option>
                    <option>UI/UX Lead</option>
                    <option>Algemene Interesse</option>
                  </select>
                  {connectErrors.job && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{connectErrors.job}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Bericht</label>
                  <textarea value={connectForm.message} onChange={(e) => setConnectForm((prev) => ({ ...prev, message: e.target.value }))} required className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-xs min-h-[120px]" placeholder="HOI, WE ZIJN ONDER DE INDRUK VAN JE PROFIEL..." />
                  {connectErrors.message && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{connectErrors.message}</p>}
                </div>

                <button 
                  disabled={isConnecting}
                  type="submit"
                  className="w-full bg-black text-white py-6 font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isConnecting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verzenden"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
