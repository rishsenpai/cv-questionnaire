'use client';

import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
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
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

type Tab = 'overview' | 'cvs' | 'vacancies' | 'matching' | 'employers' | 'system';

const TABS: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: 'overview', label: 'Overview', icon: Database },
  { id: 'cvs', label: 'CVs', icon: FileText },
  { id: 'vacancies', label: 'Vacatures', icon: Briefcase },
  { id: 'matching', label: 'Matching', icon: Target },
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
        {tab === 'matching' && <MatchingTab token={adminToken} />}
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
  jsearchVacancies: number;
  employerVacancies: number;
  internalVacancies: number;
  vacWithEmbedding: number;
  employerLast7d: number;
  openSuggestions: number;
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
        jsearchVacancies: vacStats.stats?.jsearch || 0,
        employerVacancies: vacStats.stats?.employer || 0,
        internalVacancies: vacStats.stats?.internal || 0,
        vacWithEmbedding: vacStats.stats?.withEmbeddings || 0,
        employerLast7d: vacStats.stats?.employerLast7d || 0,
        openSuggestions: vacStats.stats?.openSuggestions || 0,
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
        <StatCard icon={Sparkles} label="CV's met Embedding" value={`${stats.cvEmbeddingPct}%`} sublabel={`${stats.cvWithEmbedding}/${stats.totalCvs}`} accent="emerald" />
        <StatCard icon={Briefcase} label="Vacatures" value={stats.totalVacancies} sublabel={`${stats.employerVacancies} werkgever · ${stats.internalVacancies} intern · ${stats.adzunaVacancies} Adzuna · ${stats.jsearchVacancies} JSearch`} accent="black" />
        <StatCard icon={Cpu} label="Vacatures met embedding" value={stats.vacWithEmbedding} accent="blue" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          icon={Briefcase}
          label="Werkgever-uploads (7d)"
          value={stats.employerLast7d}
          sublabel="Nieuwe vacatures geplaatst door werkgevers, laatste 7 dagen"
          accent="emerald"
        />
        <StatCard
          icon={Target}
          label="Open AI-suggesties"
          value={stats.openSuggestions}
          sublabel="Wachtend op admin-review (Matching tab → push)"
          accent={stats.openSuggestions > 0 ? 'blue' : 'black'}
        />
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
  country?: 'guyana' | 'netherlands' | 'suriname';
  createdAt: string;
}

