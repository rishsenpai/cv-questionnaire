'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  LogOut,
  Users,
  FileText,
  Briefcase,
  Database,
  Settings,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Upload,
  Sparkles,
  Plus,
  X,
  Globe,
  Cpu,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

type Tab = 'overview' | 'cvs' | 'vacancies' | 'employers' | 'system';

const TABS: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: 'overview', label: 'Overview', icon: Database },
  { id: 'cvs', label: 'CVs', icon: FileText },
  { id: 'vacancies', label: 'Vacatures', icon: Briefcase },
  { id: 'employers', label: 'Werkgevers', icon: Users },
  { id: 'system', label: 'Systeem', icon: Settings },
];

export default function AdminPage() {
  const { adminToken, loginAdmin, logoutAdmin, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!adminToken) {
    return <AdminLogin onLogin={loginAdmin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdminHero onLogout={logoutAdmin} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] flex flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors border-r-2 border-slate-100 last:border-r-0',
                tab === t.id ? 'bg-black text-white' : 'hover:bg-slate-50',
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {tab === 'overview' && <OverviewTab token={adminToken} />}
        {tab === 'cvs' && <CvsTab token={adminToken} />}
        {tab === 'vacancies' && <VacanciesTab token={adminToken} />}
        {tab === 'employers' && <EmployersTab token={adminToken} />}
        {tab === 'system' && <SystemTab token={adminToken} />}
      </main>
    </div>
  );
}

