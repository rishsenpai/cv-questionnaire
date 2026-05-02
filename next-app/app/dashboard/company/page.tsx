'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Vacancy {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string;
  employmentType?: string;
  isRemote?: boolean;
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  source?: string;
  createdAt: string;
  postedAt?: string;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  requirements: '',
  location: 'Paramaribo',
  employmentType: 'Full-time',
  isRemote: false,
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'SRD',
  salaryPeriod: 'month',
};

export default function CompanyDashboard() {
  const router = useRouter();
  const { employer, employerToken, isLoading, logoutEmployer } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedFromFile, setParsedFromFile] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!employerToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/employer/vacancies', {
        headers: { 'x-employer-token': employerToken },
      });
      const data = await res.json();
      if (data.success) setVacancies(data.data);
    } finally {
      setLoading(false);
    }
  }, [employerToken]);

  useEffect(() => {
    if (isLoading) return;
    if (!employerToken) {
      router.push('/auth');
      return;
    }
    reload();
  }, [isLoading, employerToken, router, reload]);

  const handleLogout = () => {
    logoutEmployer();
    router.push('/');
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 4.5 * 1024 * 1024) {
      setError('Bestand is groter dan 4.5 MB.');
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setError('Alleen PDF of Word (.docx) ondersteund.');
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/parse-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Vacature analyseren mislukt');
        return;
      }
      // Map parsed fields naar form. Parser geeft: title, location, requirements.
      // 'requirements' bevat de complete tekst, dus die zetten we in description.
      setForm(f => ({
        ...f,
        title: data.data.title || f.title,
        location: data.data.location || f.location,
        description: data.data.requirements || f.description,
      }));
      setParsedFromFile(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbinding mislukt');
    } finally {
      setParsing(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-employer-token': employerToken },
        body: JSON.stringify({
          ...form,
          company: employer?.companyName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Vacature plaatsen mislukt');
        return;
      }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await reload();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVacancy = async (id: string) => {
    if (!employerToken) return;
    if (!confirm('Vacature verwijderen?')) return;
    setBusy(true);
    try {
      await fetch(`/api/employer/vacancies/${id}`, {
        method: 'DELETE',
        headers: { 'x-employer-token': employerToken },
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!employer) {
    return null; // useEffect redirects naar /auth
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-16 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <Briefcase className="w-3 h-3" /> Werkgever Portal
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
              Welkom, <span className="text-blue-600 italic">{employer.companyName}</span>
            </h1>
            <p className="text-base font-bold text-slate-400 uppercase tracking-tight italic">
              Beheer je vacatures op één plek.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/5 border-2 border-white/20 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3"
          >
            <LogOut className="w-3 h-3" /> Uitloggen
          </button>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-slate-100 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">Mijn Vacatures</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              {vacancies.length} actieve vacature{vacancies.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(s => !s)}
            className="bg-blue-600 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <Plus className="w-3 h-3" /> Nieuwe Vacature
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={submitCreate} className="bg-white border-4 border-blue-600 p-8 space-y-4 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.15)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Nieuwe Vacature</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Plaats een vacature die direct zichtbaar wordt voor kandidaten
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AI-fill: upload bestaande vacature */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                      <Sparkles className="w-3 h-3" /> AI Auto-Fill
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      Heb je al een vacature in een Word- of PDF-bestand?
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 italic">
                      Upload het bestand → AI vult de velden automatisch in. Je kan daarna nog alles bewerken.
                    </p>
                    {parsedFromFile && (
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Ingevuld vanuit: {parsedFromFile}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {parsing ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyseren...</> : <><UploadCloud className="w-3 h-3" /> Upload Bestand</>}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Functietitel *</Label>
                    <input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior Software Developer" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <Label>Locatie</Label>
                    <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Paramaribo" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <Label>Type dienstverband</Label>
                    <select value={form.employmentType} onChange={(e) => setForm(f => ({ ...f, employmentType: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Tijdelijk</option>
                      <option value="Internship">Stage</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="isRemote" checked={form.isRemote} onChange={(e) => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4" />
                    <label htmlFor="isRemote" className="text-[10px] font-black uppercase tracking-widest text-slate-700">Remote / hybride mogelijk</label>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Beschrijving</Label>
                    <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={5} placeholder="Wat houdt de functie in? Wie zoek je?" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm leading-relaxed" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Vereisten</Label>
                    <textarea value={form.requirements} onChange={(e) => setForm(f => ({ ...f, requirements: e.target.value }))} rows={4} placeholder="Welke ervaring, opleiding, vaardigheden zijn nodig?" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm leading-relaxed" />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <Label>Salaris min (optioneel)</Label>
                      <input type="number" value={form.salaryMin} onChange={(e) => setForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="3000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                    </div>
                    <div>
                      <Label>Salaris max (optioneel)</Label>
                      <input type="number" value={form.salaryMax} onChange={(e) => setForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="5000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                    </div>
                    <div>
                      <Label>Valuta</Label>
                      <select value={form.salaryCurrency} onChange={(e) => setForm(f => ({ ...f, salaryCurrency: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                        <option value="SRD">SRD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <Label>Periode</Label>
                      <select value={form.salaryPeriod} onChange={(e) => setForm(f => ({ ...f, salaryPeriod: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                        <option value="month">Per maand</option>
                        <option value="year">Per jaar</option>
                        <option value="hour">Per uur</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                    {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Plaatsen...</> : <><Plus className="w-3 h-3" /> Vacature Plaatsen</>}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white">
                    Annuleren
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
        ) : vacancies.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-slate-200 p-16 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">Nog geen vacatures</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic mb-6">
              Plaats je eerste vacature en bereik kandidaten direct.
            </p>
            <button onClick={() => setShowCreate(true)} className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Plus className="w-3 h-3" /> Eerste Vacature Plaatsen
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {vacancies.map(v => (
              <VacancyRow key={v._id} v={v} onDelete={() => deleteVacancy(v._id)} busy={busy} />
            ))}
          </div>
        )}

        <div className="text-center pt-8 border-t-2 border-slate-100">
          <Link href="/" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">
            ← Terug naar home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">{children}</label>;
}

function VacancyRow({ v, onDelete, busy }: { v: Vacancy; onDelete: () => void; busy: boolean }) {
  const formatSalary = () => {
    const s = v.salary;
    if (!s || (!s.min && !s.max)) return null;
    const cur = s.currency || 'SRD';
    if (s.min && s.max) return `${cur} ${s.min.toLocaleString()}-${s.max.toLocaleString()}`;
    if (s.min) return `${cur} ${s.min.toLocaleString()}+`;
    return `${cur} tot ${s.max!.toLocaleString()}`;
  };
  const salary = formatSalary();
  const created = new Date(v.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white border-2 border-slate-100 hover:border-blue-600 p-6 transition-all group flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Actief
          <span className="text-slate-300">·</span>
          <Calendar className="w-3 h-3" /> {created}
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-blue-600 transition-colors">{v.title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {v.company && (
            <span className="flex items-center gap-2"><Building2 className="w-3 h-3 text-blue-600" /> {v.company}</span>
          )}
          {v.location && (
            <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-600" /> {v.location}</span>
          )}
          {salary && (
            <span className="flex items-center gap-2 text-black"><DollarSign className="w-3 h-3 text-emerald-600" /> {salary}</span>
          )}
          {v.employmentType && <span className="text-blue-600">{v.employmentType}</span>}
          {v.isRemote && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 italic">Remote</span>}
        </div>
        {v.description && (
          <p className="text-sm font-bold text-slate-600 mt-3 line-clamp-2">{v.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        disabled={busy}
        className="text-red-600 hover:bg-red-50 p-3 disabled:opacity-50 shrink-0 transition-colors"
        aria-label="Vacature verwijderen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