function CvsTab({ token }: { token: string }) {
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [matchCv, setMatchCv] = useState<CvRow | null>(null);

  const LIMIT = 50;

  // Debounce de zoekterm zodat we niet bij elke keystroke een DB-call doen.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`/api/cvs?${qs}`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) {
        setCvs(data.data);
        setTotal(data.total || 0);
        setPages(data.pages || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Server-side gefilterd: 'filtered' = 'cvs'.
  const filtered = cvs;

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
        subtitle={`${total} totaal${debouncedSearch ? ` (gefilterd op "${debouncedSearch}")` : ''} · pagina ${page}/${Math.max(1, pages)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBulkUpload(s => !s)}
              className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
            >
              <Upload className="w-3 h-3" /> Bulk Upload
            </button>
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

      <AnimatePresence>
        {showBulkUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <BulkUploadPanel token={token} onClose={() => setShowBulkUpload(false)} onComplete={reload} />
          </motion.div>
        )}
      </AnimatePresence>

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
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setMatchCv(cv)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Match"
                        title="Match met vacatures"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteOne(cv._id)}
                        disabled={busy}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        aria-label="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Vorige
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Pagina {page} van {pages} · {total} CVs
          </span>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            className="border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Volgende →
          </button>
        </div>
      )}

      <AnimatePresence>
        {matchCv && (
          <CvMatchModal token={token} cv={matchCv} onClose={() => setMatchCv(null)} />
        )}
      </AnimatePresence>
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
  employerId?: string;
  country?: 'guyana' | 'netherlands' | 'suriname';
  createdAt: string;
  suggestionCount?: number;
  pushedCount?: number;
}

const SOURCE_BADGE: Record<string, string> = {
  employer: 'bg-blue-50 text-blue-700 border border-blue-200',
  adzuna: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  jsearch: 'bg-purple-50 text-purple-700 border border-purple-200',
  internal: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const SOURCE_LABEL: Record<string, string> = {
  employer: 'Werkgever',
  adzuna: 'Adzuna',
  jsearch: 'JSearch',
  internal: 'Admin',
};

const JSEARCH_PRESETS_SR = 'manager, engineer, officer, consultant, sales, developer, accountant, supervisor, coordinator, analyst';

function VacanciesTab({ token }: { token: string }) {
  const [vacancies, setVacancies] = useState<VacancyRow[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'employer' | 'adzuna' | 'jsearch' | 'internal'>('all');
  const [suggestionsFor, setSuggestionsFor] = useState<VacancyRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importQuery, setImportQuery] = useState('developer');
  const [importLocation, setImportLocation] = useState('');
  const [importPages, setImportPages] = useState(1);
  const [showJSearch, setShowJSearch] = useState(false);
  const [jsImporting, setJsImporting] = useState(false);
  const [jsResult, setJsResult] = useState<string | null>(null);
  const [jsQueries, setJsQueries] = useState(JSEARCH_PRESETS_SR);
  const [jsLocation, setJsLocation] = useState('Suriname');
  const [showBulkVacancy, setShowBulkVacancy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', company: '', location: 'Paramaribo', description: '', requirements: '',
    employmentType: 'Full-time', isRemote: false,
    salaryMin: '', salaryMax: '', salaryCurrency: 'SRD', salaryPeriod: 'month',
    employerId: '',
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [embeddingBatch, setEmbeddingBatch] = useState(false);
  const [matchCountry, setMatchCountry] = useState<'' | 'guyana' | 'netherlands' | 'suriname'>('');
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [vacancyEmbedProgress, setVacancyEmbedProgress] = useState<{
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    percentage: number;
  } | null>(null);
  const [matchAllProgress, setMatchAllProgress] = useState<{
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    suggestionsTotal: number;
    percentage: number;
  } | null>(null);
  const [matchBatch, setMatchBatch] = useState(false);
  const [createParsing, setCreateParsing] = useState(false);
  const [createParsedFrom, setCreateParsedFrom] = useState<string | null>(null);
  const [createDragOver, setCreateDragOver] = useState(false);
  const [employerOptions, setEmployerOptions] = useState<Array<{ _id: string; companyName: string; username: string }>>([]);
  const createFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showCreate) return;
    fetch('/api/admin/employers', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(data => { if (data.success) setEmployerOptions(data.data); })
      .catch(() => { /* ignore */ });
  }, [showCreate, token]);

  const handleCreateFile = async (file: File) => {
    if (file.size > 4.5 * 1024 * 1024) {
      setCreateError('Bestand is groter dan 4.5 MB');
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setCreateError('Alleen PDF of Word (.docx)');
      return;
    }
    setCreateError(null);
    setCreateParsing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(((r.result as string).split(',')[1] || ''));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/parse-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.message || 'AI-analyse mislukt');
        return;
      }
      setCreateForm(f => ({
        ...f,
        title: data.data.title || f.title,
        location: data.data.location || f.location,
        description: data.data.requirements || f.description,
      }));
      setCreateParsedFrom(file.name);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Verbinding mislukt');
    } finally {
      setCreateParsing(false);
    }
  };

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

  const fetchVacancyEmbedProgress = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/embedding-progress/vacancy', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setVacancyEmbedProgress(data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchVacancyEmbedProgress();
    const id = setInterval(fetchVacancyEmbedProgress, 3000);
    return () => clearInterval(id);
  }, [fetchVacancyEmbedProgress]);

  const fetchMatchAllProgress = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/match-progress', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setMatchAllProgress(data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchMatchAllProgress();
    const id = setInterval(fetchMatchAllProgress, 3000);
    return () => clearInterval(id);
  }, [fetchMatchAllProgress]);

  useEffect(() => {
    if (matchAllProgress && !matchAllProgress.active && matchAllProgress.total > 0 && matchAllProgress.current === matchAllProgress.total) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchAllProgress?.active, matchAllProgress?.current, matchAllProgress?.total]);

  const runMatchAll = async () => {
    const countryLabel = matchCountry === 'guyana' ? 'Guyana'
      : matchCountry === 'netherlands' ? 'Nederland'
      : matchCountry === 'suriname' ? 'Suriname'
      : 'alle landen';
    if (!confirm(`Match-batch starten voor ${countryLabel}? Dit kan een paar minuten duren.`)) return;
    setMatchBatch(true);
    try {
      const qs = matchCountry ? `?country=${matchCountry}` : '';
      const res = await fetch(`/api/admin/match-all-vacancies${qs}`, { method: 'POST', headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Match-batch starten mislukt');
      else await fetchMatchAllProgress();
    } finally {
      setMatchBatch(false);
    }
  };

  const runBackfillCountry = async () => {
    setBackfillBusy(true);
    try {
      const res = await fetch('/api/admin/backfill-country', { method: 'POST', headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) {
        alert(`Land-backfill klaar:\nCV's: ${data.cvs.updated}/${data.cvs.scanned} bijgewerkt\nVacatures: ${data.vacancies.updated}/${data.vacancies.scanned} bijgewerkt`);
      } else {
        alert(data.message || 'Backfill mislukt');
      }
    } finally {
      setBackfillBusy(false);
    }
  };

  useEffect(() => {
    // Wanneer batch zojuist klaar is, lijst opnieuw laden zodat 'embedding'-status klopt.
    if (vacancyEmbedProgress && !vacancyEmbedProgress.active && vacancyEmbedProgress.total > 0 && vacancyEmbedProgress.current === vacancyEmbedProgress.total) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacancyEmbedProgress?.active, vacancyEmbedProgress?.current, vacancyEmbedProgress?.total]);

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
        setImportResult(`✓ ${data.stats.imported} nieuw, ${data.stats.reactivated || 0} gereactiveerd, ${data.stats.skipped} overgeslagen, ${data.stats.errors} fouten`);
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

  const [matchingId, setMatchingId] = useState<string | null>(null);
  const runMatch = async (v: VacancyRow) => {
    setMatchingId(v._id);
    try {
      const res = await fetch(`/api/admin/vacancies/${v._id}/run-match`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Run-match mislukt');
        return;
      }
      const r = data.result || {};
      alert(`Klaar: ${r.suggestionsCreated || 0} suggesties opgeslagen (${r.candidatesScanned || 0} CVs gescand, methode: ${r.method}).`);
      await reload();
    } finally {
      setMatchingId(null);
    }
  };

  const deleteAllAdzuna = async () => {
    if (!confirm('ALLE Adzuna-vacatures verwijderen?')) return;
    setBusy(true);
    try {
      await fetch('/api/admin/vacancies/external/all', { method: 'DELETE', headers: { 'x-admin-token': token } });
      await reload();
    } finally { setBusy(false); }
  };

  const generateVacancyEmbeddings = async () => {
    if (!confirm('Embedding-generatie starten voor alle vacatures zonder embedding? Loopt op de achtergrond.')) return;
    setEmbeddingBatch(true);
    try {
      const res = await fetch('/api/admin/generate-vacancy-embeddings', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Genereren mislukt');
      } else if ((data.processing ?? data.total ?? 0) === 0) {
        // Niks te doen — alle vacatures hebben al een embedding.
        alert(data.message || 'Alle vacatures hebben al een embedding. Niets te doen.');
      } else {
        // Direct progress ophalen zodat de balk meteen verschijnt.
        await fetchVacancyEmbedProgress();
      }
    } finally {
      setEmbeddingBatch(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);
    try {
      const res = await fetch('/api/admin/vacancies', {
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
      setCreateForm({
        title: '', company: '', location: 'Paramaribo', description: '', requirements: '',
        employmentType: 'Full-time', isRemote: false,
        salaryMin: '', salaryMax: '', salaryCurrency: 'SRD', salaryPeriod: 'month',
        employerId: '',
      });
      setCreateParsedFrom(null);
      await reload();
    } finally { setCreateBusy(false); }
  };

  const runJSearchImport = async () => {
    setJsImporting(true);
    setJsResult(null);
    try {
      const res = await fetch('/api/admin/import-jsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ queries: jsQueries, location: jsLocation }),
      });
      const data = await res.json();
      if (data.success) {
        setJsResult(`✓ ${data.stats.imported} geïmporteerd · ${data.stats.skipped} duplicaat · ${data.stats.errors} fouten · ${data.stats.queriesUsed} queries`);
        await reload();
      } else {
        setJsResult(`✗ ${data.message}`);
      }
    } catch {
      setJsResult('✗ Verbinding mislukt');
    } finally {
      setJsImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Vacatures"
        subtitle={`${vacancies.length} actieve vacatures`}
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate(s => !s)} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2">
              <Plus className="w-3 h-3" /> Nieuwe Vacature
            </button>
            <button onClick={() => setShowBulkVacancy(s => !s)} className="bg-purple-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
              <Upload className="w-3 h-3" /> Bulk Upload
            </button>
            <button onClick={() => setShowJSearch(s => !s)} className="bg-emerald-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
              <Globe className="w-3 h-3" /> JSearch (SR)
            </button>
            <button onClick={() => setShowImport(s => !s)} className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
              <Globe className="w-3 h-3" /> Adzuna (NL)
            </button>
            <button
              onClick={generateVacancyEmbeddings}
              disabled={busy || embeddingBatch || (vacancyEmbedProgress?.active === true && vacancyEmbedProgress.current > 0)}
              className="bg-amber-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {embeddingBatch || vacancyEmbedProgress?.active ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {vacancyEmbedProgress?.active && vacancyEmbedProgress.current > 0
                ? `Bezig: ${vacancyEmbedProgress.current}/${vacancyEmbedProgress.total}`
                : 'Genereer embeddings'}
            </button>
            <div className="flex items-stretch">
              <select
                value={matchCountry}
                onChange={(e) => setMatchCountry(e.target.value as typeof matchCountry)}
                disabled={busy || matchBatch || matchAllProgress?.active}
                className="bg-fuchsia-50 border-2 border-fuchsia-600 border-r-0 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-700 outline-none disabled:opacity-50"
                title="Beperk de match tot één land — match alleen CV's tegen vacatures uit hetzelfde land"
              >
                <option value="">Alle landen</option>
                <option value="guyana">Guyana</option>
                <option value="netherlands">Nederland</option>
                <option value="suriname">Suriname</option>
              </select>
              <button
                onClick={runMatchAll}
                disabled={busy || matchBatch}
                title={matchAllProgress?.active ? 'Klik om huidige batch te herstarten' : undefined}
                className="bg-fuchsia-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {matchBatch || matchAllProgress?.active ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {matchAllProgress?.active && matchAllProgress.current > 0
                  ? `Matchen: ${matchAllProgress.current}/${matchAllProgress.total}`
                  : 'Match alle'}
              </button>
            </div>
            <button
              onClick={runBackfillCountry}
              disabled={busy || backfillBusy}
              title="Eenmalig: vul country in op CV's en vacatures op basis van location-tekst"
              className="border-2 border-slate-400 text-slate-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {backfillBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Backfill land
            </button>
            <button onClick={deleteAllAdzuna} disabled={busy} className="border-2 border-red-600 text-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors">
              Verwijder Adzuna
            </button>
          </div>
        }
      />

      {vacancyEmbedProgress && vacancyEmbedProgress.total > 0 && (
        <div className="bg-amber-50 border-2 border-amber-500 p-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2">
              {vacancyEmbedProgress.active
                ? <><Loader2 className="w-3 h-3 animate-spin text-amber-700" /> Embeddings worden gegenereerd</>
                : <><Sparkles className="w-3 h-3 text-amber-700" /> Embeddings klaar</>}
              <span className="text-slate-500 normal-case tracking-normal">— {vacancyEmbedProgress.current}/{vacancyEmbedProgress.total}</span>
            </span>
            <span className="text-amber-700">{vacancyEmbedProgress.percentage}%</span>
          </div>
          <div className="h-2 bg-amber-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${vacancyEmbedProgress.percentage}%` }} />
          </div>
          {vacancyEmbedProgress.active && vacancyEmbedProgress.currentTitle && (
            <p className="text-[10px] font-bold text-amber-800 italic truncate">Verwerkt: {vacancyEmbedProgress.currentTitle}</p>
          )}
          {vacancyEmbedProgress.failed > 0 && (
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{vacancyEmbedProgress.failed} mislukt</p>
          )}
        </div>
      )}

      {matchAllProgress && matchAllProgress.total > 0 && (
        <div className="bg-fuchsia-50 border-2 border-fuchsia-600 p-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2">
              {matchAllProgress.active
                ? <><Loader2 className="w-3 h-3 animate-spin text-fuchsia-700" /> Matching loopt</>
                : <><Sparkles className="w-3 h-3 text-fuchsia-700" /> Matching klaar</>}
              <span className="text-slate-500 normal-case tracking-normal">— {matchAllProgress.current}/{matchAllProgress.total} vacatures · {matchAllProgress.suggestionsTotal} suggesties</span>
            </span>
            <span className="text-fuchsia-700">{matchAllProgress.percentage}%</span>
          </div>
          <div className="h-2 bg-fuchsia-100">
            <div className="h-full bg-fuchsia-600 transition-all" style={{ width: `${matchAllProgress.percentage}%` }} />
          </div>
          {matchAllProgress.active && matchAllProgress.currentTitle && (
            <p className="text-[10px] font-bold text-fuchsia-800 italic truncate">Verwerkt: {matchAllProgress.currentTitle}</p>
          )}
          {matchAllProgress.failed > 0 && (
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{matchAllProgress.failed} mislukt</p>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={submitCreate} className="bg-white border-2 border-black p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Nieuwe Vacature</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handmatig of namens werkgever — drag PDF/Word voor AI auto-fill</p>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>

              {/* Werkgever-koppeling */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                  Plaats namens werkgever (optioneel)
                </label>
                <select
                  value={createForm.employerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const emp = employerOptions.find(o => o._id === id);
                    setCreateForm(f => ({
                      ...f,
                      employerId: id,
                      company: emp?.companyName || f.company,
                    }));
                  }}
                  className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm"
                >
                  <option value="">— Geen koppeling (admin-vacature) —</option>
                  {employerOptions.map(o => (
                    <option key={o._id} value={o._id}>{o.companyName} ({o.username})</option>
                  ))}
                </select>
                {createForm.employerId && (
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Auto-match draait na opslaan · suggesties verschijnen direct in deze tab
                  </p>
                )}
              </div>

              {/* AI auto-fill drop zone */}
              <input
                ref={createFileRef}
                type="file"
                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCreateFile(f);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <div
                onDragEnter={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); setCreateDragOver(true); } }}
                onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setCreateDragOver(true); } }}
                onDragLeave={(e) => { if (!(e.currentTarget as Node).contains(e.relatedTarget as Node | null)) setCreateDragOver(false); }}
                onDrop={(e) => { e.preventDefault(); setCreateDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleCreateFile(f); }}
                className={cn(
                  'border-2 border-dashed p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors',
                  createDragOver ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200',
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                    <Sparkles className="w-3 h-3" /> AI Auto-Fill
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {createDragOver ? 'Laat los om te uploaden' : 'Heb je een vacature in een Word- of PDF-bestand?'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 italic">
                    Sleep het hierheen of klik op &quot;Upload Bestand&quot;. Velden worden auto-ingevuld.
                  </p>
                  {createParsedFrom && (
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Ingevuld vanuit: {createParsedFrom}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => createFileRef.current?.click()}
                  disabled={createParsing}
                  className="bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {createParsing ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyseren...</> : <><Upload className="w-3 h-3" /> Upload Bestand</>}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Functietitel *</label>
                  <input required value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior Software Developer" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Bedrijf</label>
                  <input value={createForm.company} onChange={(e) => setCreateForm(f => ({ ...f, company: e.target.value }))} placeholder="Telesur N.V." className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Locatie</label>
                  <input value={createForm.location} onChange={(e) => setCreateForm(f => ({ ...f, location: e.target.value }))} placeholder="Paramaribo" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Type dienstverband</label>
                  <select value={createForm.employmentType} onChange={(e) => setCreateForm(f => ({ ...f, employmentType: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Tijdelijk</option>
                    <option value="Internship">Stage</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-7">
                  <input type="checkbox" id="isRemote" checked={createForm.isRemote} onChange={(e) => setCreateForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="isRemote" className="text-[10px] font-black uppercase tracking-widest text-slate-700">Remote / hybride mogelijk</label>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Beschrijving</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Wat houdt de functie in? Wie zoeken we?" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Vereisten</label>
                  <textarea value={createForm.requirements} onChange={(e) => setCreateForm(f => ({ ...f, requirements: e.target.value }))} rows={4} placeholder="Welke ervaring, opleiding, vaardigheden?" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>

                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Salaris min (optioneel)</label>
                    <input type="number" value={createForm.salaryMin} onChange={(e) => setCreateForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="3000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Salaris max (optioneel)</label>
                    <input type="number" value={createForm.salaryMax} onChange={(e) => setCreateForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="5000" className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Valuta</label>
                    <select value={createForm.salaryCurrency} onChange={(e) => setCreateForm(f => ({ ...f, salaryCurrency: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                      <option value="SRD">SRD</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Periode</label>
                    <select value={createForm.salaryPeriod} onChange={(e) => setCreateForm(f => ({ ...f, salaryPeriod: e.target.value }))} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm">
                      <option value="month">Per maand</option>
                      <option value="year">Per jaar</option>
                      <option value="hour">Per uur</option>
                    </select>
                  </div>
                </div>
              </div>

              {createError && <p className="text-[11px] font-bold text-red-600">{createError}</p>}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="submit" disabled={createBusy} className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
                  {createBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Vacature toevoegen
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white">
                  Annuleren
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {showJSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-emerald-600 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">JSearch import — Suriname</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per zoekterm ~10 vacatures · 200 free requests/maand</p>
                </div>
                <button onClick={() => setShowJSearch(false)} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Zoektermen (komma-gescheiden, max 20)</label>
                  <textarea value={jsQueries} onChange={(e) => setJsQueries(e.target.value)} rows={2} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                  <p className="text-[10px] font-bold text-slate-400 mt-2 italic">
                    Tip: elke zoekterm = 1 API-call. Begin klein (5 termen) om je rate-limit te sparen.
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Locatie</label>
                  <input value={jsLocation} onChange={(e) => setJsLocation(e.target.value)} className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm" />
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <button onClick={runJSearchImport} disabled={jsImporting} className="bg-emerald-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
                  {jsImporting ? <><Loader2 className="w-3 h-3 animate-spin" />Importeren...</> : <><Upload className="w-3 h-3" />Start JSearch Import</>}
                </button>
                {jsResult && <p className="text-[11px] font-bold flex-1">{jsResult}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {showBulkVacancy && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <BulkVacancyPanel
              token={token}
              onClose={() => setShowBulkVacancy(false)}
              onComplete={reload}
            />
          </motion.div>
        )}

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
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Adzuna import — Nederland</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adzuna API · max 50 per pagina · 250 free requests/dag</p>
                </div>
                <button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Zoekterm(en) — komma-gescheiden</label>
                  <input
                    value={importQuery}
                    onChange={(e) => setImportQuery(e.target.value)}
                    placeholder="bv. ANVA, polisadministratie, administratief medewerker verzekeringen"
                    className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm"
                  />
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

      <div className="flex flex-wrap gap-2">
        {(['all', 'employer', 'adzuna', 'jsearch', 'internal'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setSourceFilter(f)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-colors',
              sourceFilter === f
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-600 border-slate-200 hover:border-black',
            )}
          >
            {f === 'all' ? 'Alle' : SOURCE_LABEL[f] || f}
          </button>
        ))}
      </div>

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
                <th className="p-3 text-left">AI-suggesties</th>
                <th className="p-3 text-right w-24">Acties</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = sourceFilter === 'all'
                  ? vacancies
                  : sourceFilter === 'internal'
                    ? vacancies.filter(v => !v.source || v.source === 'internal')
                    : vacancies.filter(v => v.source === sourceFilter);
                if (filtered.length === 0) {
                  return <tr><td colSpan={6} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Geen vacatures.</td></tr>;
                }
                return filtered.flatMap(v => {
                  const src = v.source || 'internal';
                  const isExpanded = expandedId === v._id;
                  const rows = [
                    <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
                      <td className="p-3 truncate max-w-[300px]">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : v._id)}
                          className="inline-flex items-center gap-2 hover:text-blue-600 transition-colors text-left"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{v.title}</span>
                        </button>
                      </td>
                      <td className="p-3 truncate max-w-[200px] text-slate-500">{v.company || '—'}</td>
                      <td className="p-3 truncate max-w-[150px] text-slate-500">{v.location || '—'}</td>
                      <td className="p-3">
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-widest px-2 py-0.5',
                          SOURCE_BADGE[src] || SOURCE_BADGE.internal,
                        )}>
                          {SOURCE_LABEL[src] || src}
                        </span>
                      </td>
                      <td className="p-3">
                        {(v.suggestionCount ?? 0) > 0 || (v.pushedCount ?? 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : v._id)}
                            className={cn(
                              'px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-2',
                              (v.suggestionCount ?? 0) > 0
                                ? 'bg-blue-600 text-white hover:bg-black'
                                : 'bg-emerald-100 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-200',
                            )}
                          >
                            {(v.suggestionCount ?? 0) > 0 ? (
                              <><Sparkles className="w-3 h-3" /> {v.suggestionCount} open</>
                            ) : (
                              <><CheckCircle2 className="w-3 h-3" /> {v.pushedCount} gepushed</>
                            )}
                            {(v.suggestionCount ?? 0) > 0 && (v.pushedCount ?? 0) > 0 && (
                              <span className="text-emerald-200">· {v.pushedCount} gepushed</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => runMatch(v)}
                            disabled={matchingId === v._id || busy}
                            title="AI auto-match opnieuw draaien"
                            className="text-blue-600 hover:text-black disabled:opacity-50"
                          >
                            {matchingId === v._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          </button>
                          <button onClick={() => deleteVacancy(v._id)} disabled={busy} className="text-red-600 hover:text-red-800 disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>,
                  ];
                  if (isExpanded) {
                    rows.push(
                      <tr key={v._id + '-expand'} className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={6} className="p-0">
                          <InlineMatchesRow vacancyId={v._id} vacancyCountry={v.country} token={token} onChange={reload} />
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {suggestionsFor && (
          <SuggestionsModal
            vacancy={suggestionsFor}
            token={token}
            onClose={() => setSuggestionsFor(null)}
            onChange={reload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface SuggestionRow {
  _id: string;
  cvId: string;
  matchScore?: number;
  matchReason?: string;
  status?: string;
  contactRequestedAt?: string;
  contactSharedAt?: string;
  contactSharedNote?: string;
  promotedAt?: string;
  source: string;
  addedAt: string;
  cv: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    location?: string;
    skills?: string;
    experience?: string;
    education?: string;
    country?: 'guyana' | 'netherlands' | 'suriname';
  } | null;
}

function SuggestionsModal({
  vacancy, token, onClose, onChange,
}: {
  vacancy: VacancyRow; token: string; onClose: () => void; onChange: () => void;
}) {
  const [tab, setTab] = useState<'suggested' | 'contact-requested'>('suggested');
  const [items, setItems] = useState<SuggestionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setItems(null);
    const res = await fetch(`/api/admin/vacancies/${vacancy._id}/curated-matches?status=${tab}`, {
      headers: { 'x-admin-token': token },
    });
    const data = await res.json();
    if (data.success) setItems(data.matches);
  }, [vacancy._id, token, tab]);

  useEffect(() => { load(); }, [load]);

  const promote = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/curated-matches/${id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({}),
      });
      await load();
      onChange();
    } finally { setBusy(null); }
  };

  const reject = async (id: string) => {
    if (!confirm('Suggestie verwijderen?')) return;
    setBusy(id);
    try {
      await fetch(`/api/admin/curated-matches/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      await load();
      onChange();
    } finally { setBusy(null); }
  };

  const shareContact = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/curated-matches/${id}/share-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ note: shareNote[id] || '' }),
      });
      setShareNote(prev => ({ ...prev, [id]: '' }));
      await load();
      onChange();
    } finally { setBusy(null); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white border-4 border-black w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
      >
        <div className="bg-black text-white p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Curated matches</p>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">{vacancy.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="border-b-2 border-slate-200 flex">
          <button
            type="button"
            onClick={() => setTab('suggested')}
            className={cn(
              'flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
              tab === 'suggested' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            AI-suggesties
          </button>
          <button
            type="button"
            onClick={() => setTab('contact-requested')}
            className={cn(
              'flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
              tab === 'contact-requested' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            Contact aangevraagd
          </button>
        </div>
        <div className="p-6 space-y-3">
          {!items ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
          ) : items.length === 0 ? (
            <p className="text-center py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
              {tab === 'suggested' ? 'Geen open suggesties meer voor deze vacature.' : 'Geen openstaande contactaanvragen.'}
            </p>
          ) : (
            items.map(s => (
              <div key={s._id} className="border-2 border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{s.cv?.fullName || '—'}</p>
                    <p className="text-xs font-bold text-slate-500 truncate">{s.cv?.jobTitle || '—'} · {s.cv?.location || '—'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Bron: {s.source === 'auto-embedding' ? 'OpenAI semantic' : s.source}
                      {tab === 'contact-requested' && s.contactRequestedAt && (
                        <> · Aangevraagd op {new Date(s.contactRequestedAt).toLocaleDateString('nl-NL')}</>
                      )}
                    </p>
                  </div>
                  {s.matchScore !== undefined && (
                    <div className="text-right">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match</div>
                      <div className={cn(
                        'text-2xl font-black italic leading-none',
                        s.matchScore >= 70 ? 'text-blue-600' : s.matchScore >= 60 ? 'text-emerald-600' : 'text-slate-700',
                      )}>{s.matchScore}%</div>
                    </div>
                  )}
                  {tab === 'suggested' && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={busy === s._id}
                        onClick={() => promote(s._id)}
                        className="bg-blue-600 text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-1"
                      >
                        {busy === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        Push
                      </button>
                      <button
                        type="button"
                        disabled={busy === s._id}
                        onClick={() => reject(s._id)}
                        className="border-2 border-red-300 text-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50"
                      >
                        Negeer
                      </button>
                    </div>
                  )}
                </div>
                {tab === 'contact-requested' && (
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <textarea
                      value={shareNote[s._id] || ''}
                      onChange={e => setShareNote(prev => ({ ...prev, [s._id]: e.target.value }))}
                      placeholder="Optionele notitie voor de werkgever (bv. 'Kandidaat is op vakantie tot 24/5')…"
                      className="w-full border-2 border-slate-200 p-2 text-xs font-bold focus:border-blue-600 outline-none"
                      rows={2}
                    />
                    <button
                      type="button"
                      disabled={busy === s._id}
                      onClick={() => shareContact(s._id)}
                      className="bg-emerald-600 text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {busy === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Markeer contact gedeeld
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lichte heuristieken voor match-info — geen externe deps.
function yearsFromExperience(experience?: string): number | null {
  if (!experience) return null;
  const years = experience.match(/\b(19|20)\d{2}\b/g);
  if (!years || years.length < 2) return null;
  const nums = years.map(y => parseInt(y, 10)).sort((a, b) => a - b);
  const total = Math.min(new Date().getFullYear(), nums[nums.length - 1]) - nums[0];
  return total > 0 && total < 50 ? total : null;
}

function topSkills(skills?: string, limit = 4): string[] {
  if (!skills) return [];
  return skills.split(/[,;|\n]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 40).slice(0, limit);
}

function educationLevel(education?: string): string | null {
  if (!education) return null;
  const text = education.toLowerCase();
  if (/\b(phd|doctor|prof\.?|promotie)\b/.test(text)) return 'PhD';
  if (/\b(master|msc|ma\b|mba|wo[- ]?master)\b/.test(text)) return 'Master';
  if (/\b(bachelor|hbo|bsc|ba\b)\b/.test(text)) return 'HBO/Bachelor';
  if (/\bwo\b|universiteit/.test(text)) return 'WO';
  if (/\bmbo\b/.test(text)) return 'MBO';
  if (/\bhavo\b/.test(text)) return 'HAVO';
  if (/\bvwo\b/.test(text)) return 'VWO';
  if (/\bmavo\b/.test(text)) return 'MAVO';
  return null;
}

const COUNTRY_FLAG: Record<string, string> = { guyana: '🇬🇾', netherlands: '🇳🇱', suriname: '🇸🇷' };

function daysAgo(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return 'vandaag';
  if (days === 1) return '1 dag geleden';
  if (days < 30) return `${days} dagen geleden`;
  if (days < 365) return `${Math.floor(days / 30)} mnd geleden`;
  return `${Math.floor(days / 365)} jaar geleden`;
}

function formatSalary(s?: { min?: number; max?: number; currency?: string; period?: string }): string | null {
  if (!s || (!s.min && !s.max)) return null;
  const cur = s.currency || 'EUR';
  const fmt = (n?: number) => n ? n.toLocaleString('nl-NL') : '?';
  const range = s.min && s.max ? `${fmt(s.min)} – ${fmt(s.max)}` : `${fmt(s.min || s.max)}`;
  const period = s.period === 'month' ? '/mnd' : s.period === 'year' ? '/jr' : s.period === 'hour' ? '/u' : '';
  return `${cur} ${range}${period}`;
}

// Inline match-overzicht onder een vacancy-row in de Vacatures-tab.
// Toont top-10 AI-suggesties met Push/Negeer-knoppen — geen modal nodig.
function InlineMatchesRow({
  vacancyId, vacancyCountry, token, onChange,
}: {
  vacancyId: string; vacancyCountry?: 'guyana' | 'netherlands' | 'suriname'; token: string; onChange: () => void;
}) {
  const [items, setItems] = useState<SuggestionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [debug, setDebug] = useState<{
    cvsScanned: number;
    threshold: number;
    aboveThreshold: number;
    meanCosine: number;
    topRaw: Array<{ cvId: string; fullName: string; email: string; cosine: number; pct: number }>;
    existingMatches?: Record<string, number>;
  } | null>(null);
  const [debugBusy, setDebugBusy] = useState(false);
  // Default: vacancy's eigen land. Lege string = match tegen CVs uit alle landen
  // (handig voor remote-rollen of relocation-kandidaten).
  const [rematchCountry, setRematchCountry] = useState<'' | 'guyana' | 'netherlands' | 'suriname'>(vacancyCountry || '');
  const [rematchBusy, setRematchBusy] = useState(false);
  // Per-suggestie LLM-toelichting: id → reason. null = nog niet geladen.
  const [reasons, setReasons] = useState<Record<string, string | null>>({});
  const [reasonBusy, setReasonBusy] = useState<string | null>(null);

  const loadReason = async (matchId: string) => {
    setReasonBusy(matchId);
    try {
      const res = await fetch(`/api/admin/curated-matches/${matchId}/reason`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setReasons(prev => ({ ...prev, [matchId]: data.reason }));
      } else {
        setReasons(prev => ({ ...prev, [matchId]: data.message || 'Toelichting genereren mislukt' }));
      }
    } finally {
      setReasonBusy(null);
    }
  };

  const load = React.useCallback(async () => {
    setItems(null);
    const res = await fetch(`/api/admin/vacancies/${vacancyId}/curated-matches`, {
      headers: { 'x-admin-token': token },
    });
    const data = await res.json();
    if (!data.success) return;
    const all = data.matches as SuggestionRow[];
    // Suggested eerst (op score desc), daarna gepushte (op promotedAt/addedAt desc).
    // Toon top 10 suggested + alle pushed zodat gepushte kandidaten zichtbaar blijven.
    const suggested = all
      .filter(m => m.status === 'suggested')
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 10);
    const pushed = all
      .filter(m => m.status !== 'suggested')
      .sort((a, b) => {
        const aDate = a.promotedAt || a.addedAt;
        const bDate = b.promotedAt || b.addedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    setItems([...suggested, ...pushed]);
  }, [vacancyId, token]);

  const runDebug = async () => {
    setDebugBusy(true);
    try {
      const res = await fetch(`/api/admin/vacancies/${vacancyId}/debug-match`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) setDebug(data);
      else alert(data.message || 'Debug mislukt');
    } finally {
      setDebugBusy(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const promote = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/curated-matches/${id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({}),
      });
      await load();
      onChange();
    } finally { setBusy(null); }
  };

  const reject = async (id: string) => {
    if (!confirm('Suggestie verwijderen?')) return;
    setBusy(id);
    try {
      await fetch(`/api/admin/curated-matches/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      await load();
      onChange();
    } finally { setBusy(null); }
  };

  const rematch = async () => {
    setRematchBusy(true);
    try {
      const qs = rematchCountry ? `?country=${rematchCountry}` : '';
      const res = await fetch(`/api/admin/vacancies/${vacancyId}/run-match${qs}`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Match mislukt');
        return;
      }
      const r = data.result || {};
      alert(`Klaar: ${r.suggestionsCreated || 0} nieuwe suggesties (${r.candidatesScanned || 0} CVs gescand).`);
      await load();
      onChange();
    } finally {
      setRematchBusy(false);
    }
  };

  return (
    <div className="p-4 border-l-4 border-blue-600 space-y-3">
      <div className="flex items-stretch gap-0 justify-end">
        <select
          value={rematchCountry}
          onChange={(e) => setRematchCountry(e.target.value as typeof rematchCountry)}
          disabled={rematchBusy}
          className="bg-fuchsia-50 border-2 border-fuchsia-600 border-r-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-700 outline-none disabled:opacity-50"
          title="Beperk de re-match tot CVs uit één land"
        >
          <option value="">Alle landen</option>
          <option value="guyana">Guyana</option>
          <option value="netherlands">Nederland</option>
          <option value="suriname">Suriname</option>
        </select>
        <button
          type="button"
          onClick={rematch}
          disabled={rematchBusy}
          className="bg-fuchsia-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-1"
        >
          {rematchBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Match opnieuw
        </button>
      </div>
      {!items ? (
        <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></div>
      ) : items.length === 0 ? (
        <div className="py-4 space-y-3 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Geen open suggesties. Klik op ✨ rechts om opnieuw te matchen.
          </p>
          <button
            type="button"
            onClick={runDebug}
            disabled={debugBusy}
            className="bg-slate-900 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {debugBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Diagnose: toon top-20 rauwe scores
          </button>
          {debug && (
            <div className="mt-3 bg-slate-50 border-2 border-slate-300 p-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">
                {debug.cvsScanned} CV&apos;s gescand · drempel {Math.round(debug.threshold * 100)}% · {debug.aboveThreshold} boven drempel · gem. cosine {debug.meanCosine}
              </p>
              {debug.existingMatches && Object.keys(debug.existingMatches).length > 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 mb-2">
                  Bestaande records: {Object.entries(debug.existingMatches).map(([s, n]) => `${s}=${n}`).join(' · ')}
                </p>
              )}
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                    <th className="text-left p-1">Naam</th>
                    <th className="text-left p-1">Email</th>
                    <th className="text-right p-1">Cosine</th>
                    <th className="text-right p-1">%</th>
                  </tr>
                </thead>
                <tbody>
                  {debug.topRaw.map(r => (
                    <tr key={r.cvId} className="border-b border-slate-100">
                      <td className="p-1 font-bold truncate max-w-[180px]">{r.fullName}</td>
                      <td className="p-1 text-slate-500 truncate max-w-[180px]">{r.email}</td>
                      <td className="p-1 text-right font-mono">{r.cosine.toFixed(3)}</td>
                      <td className={cn('p-1 text-right font-black', r.cosine >= 0.20 ? 'text-emerald-600' : 'text-slate-400')}>{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
            {items.filter(i => i.status === 'suggested').length} open · {items.filter(i => i.status !== 'suggested').length} gepushed
          </p>
          {items.map(s => {
            const isPushed = s.status !== 'suggested';
            const pushedDate = s.promotedAt || s.addedAt;
            const cv = s.cv;
            const years = yearsFromExperience(cv?.experience);
            const skills = topSkills(cv?.skills);
            const edu = educationLevel(cv?.education);
            const flag = cv?.country ? COUNTRY_FLAG[cv.country] : '';
            const reason = reasons[s._id] ?? s.matchReason ?? null;
            return (
              <div key={s._id} className={cn(
                'border-2 p-3 space-y-2',
                isPushed ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200',
              )}>
                <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <p className="font-black text-sm truncate">{cv?.fullName || '—'}</p>
                    {flag && <span className="text-xs shrink-0" title={cv?.country}>{flag}</span>}
                  </div>
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {cv?.jobTitle || '—'}{cv?.location ? ` · ${cv.location}` : ''}
                    {years !== null && ` · ${years} jr ervaring`}
                    {edu && ` · ${edu}`}
                  </p>
                  {(cv?.email || cv?.phone) && (
                    <p className="text-[11px] font-bold text-slate-600 truncate">
                      {cv?.email && <span>{cv.email}</span>}
                      {cv?.email && cv?.phone && <span className="text-slate-300"> · </span>}
                      {cv?.phone && <span>{cv.phone}</span>}
                    </p>
                  )}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.map((sk, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-1.5 py-0.5 border border-blue-200">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {s.matchScore !== undefined && (
                  <div className="text-right shrink-0">
                    <div className={cn(
                      'text-xl font-black italic leading-none',
                      s.matchScore >= 70 ? 'text-blue-600' : s.matchScore >= 50 ? 'text-emerald-600' : 'text-slate-700',
                    )}>{s.matchScore}%</div>
                  </div>
                )}
                <div className="flex gap-2 shrink-0 items-start">
                  <button
                    type="button"
                    disabled={reasonBusy === s._id}
                    onClick={() => loadReason(s._id)}
                    title={reason ? 'Toelichting opnieuw genereren' : 'Genereer een AI-uitleg waarom deze kandidaat past'}
                    className="border-2 border-fuchsia-300 text-fuchsia-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {reasonBusy === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {reason ? 'Opnieuw' : 'Waarom?'}
                  </button>
                  {isPushed ? (
                    <span
                      title={s.status}
                      className="bg-emerald-100 border-2 border-emerald-300 text-emerald-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Gepushed {new Date(pushedDate).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy === s._id}
                        onClick={() => promote(s._id)}
                        className="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-1"
                      >
                        {busy === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        Push
                      </button>
                      <button
                        type="button"
                        disabled={busy === s._id}
                        onClick={() => reject(s._id)}
                        className="border-2 border-red-300 text-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50"
                      >
                        Negeer
                      </button>
                    </>
                  )}
                </div>
              </div>
              {reason && (
                <div className="border-t-2 border-fuchsia-200 bg-fuchsia-50 px-3 py-2 -mx-3 -mb-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI-toelichting
                  </p>
                  <p className="text-[12px] text-slate-700 leading-snug">{reason}</p>
                </div>
              )}
              </div>
            );
          })}
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

// ============================ MATCHING ============================

interface MatchEventRow {
  _id: string;
  cvId?: string;
  cvFullName?: string;
  vacancyId?: string;
  vacancyTitle?: string;
  score: number;
  matchType: 'AI Semantic' | 'TF-IDF';
  source: 'jobseeker' | 'admin-cv' | 'admin-vacancy';
  createdAt: string;
}

interface MatchVacancyResult {
  _id?: string;
  title: string;
  company?: string;
  location?: string;
  source?: string;
  matchScore: number;
  matchType: string;
  description?: string;
  employmentType?: string;
  applyLink?: string;
  postedAt?: string;
  country?: 'guyana' | 'netherlands' | 'suriname';
  salary?: { min?: number; max?: number; currency?: string; period?: string };
}

interface MatchCvResult {
  _id: string;
  fullName: string;
  jobTitle?: string;
  skills?: string;
  location?: string;
  matchScore: number;
  matchedTerms?: string[];
}

type MatchingSubTab = 'top' | 'history' | 'vacancy-to-cvs' | 'cv-to-vacancies';

function MatchingTab({ token }: { token: string }) {
  const [sub, setSub] = useState<MatchingSubTab>('top');
  const subTabs: Array<{ id: MatchingSubTab; label: string }> = [
    { id: 'top', label: 'Top Matches' },
    { id: 'history', label: 'Geschiedenis' },
    { id: 'vacancy-to-cvs', label: 'Vacature → CVs' },
    { id: 'cv-to-vacancies', label: 'CV → Vacatures' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Matching" subtitle="Match-geschiedenis en handmatige matching" />
      <div className="bg-white border-2 border-black flex flex-wrap">
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              'px-5 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-slate-100 last:border-r-0 transition-colors',
              sub === t.id ? 'bg-black text-white' : 'hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {sub === 'top' && <TopMatchesPanel token={token} />}
      {sub === 'history' && <MatchHistoryPanel token={token} />}
      {sub === 'vacancy-to-cvs' && <VacancyToCvsPanel token={token} />}
      {sub === 'cv-to-vacancies' && <CvToVacanciesPanel token={token} />}
    </div>
  );
}

interface TopMatchRow {
  _id: string;
  matchScore?: number;
  matchReason?: string;
  status: string;
  source: string;
  addedAt: string;
  promotedAt?: string;
  cv: { _id: string; fullName?: string; jobTitle?: string; location?: string; email?: string; phone?: string; country?: 'guyana' | 'netherlands' | 'suriname' } | null;
  vacancy: { _id: string; title?: string; company?: string; location?: string; source?: string; country?: 'guyana' | 'netherlands' | 'suriname'; applyLink?: string } | null;
}

function TopMatchesPanel({ token }: { token: string }) {
  const [items, setItems] = useState<TopMatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'' | 'suggested' | 'pushed'>('suggested');
  const [country, setCountry] = useState<'' | 'guyana' | 'netherlands' | 'suriname'>('');
  const [minScore, setMinScore] = useState(40);
  const [limit, setLimit] = useState(50);
  const [busy, setBusy] = useState<string | null>(null);
  const [pushedSet, setPushedSet] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonBusy, setReasonBusy] = useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ minScore: String(minScore), limit: String(limit) });
      if (status) qs.set('status', status);
      if (country) qs.set('country', country);
      const res = await fetch(`/api/admin/top-matches?${qs}`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setItems(data.matches as TopMatchRow[]);
    } finally {
      setLoading(false);
    }
  }, [token, status, country, minScore, limit]);

  useEffect(() => { reload(); }, [reload]);

  const promote = async (matchId: string) => {
    setBusy(matchId);
    try {
      await fetch(`/api/admin/curated-matches/${matchId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({}),
      });
      setPushedSet(prev => new Set([...prev, matchId]));
    } finally { setBusy(null); }
  };

  const reject = async (matchId: string) => {
    if (!confirm('Suggestie verwijderen?')) return;
    setBusy(matchId);
    try {
      await fetch(`/api/admin/curated-matches/${matchId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      setItems(prev => prev.filter(i => i._id !== matchId));
    } finally { setBusy(null); }
  };

  const loadReason = async (matchId: string) => {
    setReasonBusy(matchId);
    try {
      const res = await fetch(`/api/admin/curated-matches/${matchId}/reason`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setReasons(prev => ({ ...prev, [matchId]: data.reason }));
      else setReasons(prev => ({ ...prev, [matchId]: data.message || 'Toelichting mislukt' }));
    } finally { setReasonBusy(null); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border-2 border-black p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="border-2 border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
            <option value="suggested">Open suggesties</option>
            <option value="pushed">Al gepushed</option>
            <option value="">Alle</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Land</label>
          <select value={country} onChange={e => setCountry(e.target.value as typeof country)} className="border-2 border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
            <option value="">Alle landen</option>
            <option value="guyana">Guyana</option>
            <option value="netherlands">Nederland</option>
            <option value="suriname">Suriname</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Min. score (%)</label>
          <input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="border-2 border-slate-200 px-3 py-2 text-[10px] font-black w-24 outline-none" />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Limiet</label>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border-2 border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
            <option value={200}>Top 200</option>
          </select>
        </div>
        <button onClick={reload} disabled={loading} className="border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto self-center">{items.length} matches</p>
      </div>

      {/* Lijst */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      ) : items.length === 0 ? (
        <p className="text-center py-12 text-[11px] font-black uppercase tracking-widest text-slate-300">Geen matches met deze filters.</p>
      ) : (
        <div className="space-y-2">
          {items.map(m => {
            const cv = m.cv;
            const vac = m.vacancy;
            const cvFlag = cv?.country ? COUNTRY_FLAG[cv.country] : '';
            const vacFlag = vac?.country ? COUNTRY_FLAG[vac.country] : '';
            const score = m.matchScore ?? 0;
            const reason = reasons[m._id] ?? m.matchReason;
            const isPushed = pushedSet.has(m._id) || m.status !== 'suggested';
            return (
              <div key={m._id} className={cn(
                'bg-white border-2 p-3 space-y-2',
                isPushed ? 'border-slate-200 opacity-80' : 'border-slate-200',
              )}>
                <div className="flex items-start gap-3">
                  {/* CV info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Kandidaat</p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-black text-sm truncate">{cv?.fullName || '—'}</p>
                      {cvFlag && <span className="text-xs shrink-0">{cvFlag}</span>}
                    </div>
                    <p className="text-xs font-bold text-slate-500 truncate">{cv?.jobTitle || '—'}{cv?.location ? ` · ${cv.location}` : ''}</p>
                  </div>

                  <div className="text-slate-300 text-2xl font-black self-center px-2">×</div>

                  {/* Vacature info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Vacature</p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-black text-sm truncate">{vac?.title || '—'}</p>
                      {vacFlag && <span className="text-xs shrink-0">{vacFlag}</span>}
                    </div>
                    <p className="text-xs font-bold text-slate-500 truncate">{vac?.company || '—'}{vac?.location ? ` · ${vac.location}` : ''}</p>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 self-center">
                    <div className={cn(
                      'text-2xl font-black italic leading-none',
                      score >= 70 ? 'text-blue-600' : score >= 50 ? 'text-emerald-600' : 'text-slate-700',
                    )}>{score}%</div>
                  </div>

                  {/* Acties */}
                  <div className="shrink-0 flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadReason(m._id)}
                      disabled={reasonBusy === m._id}
                      title="Genereer AI-uitleg"
                      className="border-2 border-fuchsia-300 text-fuchsia-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 disabled:opacity-50 flex items-center gap-1"
                    >
                      {reasonBusy === m._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {reason ? 'Opnieuw' : 'Waarom?'}
                    </button>
                    {isPushed ? (
                      <span className="bg-emerald-100 border-2 border-emerald-300 text-emerald-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Gepushed
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => promote(m._id)}
                          disabled={busy === m._id}
                          className="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-1"
                        >
                          {busy === m._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Push
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(m._id)}
                          disabled={busy === m._id}
                          className="border-2 border-red-300 text-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50"
                        >
                          Negeer
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {reason && (
                  <div className="border-t-2 border-fuchsia-200 bg-fuchsia-50 px-3 py-2 -mx-3 -mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-700 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI-toelichting
                    </p>
                    <p className="text-[12px] text-slate-700 leading-snug">{reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchHistoryPanel({ token }: { token: string }) {
  const [events, setEvents] = useState<MatchEventRow[]>([]);
  const [topCvs, setTopCvs] = useState<Array<{ _id: string; cvFullName: string; count: number; avgScore: number }>>([]);
  const [bySource, setBySource] = useState<Array<{ _id: string; count: number }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [days, setDays] = useState<string>('');

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (minScore) params.set('minScore', minScore);
      if (days) {
        const d = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
        params.set('since', d.toISOString());
      }
      params.set('limit', '200');
      const res = await fetch(`/api/admin/match-events?${params.toString()}`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setTopCvs(data.topCvs || []);
        setBySource(data.bySource || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [token, source, minScore, days]);

  useEffect(() => { reload(); }, [reload]);

  const sourceLabel: Record<string, string> = {
    jobseeker: 'Werkzoekende',
    'admin-cv': 'Admin (CV)',
    'admin-vacancy': 'Admin (Vacature)',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-black p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Totaal events</p>
          <p className="text-3xl font-black tracking-tighter italic">{total}</p>
        </div>
        <div className="bg-white border-2 border-black p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Per bron</p>
          <div className="space-y-1">
            {bySource.length === 0 && <p className="text-[11px] font-bold text-slate-300">Geen data</p>}
            {bySource.map(s => (
              <div key={s._id} className="flex justify-between text-[11px] font-bold">
                <span>{sourceLabel[s._id] || s._id}</span>
                <span className="text-blue-600">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border-2 border-black p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Top CVs</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {topCvs.length === 0 && <p className="text-[11px] font-bold text-slate-300">Geen data</p>}
            {topCvs.slice(0, 5).map(c => (
              <div key={c._id || c.cvFullName} className="flex justify-between text-[11px] font-bold">
                <span className="truncate">{c.cvFullName || 'Onbekend'}</span>
                <span className="text-blue-600 shrink-0 ml-2">{c.count} · {Math.round(c.avgScore)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-black p-4 flex flex-wrap gap-3 items-center">
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="border-2 border-slate-100 px-3 py-2 text-[11px] font-bold"
        >
          <option value="">Alle bronnen</option>
          <option value="jobseeker">Werkzoekende</option>
          <option value="admin-cv">Admin (CV)</option>
          <option value="admin-vacancy">Admin (Vacature)</option>
        </select>
        <select
          value={minScore}
          onChange={e => setMinScore(e.target.value)}
          className="border-2 border-slate-100 px-3 py-2 text-[11px] font-bold"
        >
          <option value="">Alle scores</option>
          <option value="40">≥ 40%</option>
          <option value="60">≥ 60%</option>
          <option value="80">≥ 80%</option>
        </select>
        <select
          value={days}
          onChange={e => setDays(e.target.value)}
          className="border-2 border-slate-100 px-3 py-2 text-[11px] font-bold"
        >
          <option value="">Alle tijd</option>
          <option value="1">Laatste 24u</option>
          <option value="7">Laatste 7 dagen</option>
          <option value="30">Laatste 30 dagen</option>
        </select>
        <button
          onClick={reload}
          className="border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="p-3 text-left">CV</th>
                <th className="p-3 text-left">Vacature</th>
                <th className="p-3 text-left w-24">Score</th>
                <th className="p-3 text-left w-32">Type</th>
                <th className="p-3 text-left w-32">Bron</th>
                <th className="p-3 text-left w-40">Wanneer</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Geen match events.</td></tr>
              )}
              {events.map(ev => (
                <tr key={ev._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
                  <td className="p-3 truncate max-w-[200px]">{ev.cvFullName || '—'}</td>
                  <td className="p-3 truncate max-w-[260px]">{ev.vacancyTitle || '—'}</td>
                  <td className="p-3"><ScoreBadge score={ev.score} /></td>
                  <td className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{ev.matchType}</td>
                  <td className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{sourceLabel[ev.source] || ev.source}</td>
                  <td className="p-3 text-[10px] font-bold text-slate-400">{new Date(ev.createdAt).toLocaleString('nl-NL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-600' : score >= 50 ? 'bg-blue-600' : score >= 30 ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <span className={cn('inline-block text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5', color)}>
      {score}%
    </span>
  );
}

function VacancyToCvsPanel({ token }: { token: string }) {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<MatchCvResult[] | null>(null);
  const [terms, setTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (text.trim().length < 3) {
      setError('Vacaturetekst moet minimaal 3 karakters bevatten');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/test-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ vacancyText: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
        setTerms(data.vacancyTerms || []);
      } else {
        setError(data.message || 'Match mislukt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Plak een vacaturetekst (TF-IDF matching tegen alle interne CVs)
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Plak hier de volledige vacaturetekst..."
          rows={8}
          className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={loading || text.trim().length < 3}
            className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Matching...</> : <><Target className="w-3 h-3" /> Match CVs</>}
          </button>
          {error && (
            <p className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>
      </div>

      {terms.length > 0 && (
        <div className="bg-white border-2 border-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Top termen uit vacature</p>
          <div className="flex flex-wrap gap-1">
            {terms.map(t => (
              <span key={t} className="text-[10px] font-bold bg-slate-50 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      )}

      {matches !== null && <MatchResultsList matches={matches} />}
    </div>
  );
}

function CvToVacanciesPanel({ token }: { token: string }) {
  const [mode, setMode] = useState<'existing' | 'upload'>('existing');
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<MatchVacancyResult[] | null>(null);
  const [matchedFor, setMatchedFor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetch('/api/cvs', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(d => { if (d.success) setCvs(d.data || []); })
      .catch(() => {});
  }, [token]);

  const filteredCvs = cvs.filter(cv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return cv.fullName.toLowerCase().includes(q) ||
      (cv.email || '').toLowerCase().includes(q) ||
      (cv.jobTitle || '').toLowerCase().includes(q);
  }).slice(0, 100);

  const runExisting = async () => {
    if (!selectedCvId) {
      setError('Kies eerst een CV');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cvs/${selectedCvId}/matches`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
        setMatchedFor(data.cv?.fullName || '');
      } else {
        setError(data.message || 'Match mislukt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match mislukt');
    } finally {
      setLoading(false);
    }
  };

  const runUpload = async () => {
    if (!file) {
      setError('Kies een bestand');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Bestand te groot (max 10MB)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/match-cv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData,
          lang: 'nl',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
        setMatchedFor(data.cv?.fullName || file.name);
      } else {
        setError(data.message || 'Match mislukt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('existing')}
            className={cn(
              'px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2',
              mode === 'existing' ? 'bg-black text-white border-black' : 'border-slate-200 hover:border-black',
            )}
          >
            Bestaand CV
          </button>
          <button
            onClick={() => setMode('upload')}
            className={cn(
              'px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2',
              mode === 'upload' ? 'bg-black text-white border-black' : 'border-slate-200 hover:border-black',
            )}
          >
            Upload nieuw CV
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek CV op naam, email, functie..."
              className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
            />
            <select
              value={selectedCvId}
              onChange={e => setSelectedCvId(e.target.value)}
              className="w-full border-2 border-slate-100 p-3 font-bold text-sm"
            >
              <option value="">— Kies een CV —</option>
              {filteredCvs.map(cv => (
                <option key={cv._id} value={cv._id}>
                  {cv.fullName}{cv.jobTitle ? ` · ${cv.jobTitle}` : ''}{cv.location ? ` · ${cv.location}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={runExisting}
              disabled={loading || !selectedCvId}
              className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Matching...</> : <><Target className="w-3 h-3" /> Match Vacatures (AI Semantic)</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm font-bold file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-white file:text-black file:font-black file:uppercase file:tracking-widest file:text-[10px] file:cursor-pointer"
            />
            {file && (
              <p className="text-[11px] font-bold text-slate-500">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
            )}
            <button
              onClick={runUpload}
              disabled={loading || !file}
              className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Parsen + matchen...</> : <><Upload className="w-3 h-3" /> Match Vacatures</>}
            </button>
            <p className="text-[10px] font-bold text-slate-400">CV wordt geparsed en geëmbed maar niet opgeslagen.</p>
          </div>
        )}

        {error && (
          <p className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>

      {matches !== null && (
        <>
          {matchedFor && (
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              <Activity className="w-3 h-3 inline mr-1" /> Matches voor: <span className="text-black">{matchedFor}</span>
            </p>
          )}
          <VacancyMatchesList matches={matches} />
        </>
      )}
    </div>
  );
}

function MatchResultsList({ matches }: { matches: MatchCvResult[] }) {
  if (matches.length === 0) {
    return <p className="text-center py-12 text-[11px] font-black uppercase tracking-widest text-slate-300">Geen matches gevonden.</p>;
  }
  return (
    <div className="bg-white border-2 border-black overflow-hidden">
      <table className="w-full">
        <thead className="bg-black text-white">
          <tr className="text-[10px] font-black uppercase tracking-widest">
            <th className="p-3 text-left">CV</th>
            <th className="p-3 text-left">Functie</th>
            <th className="p-3 text-left">Locatie</th>
            <th className="p-3 text-left w-24">Score</th>
            <th className="p-3 text-left">Termen</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m._id} className="border-t border-slate-100 hover:bg-slate-50 text-sm font-bold">
              <td className="p-3 truncate max-w-[200px]">{m.fullName}</td>
              <td className="p-3 truncate max-w-[200px] text-slate-500">{m.jobTitle || '—'}</td>
              <td className="p-3 truncate max-w-[150px] text-slate-500">{m.location || '—'}</td>
              <td className="p-3"><ScoreBadge score={m.matchScore} /></td>
              <td className="p-3 text-[10px] font-bold text-slate-500">{(m.matchedTerms || []).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VacancyMatchesList({
  matches,
  onPush,
  pushingId,
  pushedIds,
  cvId,
  token,
}: {
  matches: MatchVacancyResult[];
  onPush?: (vacancy: MatchVacancyResult) => void;
  pushingId?: string | null;
  pushedIds?: Set<string>;
  cvId?: string;
  token?: string;
}) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonBusy, setReasonBusy] = useState<string | null>(null);

  const loadReason = async (vacancyId: string) => {
    if (!cvId || !token) return;
    setReasonBusy(vacancyId);
    try {
      const qs = new URLSearchParams({ vacancyId, cvId });
      const res = await fetch(`/api/admin/match-reason?${qs}`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (data.success) setReasons(prev => ({ ...prev, [vacancyId]: data.reason }));
      else setReasons(prev => ({ ...prev, [vacancyId]: data.message || 'Toelichting genereren mislukt' }));
    } finally {
      setReasonBusy(null);
    }
  };

  if (matches.length === 0) {
    return <p className="text-center py-12 text-[11px] font-black uppercase tracking-widest text-slate-300">Geen matches gevonden.</p>;
  }
  return (
    <div className="space-y-2">
      {matches.map((m, i) => {
        const id = m._id || '';
        const isPushed = id && pushedIds?.has(id);
        const isPushing = id && pushingId === id;
        const flag = m.country ? COUNTRY_FLAG[m.country] : '';
        const salary = formatSalary(m.salary);
        const posted = daysAgo(m.postedAt);
        const descPreview = m.description ? m.description.replace(/\s+/g, ' ').trim().slice(0, 180) : '';
        const reason = id ? reasons[id] : undefined;
        const canShowReason = Boolean(cvId && token);
        return (
          <div key={id || `${m.title}-${i}`} className="bg-white border-2 border-slate-200 p-3 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-black text-sm truncate">{m.title}</p>
                  {flag && <span className="text-xs shrink-0" title={m.country}>{flag}</span>}
                </div>
                <p className="text-xs font-bold text-slate-500 truncate">
                  {m.company || '—'}{m.location ? ` · ${m.location}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className={cn(
                  'text-xl font-black italic leading-none',
                  m.matchScore >= 70 ? 'text-blue-600' : m.matchScore >= 50 ? 'text-emerald-600' : 'text-slate-700',
                )}>{m.matchScore}%</div>
              </div>
              <div className="shrink-0 flex gap-2">
                {canShowReason && id && (
                  <button
                    type="button"
                    onClick={() => loadReason(id)}
                    disabled={reasonBusy === id}
                    title={reason ? 'Toelichting opnieuw genereren' : 'Genereer AI-uitleg waarom deze vacature past'}
                    className="border-2 border-fuchsia-300 text-fuchsia-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {reasonBusy === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {reason ? 'Opnieuw' : 'Waarom?'}
                  </button>
                )}
                {onPush && (isPushed ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 inline-flex items-center gap-1 px-2 py-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Gepusht
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPush(m)}
                    disabled={!!isPushing || !id}
                    className="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                    title="Push naar werkgever-portaal"
                  >
                    {isPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                    Push
                  </button>
                ))}
              </div>
            </div>
            {descPreview && (
              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{descPreview}…</p>
            )}
            <div className="flex flex-wrap gap-2 items-center text-[9px] font-black uppercase tracking-widest">
              {m.source && (
                <span className={cn(
                  'px-1.5 py-0.5 border',
                  m.source === 'employer' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : m.source === 'adzuna' ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : m.source === 'jsearch' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200',
                )}>{m.source}</span>
              )}
              {m.employmentType && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">{m.employmentType}</span>}
              {salary && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">{salary}</span>}
              {posted && <span className="text-slate-400 normal-case tracking-normal font-bold">{posted}</span>}
              {m.applyLink && (
                <a
                  href={m.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-blue-600 hover:text-black underline normal-case tracking-normal font-bold"
                >
                  Bekijk vacature →
                </a>
              )}
            </div>
            {reason && (
              <div className="border-t-2 border-fuchsia-200 bg-fuchsia-50 px-3 py-2 -mx-3 -mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI-toelichting
                </p>
                <p className="text-[12px] text-slate-700 leading-snug">{reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CvMatchModal({ token, cv, onClose }: { token: string; cv: CvRow; onClose: () => void }) {
  const [matches, setMatches] = useState<MatchVacancyResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());
  const [pushMessage, setPushMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  // Default naar CV's eigen land — voor een Rotterdam-CV hoef je zelden
  // tegen Guyana-vacatures te matchen. Lege string = alle landen.
  const [country, setCountry] = useState<'' | 'guyana' | 'netherlands' | 'suriname'>(cv.country || '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMatches(null);
    setError(null);
    const qs = country ? `?country=${country}` : '';
    fetch(`/api/admin/cvs/${cv._id}/matches${qs}`, { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.success) setMatches(data.matches || []);
        else setError(data.message || 'Match mislukt');
      })
      .catch(err => !cancelled && setError(err instanceof Error ? err.message : 'Match mislukt'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [cv._id, token, country]);

  const pushToVacancy = async (vacancy: MatchVacancyResult) => {
    if (!vacancy._id) return;
    setPushingId(vacancy._id);
    setPushMessage(null);
    try {
      const res = await fetch('/api/admin/curated-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          vacancyId: vacancy._id,
          cvId: cv._id,
          matchScore: vacancy.matchScore,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPushedIds(prev => new Set([...prev, vacancy._id!]));
        setPushMessage({ kind: 'ok', text: data.emailSent ? `Gepusht naar "${vacancy.title}" + email verstuurd` : `Gepusht naar "${vacancy.title}"` });
      } else if (res.status === 409) {
        setPushedIds(prev => new Set([...prev, vacancy._id!]));
        setPushMessage({ kind: 'err', text: data.message || 'Al gekoppeld' });
      } else {
        setPushMessage({ kind: 'err', text: data.message || 'Push mislukt' });
      }
    } catch (err) {
      setPushMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Push mislukt' });
    } finally {
      setPushingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white border-4 border-black w-full max-w-5xl max-h-[85vh] overflow-y-auto shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
      >
        <div className="bg-black text-white p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Matches voor</p>
            <h3 className="text-2xl font-black tracking-tighter italic">{cv.fullName}</h3>
            {cv.jobTitle && <p className="text-[11px] font-bold text-slate-300">{cv.jobTitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as typeof country)}
              className="bg-white text-black px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none border-2 border-blue-400"
              title="Beperk matches tot één land"
            >
              <option value="">Alle landen</option>
              <option value="guyana">Guyana</option>
              <option value="netherlands">Nederland</option>
              <option value="suriname">Suriname</option>
            </select>
            <button onClick={onClose} className="p-2 hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {pushMessage && (
            <div className={cn(
              'border-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest flex items-center gap-2',
              pushMessage.kind === 'ok' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700',
            )}>
              {pushMessage.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pushMessage.text}
            </div>
          )}
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
          ) : error ? (
            <p className="text-center py-12 text-[11px] font-black text-red-600 uppercase tracking-widest">{error}</p>
          ) : matches && matches.length > 0 ? (
            <VacancyMatchesList
              matches={matches}
              onPush={pushToVacancy}
              pushingId={pushingId}
              pushedIds={pushedIds}
              cvId={cv._id}
              token={token}
            />
          ) : (
            <p className="text-center py-12 text-[11px] font-black uppercase tracking-widest text-slate-300">Geen matches.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================ BULK UPLOAD ============================

type UploadStatus = 'pending' | 'uploading' | 'created' | 'duplicate' | 'failed';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  message?: string;
  cvId?: string;
}

const CONCURRENCY = 5;
const MAX_FILE_BYTES = 4.5 * 1024 * 1024; // Vercel hobby plan body limit

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve((result.split(',')[1] || ''));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ZIP_MIMES = new Set(['application/zip', 'application/x-zip-compressed', 'application/x-zip']);

function isZipFile(f: File): boolean {
  return f.name.toLowerCase().endsWith('.zip') || ZIP_MIMES.has(f.type);
}

function classifyCvFile(name: string): { mime: string } | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return { mime: 'application/pdf' };
  if (lower.endsWith('.docx')) return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  return null;
}

// Skip OS-metadata die macOS/Windows in ZIPs stoppen
function isJunkPath(path: string): boolean {
  return path.startsWith('__MACOSX/') ||
    path.endsWith('.DS_Store') ||
    path.endsWith('Thumbs.db') ||
    path.split('/').some(seg => seg.startsWith('.'));
}

async function extractZipEntries(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const out: File[] = [];
  const entries = Object.entries(zip.files);
  for (const [path, entry] of entries) {
    if (entry.dir) continue;
    if (isJunkPath(path)) continue;
    const cls = classifyCvFile(path);
    if (!cls) continue;
    const blob = await entry.async('blob');
    const fileName = path.split('/').pop() || path;
    out.push(new File([blob], fileName, { type: cls.mime }));
  }
  return out;
}

type BulkVacancyStatus = 'pending' | 'parsing' | 'creating' | 'created' | 'failed';

interface BulkVacancyItem {
  id: string;
  file: File;
  status: BulkVacancyStatus;
  message?: string;
  vacancyId?: string;
  parsedTitle?: string;
}

const BULK_VACANCY_CONCURRENCY = 3;

function BulkVacancyPanel({
  token, onClose, onComplete,
}: {
  token: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<BulkVacancyItem[]>([]);
  const [running, setRunning] = useState(false);
  const [employerOptions, setEmployerOptions] = useState<Array<{ _id: string; companyName: string; username: string }>>([]);
  const [employerId, setEmployerId] = useState('');
  const cancelledRef = React.useRef(false);
  const abortersRef = React.useRef<Set<AbortController>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/employers', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(data => { if (data.success) setEmployerOptions(data.data); })
      .catch(() => { /* ignore */ });
  }, [token]);

  const stats = React.useMemo(() => {
    const byStatus: Record<BulkVacancyStatus, number> = {
      pending: 0, parsing: 0, creating: 0, created: 0, failed: 0,
    };
    items.forEach(i => { byStatus[i.status]++; });
    return byStatus;
  }, [items]);

  const updateItem = (id: string, patch: Partial<BulkVacancyItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newItems: BulkVacancyItem[] = arr.map(f => {
      const lower = f.name.toLowerCase();
      const isPdf = f.type === 'application/pdf' || lower.endsWith('.pdf');
      const isDocx = f.type.includes('wordprocessingml') || lower.endsWith('.docx');
      const tooLarge = f.size > MAX_FILE_BYTES;
      const wrongType = !isPdf && !isDocx;
      let status: BulkVacancyStatus = 'pending';
      let message: string | undefined;
      if (tooLarge) { status = 'failed'; message = 'Bestand te groot (>4.5 MB)'; }
      else if (wrongType) { status = 'failed'; message = 'Alleen PDF of Word (.docx)'; }
      return {
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        status,
        message,
      };
    });
    setItems(prev => [...prev, ...newItems]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearCompleted = () => setItems(prev => prev.filter(i => i.status === 'pending'));

  const processOne = async (item: BulkVacancyItem) => {
    if (cancelledRef.current) return;
    const ctrl = new AbortController();
    abortersRef.current.add(ctrl);
    try {
      updateItem(item.id, { status: 'parsing', message: undefined });
      const fileData = await readFileAsBase64(item.file);
      if (cancelledRef.current) {
        updateItem(item.id, { status: 'pending', message: undefined });
        return;
      }
      const parseRes = await fetch('/api/parse-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, fileType: item.file.type, fileName: item.file.name }),
        signal: ctrl.signal,
      });
      const parseData = await parseRes.json().catch(() => ({}));
      if (!parseRes.ok || !parseData.success) {
        updateItem(item.id, { status: 'failed', message: parseData.message || 'Parse mislukt' });
        return;
      }
      const parsed = parseData.data || {};
      const title = parsed.title || item.file.name.replace(/\.[^/.]+$/, '');

      updateItem(item.id, { status: 'creating', parsedTitle: title });
      if (cancelledRef.current) {
        updateItem(item.id, { status: 'pending', message: undefined });
        return;
      }
      const createRes = await fetch('/api/admin/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          title,
          location: parsed.location,
          description: parsed.requirements,
          employmentType: 'Full-time',
          isRemote: false,
          salaryCurrency: 'SRD',
          salaryPeriod: 'month',
          employerId: employerId || undefined,
        }),
        signal: ctrl.signal,
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createData.success) {
        updateItem(item.id, { status: 'failed', message: createData.message || `HTTP ${createRes.status}` });
        return;
      }
      updateItem(item.id, { status: 'created', vacancyId: createData.data?._id, message: undefined });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateItem(item.id, { status: 'pending', message: undefined });
        return;
      }
      const msg = err instanceof Error ? err.message : 'Verbinding mislukt';
      updateItem(item.id, { status: 'failed', message: msg });
    } finally {
      abortersRef.current.delete(ctrl);
    }
  };

  const start = async () => {
    if (running) return;
    cancelledRef.current = false;
    setRunning(true);
    const queue = [...items.filter(i => i.status === 'pending')];
    const workers = Array.from({ length: BULK_VACANCY_CONCURRENCY }, async () => {
      while (queue.length > 0 && !cancelledRef.current) {
        const next = queue.shift();
        if (!next) return;
        await processOne(next);
      }
    });
    await Promise.all(workers);
    setRunning(false);
    onComplete();
  };

  const cancel = () => {
    cancelledRef.current = true;
    abortersRef.current.forEach(c => c.abort());
    abortersRef.current.clear();
  };

  const totalDone = stats.created + stats.failed;
  const total = items.length;
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  return (
    <div className="bg-white border-2 border-purple-600 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter italic">Bulk Vacatures Upload</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            PDF/Word · max 4.5 MB · concurrency {BULK_VACANCY_CONCURRENCY}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
          Werkgever (optioneel)
        </label>
        <select
          value={employerId}
          onChange={(e) => setEmployerId(e.target.value)}
          disabled={running}
          className="w-full p-3 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm"
        >
          <option value="">— Geen werkgever (admin/internal) —</option>
          {employerOptions.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.companyName || emp.username}
            </option>
          ))}
        </select>
        <p className="text-[10px] font-bold text-slate-400 mt-2 italic">
          {employerId
            ? 'Vacatures worden aan deze werkgever gekoppeld + auto-match draait per vacature.'
            : 'Vacatures worden als admin/internal opgeslagen. Geen auto-match, wel zichtbaar voor JobSeekers.'}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      <div
        onClick={() => !running && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => !running && handleDrop(e)}
        className={cn(
          'border-4 border-dashed p-8 text-center transition-all',
          running ? 'border-slate-200 cursor-not-allowed opacity-60' : 'border-slate-200 hover:border-purple-600 hover:bg-purple-50/30 cursor-pointer',
        )}
      >
        <Upload className="w-10 h-10 text-purple-600 mx-auto mb-3" />
        <p className="text-sm font-black uppercase tracking-widest mb-1">Sleep vacatures hierheen</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF · DOCX — meerdere bestanden</p>
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip label="Totaal" value={total} />
            <StatChip label="Wachten" value={stats.pending} color="slate" />
            <StatChip label="Aangemaakt" value={stats.created} color="emerald" />
            <StatChip label="Mislukt" value={stats.failed} color="red" />
          </div>

          {(running || totalDone > 0) && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span>{running ? 'Bezig...' : 'Voltooid'}</span>
                <span>{totalDone}/{total} ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!running ? (
              <button
                onClick={start}
                disabled={stats.pending === 0}
                className="bg-purple-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-3 h-3" /> Start ({stats.pending})
              </button>
            ) : (
              <button onClick={cancel} className="bg-red-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2">
                <X className="w-3 h-3" /> Stoppen
              </button>
            )}
            {totalDone > 0 && !running && (
              <button onClick={clearCompleted} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white">
                Wis voltooide
              </button>
            )}
          </div>

          <div className="mt-6 max-h-[40vh] overflow-y-auto border-2 border-slate-100">
            <ul className="divide-y divide-slate-100">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-3 p-3 text-sm">
                  <BulkVacancyStatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" title={item.file.name}>{item.parsedTitle || item.file.name}</p>
                    {item.message && (
                      <p className="text-[10px] font-bold text-slate-400 truncate" title={item.message}>{item.message}</p>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 shrink-0">
                    {(item.file.size / 1024).toFixed(0)} KB
                  </span>
                  {item.status === 'pending' && !running && (
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function BulkVacancyStatusIcon({ status }: { status: BulkVacancyStatus }) {
  if (status === 'parsing' || status === 'creating') return <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />;
  if (status === 'created') return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />;
  return <FileText className="w-4 h-4 text-slate-300 shrink-0" />;
}

function BulkUploadPanel({
  token, onClose, onComplete,
}: {
  token: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [extracting, setExtracting] = useState<{ name: string; current: number; total: number } | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const cancelledRef = React.useRef(false);
  const abortersRef = React.useRef<Set<AbortController>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const stats = React.useMemo(() => {
    const byStatus: Record<UploadStatus, number> = {
      pending: 0, uploading: 0, created: 0, duplicate: 0, failed: 0,
    };
    items.forEach(i => { byStatus[i.status]++; });
    return byStatus;
  }, [items]);

  const toUploadItems = (files: File[]): UploadItem[] =>
    files.map(f => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      status: f.size > MAX_FILE_BYTES ? 'failed' : 'pending',
      message: f.size > MAX_FILE_BYTES ? 'Bestand te groot (>4.5 MB)' : undefined,
    }));

  const addFiles = async (filesIn: FileList | File[]) => {
    setZipError(null);
    const arr = Array.from(filesIn);
    const zips = arr.filter(isZipFile);
    const loose = arr.filter(f => !isZipFile(f));

    if (loose.length > 0) {
      setItems(prev => [...prev, ...toUploadItems(loose)]);
    }

    if (zips.length === 0) return;

    let processed = 0;
    for (const zip of zips) {
      setExtracting({ name: zip.name, current: processed, total: zips.length });
      try {
        const entries = await extractZipEntries(zip);
        if (entries.length === 0) {
          setZipError(`Geen PDF/Word bestanden gevonden in "${zip.name}"`);
        } else {
          setItems(prev => [...prev, ...toUploadItems(entries)]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ZIP uitpakken mislukt';
        setZipError(`"${zip.name}": ${msg}`);
      }
      processed++;
    }
    setExtracting(null);
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) await addFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCompleted = () => {
    setItems(prev => prev.filter(i => i.status === 'pending' || i.status === 'uploading'));
  };

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const processOne = async (item: UploadItem): Promise<void> => {
    if (cancelledRef.current) return;
    updateItem(item.id, { status: 'uploading', message: undefined });

    const ctrl = new AbortController();
    abortersRef.current.add(ctrl);

    try {
      const fileData = await readFileAsBase64(item.file);
      if (cancelledRef.current) {
        updateItem(item.id, { status: 'pending', message: undefined });
        return;
      }
      const res = await fetch('/api/cvs/auto-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          fileName: item.file.name,
          fileType: item.file.type || 'application/octet-stream',
          fileSize: item.file.size,
          fileData,
          lang: 'nl',
        }),
        signal: ctrl.signal,
      });

      // Some Vercel error pages return HTML — wrap json parse defensively.
      let data: { success?: boolean; status?: string; reason?: string; cvId?: string; existingCvName?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        if (res.status === 413) {
          updateItem(item.id, { status: 'failed', message: 'Bestand te groot voor server (>4.5 MB)' });
          return;
        }
        updateItem(item.id, { status: 'failed', message: `HTTP ${res.status}` });
        return;
      }

      if (data.success && data.status === 'created') {
        updateItem(item.id, { status: 'created', cvId: data.cvId });
      } else if (data.status === 'skipped') {
        const reasonLabel = ({
          'driveFileId-exists': 'Al bekend (Drive)',
          'sameFileNameAndSize': 'Duplicaat (zelfde bestand)',
          'duplicateNameAndExperience': 'Duplicaat (naam+ervaring)',
          'tooLarge': 'Bestand te groot',
          'tooShort': 'Te weinig tekst',
          'unsupported': 'Niet ondersteund',
          'parseFailed': 'Parse mislukt',
          'aiParseFailed': 'AI-parse mislukt',
          'noFile': 'Geen bestand',
          'pdfParserUnavailable': 'PDF-parser niet beschikbaar',
        } as Record<string, string>)[data.reason || ''] || data.reason || 'Onbekend';

        const isDup = data.reason === 'sameFileNameAndSize' || data.reason === 'duplicateNameAndExperience' || data.reason === 'driveFileId-exists';
        updateItem(item.id, {
          status: isDup ? 'duplicate' : 'failed',
          message: isDup && data.existingCvName ? `${reasonLabel} → ${data.existingCvName}` : reasonLabel,
        });
      } else {
        updateItem(item.id, { status: 'failed', message: data.message || 'Onbekende fout' });
      }
    } catch (err) {
      // Abort = gebruiker drukte Stoppen → terug naar pending zodat retry kan
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateItem(item.id, { status: 'pending', message: undefined });
        return;
      }
      const msg = err instanceof Error ? err.message : 'Verbinding mislukt';
      updateItem(item.id, { status: 'failed', message: msg });
    } finally {
      abortersRef.current.delete(ctrl);
    }
  };

  const start = async () => {
    if (running) return;
    cancelledRef.current = false;
    setRunning(true);

    // Pull queue from current state via ref to handle additions during processing
    const queue = [...items.filter(i => i.status === 'pending')];

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0 && !cancelledRef.current) {
        const next = queue.shift();
        if (!next) return;
        await processOne(next);
      }
    });
    await Promise.all(workers);

    setRunning(false);
    onComplete();
  };

  const cancel = () => {
    cancelledRef.current = true;
    // Breek alle in-flight fetches direct af i.p.v. wachten tot OpenAI klaar is
    abortersRef.current.forEach(c => c.abort());
    abortersRef.current.clear();
  };

  const totalDone = stats.created + stats.duplicate + stats.failed;
  const total = items.length;
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  return (
    <div className="bg-white border-2 border-blue-600 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter italic">Bulk CV Upload</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            PDF/Word/ZIP · max 4.5 MB per bestand · concurrency {CONCURRENCY}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,application/zip,application/x-zip-compressed"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      <div
        onClick={() => !running && !extracting && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => !running && !extracting && handleDrop(e)}
        className={cn(
          'border-4 border-dashed p-8 text-center transition-all',
          (running || extracting) ? 'border-slate-200 cursor-not-allowed opacity-60' : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50/30 cursor-pointer',
        )}
      >
        {extracting ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">
              ZIP uitpakken: {extracting.name}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {extracting.current + 1} / {extracting.total}
            </p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">
              Sleep CV&apos;s of een ZIP-map hierheen
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PDF · DOCX · ZIP — meerdere bestanden toegestaan
            </p>
          </>
        )}
      </div>

      {zipError && (
        <p className="mt-3 text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="w-3 h-3" /> {zipError}
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatChip label="Totaal" value={total} />
            <StatChip label="Wachten" value={stats.pending} color="slate" />
            <StatChip label="Geüpload" value={stats.created} color="emerald" />
            <StatChip label="Duplicaat" value={stats.duplicate} color="amber" />
            <StatChip label="Mislukt" value={stats.failed} color="red" />
          </div>

          {(running || totalDone > 0) && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span>{running ? 'Bezig...' : 'Voltooid'}</span>
                <span>{totalDone}/{total} ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!running ? (
              <button
                onClick={start}
                disabled={stats.pending === 0}
                className="bg-blue-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-3 h-3" /> Start Upload ({stats.pending})
              </button>
            ) : (
              <button onClick={cancel} className="bg-red-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2">
                <X className="w-3 h-3" /> Stoppen
              </button>
            )}
            {totalDone > 0 && !running && (
              <button onClick={clearCompleted} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white">
                Wis voltooide
              </button>
            )}
          </div>

          <div className="mt-6 max-h-[40vh] overflow-y-auto border-2 border-slate-100">
            <ul className="divide-y divide-slate-100">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-3 p-3 text-sm">
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" title={item.file.name}>{item.file.name}</p>
                    {item.message && (
                      <p className="text-[10px] font-bold text-slate-400 truncate" title={item.message}>{item.message}</p>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 shrink-0">
                    {(item.file.size / 1024).toFixed(0)} KB
                  </span>
                  {item.status === 'pending' && !running && (
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === 'pending') return <div className="w-3 h-3 bg-slate-200 rounded-full shrink-0" />;
  if (status === 'uploading') return <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />;
  if (status === 'created') return <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />;
  if (status === 'duplicate') return <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />;
  return <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />;
}

function StatChip({ label, value, color = 'blue' }: { label: string; value: number; color?: 'blue' | 'slate' | 'emerald' | 'amber' | 'red' }) {
  const colors = {
    blue: 'border-blue-600 text-blue-700 bg-blue-50',
    slate: 'border-slate-300 text-slate-600 bg-slate-50',
    emerald: 'border-emerald-600 text-emerald-700 bg-emerald-50',
    amber: 'border-amber-600 text-amber-700 bg-amber-50',
    red: 'border-red-600 text-red-700 bg-red-50',
  }[color];
  return (
    <div className={cn('border-2 p-3 text-center', colors)}>
      <div className="text-2xl font-black tracking-tighter italic leading-none">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