function AdminHero({ onLogout }: { onLogout: () => void }) {
  return (
    <section className="bg-black text-white py-16 border-b-8 border-blue-600 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-end justify-between flex-wrap gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
            <Lock className="w-3 h-3" /> Admin Console
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
            Beheer<span className="text-blue-600 italic">.</span>
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="bg-white/5 border-2 border-white/20 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3"
        >
          <LogOut className="w-3 h-3" /> Uitloggen
        </button>
      </div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}

function AdminLogin({ onLogin }: { onLogin: (pw: string) => Promise<{ ok: true } | { ok: false; message: string }> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onLogin(password);
    setLoading(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black mx-auto flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Admin Login</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toegang alleen voor beheerders</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="WACHTWOORD"
              required
              className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white"
            />
          </div>
          {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Inloggen <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================ OVERVIEW ============================

interface OverviewStats {
  totalCvs: number;
  cvWithEmbedding: number;
  cvEmbeddingPct: number;
  totalVacancies: number;
  adzunaVacancies: number;
  internalVacancies: number;
  vacWithEmbedding: number;
}

function OverviewTab({ token }: { token: string }) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/admin/embedding-status', { headers: { 'x-admin-token': token } }).then(r => r.json()),
      fetch('/api/admin/vacancy-stats', { headers: { 'x-admin-token': token } }).then(r => r.json()),
    ]).then(([embStatus, vacStats]) => {
      if (cancelled) return;
      setStats({
        totalCvs: embStatus.total || 0,
        cvWithEmbedding: embStatus.withEmbedding || 0,
        cvEmbeddingPct: embStatus.percentage || 0,
        totalVacancies: vacStats.stats?.total || 0,
        adzunaVacancies: vacStats.stats?.adzuna || 0,
        internalVacancies: vacStats.stats?.internal || 0,
        vacWithEmbedding: vacStats.stats?.withEmbeddings || 0,
      });
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  if (loading || !stats) {
    return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Overzicht" subtitle="Realtime statistieken van platform-data" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="Totaal CVs" value={stats.totalCvs} accent="blue" />
        <StatCard icon={Sparkles} label="Met Embedding" value={`${stats.cvEmbeddingPct}%`} sublabel={`${stats.cvWithEmbedding}/${stats.totalCvs}`} accent="emerald" />
        <StatCard icon={Briefcase} label="Vacatures" value={stats.totalVacancies} sublabel={`${stats.internalVacancies} intern · ${stats.adzunaVacancies} Adzuna`} accent="black" />
        <StatCard icon={Cpu} label="Vacatures met embedding" value={stats.vacWithEmbedding} accent="blue" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: 'blue' | 'emerald' | 'black';
}) {
  const accentClass = {
    blue: 'border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.15)]',
    emerald: 'border-emerald-600 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.15)]',
    black: 'border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]',
  }[accent];
  const iconClass = {
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    black: 'bg-black text-blue-400',
  }[accent];

  return (
    <div className={cn('bg-white border-2 p-6', accentClass)}>
      <div className={cn('w-12 h-12 flex items-center justify-center mb-4', iconClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className="text-4xl font-black tracking-tighter italic mb-1">{value}</p>
      {sublabel && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{sublabel}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-slate-100 flex-wrap">
      <div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
        {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================ CVS ============================

interface CvRow {
  _id: string;
  fullName: string;
  email?: string;
  jobTitle?: string;
  location?: string;
  fileName?: string;
  isInternal?: boolean;
  createdAt: string;
}

function CvsTab({ token }: { token: string }) {
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cvs', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setCvs(data.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = cvs.filter(cv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return cv.fullName.toLowerCase().includes(q) ||
      (cv.email || '').toLowerCase().includes(q) ||
      (cv.jobTitle || '').toLowerCase().includes(q);
  });

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c._id)));
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} CV('s) verwijderen?`)) return;
    setBusy(true);
    try {
      await fetch('/api/cvs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteOne = async (id: string) => {
    if (!confirm('CV verwijderen?')) return;
    setBusy(true);
    try {
      await fetch(`/api/cvs/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="CVs"
        subtitle={`${cvs.length} totaal · ${filtered.length} getoond`}
        action={
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button
                onClick={bulkDelete}
                disabled={busy}
                className="bg-red-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Verwijder {selected.size}
              </button>
            )}
            <button
              onClick={reload}
              disabled={loading}
              className="border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, email, functie..."
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="p-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Naam</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Functie</th>
                <th className="p-3 text-left">Locatie</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-right w-32">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Geen CVs gevonden.</td></tr>
              )}
              {filtered.map(cv => (
                <tr key={cv._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(cv._id)}
                      onChange={() => toggleSelect(cv._id)}
                    />
                  </td>
                  <td className="p-3 truncate max-w-[200px]">{cv.fullName}</td>
                  <td className="p-3 truncate max-w-[200px] text-slate-500">{cv.email || '—'}</td>
                  <td className="p-3 truncate max-w-[200px] text-slate-500">{cv.jobTitle || '—'}</td>
                  <td className="p-3 truncate max-w-[150px] text-slate-500">{cv.location || '—'}</td>
                  <td className="p-3">
                    {cv.isInternal ? (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5">Intern</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5">Extern</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => deleteOne(cv._id)}
                      disabled={busy}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================ VACANCIES ============================

interface VacancyRow {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  source?: string;
  createdAt: string;
}

function VacanciesTab({ token }: { token: string }) {
  const [vacancies, setVacancies] = useState<VacancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importQuery, setImportQuery] = useState('developer');
  const [importLocation, setImportLocation] = useState('');
  const [importPages, setImportPages] = useState(1);
  const [busy, setBusy] = useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vacancies?limit=100', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setVacancies(data.vacancies);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const runImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/import-vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ query: importQuery, location: importLocation, pages: importPages }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(`✓ ${data.stats.imported} geïmporteerd, ${data.stats.skipped} overgeslagen, ${data.stats.errors} fouten`);
        await reload();
      } else {
        setImportResult(`✗ ${data.message}`);
      }
    } catch {
      setImportResult('✗ Verbinding mislukt');
    } finally {
      setImporting(false);
    }
  };

  const deleteVacancy = async (id: string) => {
    if (!confirm('Vacature verwijderen?')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/vacancies/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
      await reload();
    } finally { setBusy(false); }
  };

  const deleteAllAdzuna = async () => {
    if (!confirm('ALLE Adzuna-vacatures verwijderen?')) return;
    setBusy(true);
    try {
      await fetch('/api/admin/vacancies/external/all', { method: 'DELETE', headers: { 'x-admin-token': token } });
      await reload();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Vacatures"
        subtitle={`${vacancies.length} actieve vacatures`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
              <Globe className="w-3 h-3" /> Adzuna Import
            </button>
            <button onClick={deleteAllAdzuna} disabled={busy} className="border-2 border-red-600 text-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors">
              Verwijder Adzuna
            </button>
          </div>
        }
      />

      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-blue-600 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Vacatures importeren</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adzuna API · max 50 per pagina</p>
                </div>
                <button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Zoekterm</label>
                  <input value={importQuery} onChange={(e) => setImportQuery(e.target.value)} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Locatie (optioneel)</label>
                  <input value={importLocation} onChange={(e) => setImportLocation(e.target.value)} placeholder="Amsterdam" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Pagina&apos;s (1-10)</label>
                  <input type="number" min={1} max={10} value={importPages} onChange={(e) => setImportPages(Number(e.target.value))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <button onClick={runImport} disabled={importing} className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
                  {importing ? <><Loader2 className="w-3 h-3 animate-spin" />Importeren...</> : <><Upload className="w-3 h-3" />Start Import</>}
                </button>
                {importResult && <p className="text-[11px] font-bold flex-1">{importResult}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="p-3 text-left">Functie</th>
                <th className="p-3 text-left">Bedrijf</th>
                <th className="p-3 text-left">Locatie</th>
                <th className="p-3 text-left">Bron</th>
                <th className="p-3 text-right w-24">Acties</th>
              </tr>
            </thead>
            <tbody>
              {vacancies.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Geen vacatures.</td></tr>
              )}
              {vacancies.map(v => (
                <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
                  <td className="p-3 truncate max-w-[300px]">{v.title}</td>
                  <td className="p-3 truncate max-w-[200px] text-slate-500">{v.company || '—'}</td>
                  <td className="p-3 truncate max-w-[150px] text-slate-500">{v.location || '—'}</td>
                  <td className="p-3">
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-widest px-2 py-0.5',
                      v.source === 'adzuna' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600',
                    )}>
                      {v.source || 'internal'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => deleteVacancy(v._id)} disabled={busy} className="text-red-600 hover:text-red-800 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================ EMPLOYERS ============================

interface EmployerRow {
  _id: string;
  username: string;
  companyName: string;
  contactEmail?: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

function EmployersTab({ token }: { token: string }) {
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', companyName: '', contactEmail: '', plan: 'basic' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employers', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setEmployers(data.data);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!data.success) {
        setCreateError(data.message);
        return;
      }
      setShowCreate(false);
      setCreateForm({ username: '', password: '', companyName: '', contactEmail: '', plan: 'basic' });
      await reload();
    } finally { setBusy(false); }
  };

  const deleteEmployer = async (id: string) => {
    if (!confirm('Werkgever verwijderen?')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/employers/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
      await reload();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Werkgevers"
        subtitle={`${employers.length} accounts`}
        action={
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2">
            <Plus className="w-3 h-3" /> Nieuwe Werkgever
          </button>
        }
      />

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={submitCreate} className="bg-white border-2 border-blue-600 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Nieuwe Werkgever</h3>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input required placeholder="Username" value={createForm.username} onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))} className="p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                <input required type="password" placeholder="Wachtwoord (8+, letter & cijfer)" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} className="p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                <input required placeholder="Bedrijfsnaam" value={createForm.companyName} onChange={(e) => setCreateForm(f => ({ ...f, companyName: e.target.value }))} className="p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                <input type="email" placeholder="Contact email (optioneel)" value={createForm.contactEmail} onChange={(e) => setCreateForm(f => ({ ...f, contactEmail: e.target.value }))} className="p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                <select value={createForm.plan} onChange={(e) => setCreateForm(f => ({ ...f, plan: e.target.value }))} className="p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                  <option value="basic">Basic</option>
                  <option value="advanced">Advanced</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              {createError && <p className="text-[11px] font-bold text-red-600">{createError}</p>}
              <button type="submit" disabled={busy} className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Aanmaken
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Bedrijf</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Plan</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right w-24">Acties</th>
              </tr>
            </thead>
            <tbody>
              {employers.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Geen werkgevers.</td></tr>}
              {employers.map(e => (
                <tr key={e._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
                  <td className="p-3">{e.username}</td>
                  <td className="p-3 truncate max-w-[200px]">{e.companyName}</td>
                  <td className="p-3 truncate max-w-[200px] text-slate-500">{e.contactEmail || '—'}</td>
                  <td className="p-3"><span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5">{e.plan}</span></td>
                  <td className="p-3">
                    {e.isActive
                      ? <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5">Active</span>
                      : <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5">Inactive</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => deleteEmployer(e._id)} disabled={busy} className="text-red-600 hover:text-red-800 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================ SYSTEM ============================

interface EmbeddingProgress {
  active: boolean;
  current: number;
  total: number;
  currentName: string;
  failed: number;
  percentage: number;
}

function SystemTab({ token }: { token: string }) {
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProgress = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/embedding-progress', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setProgress(data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchProgress();
    const id = setInterval(fetchProgress, 3000);
    return () => clearInterval(id);
  }, [fetchProgress]);

  const startEmbedding = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/generate-embeddings', { method: 'POST', headers: { 'x-admin-token': token } });
      const data = await res.json();
      setMessage(data.message);
      if (data.success) await fetchProgress();
    } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Systeem" subtitle="Embedding generatie & sync status" />

      <div className="bg-white border-2 border-black p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-black flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Embedding Generatie</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CV&apos;s zonder embedding krijgen er een via OpenAI</p>
          </div>
        </div>

        {progress && progress.total > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>{progress.active ? 'Bezig' : 'Klaar'}: {progress.current}/{progress.total}</span>
              <span className="text-blue-600">{progress.percentage}%</span>
            </div>
            <div className="h-2 bg-slate-100">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress.percentage}%` }} />
            </div>
            {progress.active && progress.currentName && (
              <p className="text-[10px] font-bold text-slate-400 italic">Verwerkt: {progress.currentName}</p>
            )}
            {progress.failed > 0 && (
              <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">{progress.failed} mislukt</p>
            )}
          </div>
        )}

        <button
          onClick={startEmbedding}
          disabled={generating || progress?.active}
          className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> Starten...</> : <><Cpu className="w-3 h-3" /> Start Embedding</>}
        </button>

        {message && <p className="mt-4 text-[11px] font-bold">{message}</p>}
      </div>
    </div>
  );
}
