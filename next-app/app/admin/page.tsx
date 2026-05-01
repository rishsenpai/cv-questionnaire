'use client';

import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Globe,
  X,
  Eye,
  BarChart3,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { isValidEmail } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';
import { ChartFrame } from '@/components/ChartFrame';

// Mock data for initial states
const USERS_GROWTH = [
  { name: 'Ma', users: 400, revenue: 2400 },
  { name: 'Di', users: 300, revenue: 1398 },
  { name: 'Wo', users: 980, revenue: 9800 },
  { name: 'Do', users: 390, revenue: 3908 },
  { name: 'Vr', users: 480, revenue: 4800 },
  { name: 'Za', users: 200, revenue: 3800 },
  { name: 'Zo', users: 500, revenue: 4300 },
];

const PLAN_DISTRIBUTION = [
  { name: 'Enterprise', value: 1000 },
];

const COLORS = ['#3b82f6'];

const RECENT_ACTIVITY = [
  { id: 1, type: 'user', action: 'Nieuwe kandidaat geregistreerd', target: 'Maikel J.', time: '2 min geleden' },
  { id: 2, type: 'job', action: 'Vacature geplaatst', target: 'Telesur - Senior Dev', time: '15 min geleden' },
  { id: 3, type: 'plan', action: 'Plan upgrade (Enterprise)', target: 'Staatsolie NV', time: '1u geleden' },
  { id: 4, type: 'report', action: 'Gebruiker gerapporteerd', target: 'Spam Account #12', time: '3u geleden' },
];

type AdminTab = 'overview' | 'users' | 'jobs' | 'revenue' | 'moderation' | 'system';
type UserFilterType = 'Alle' | 'Candidate' | 'Employer';
type UserStatus = 'Alle' | 'Active' | 'Pending';
type JobStatus = 'Alle' | 'Open' | 'Paused';
type ModerationStatus = 'Open' | 'Resolved' | 'Escalated' | 'Removed';
type ModerationFilter = 'Alle' | ModerationStatus;

type AdminUser = {
  name: string;
  email: string;
  type: Exclude<UserFilterType, 'Alle'>;
  status: Exclude<UserStatus, 'Alle'>;
  date: string;
};

type AdminJob = {
  id: string;
  title: string;
  company: string;
  apps: number;
  trends: string;
  status: Exclude<JobStatus, 'Alle'>;
};

type ModerationItem = {
  id: string;
  type: string;
  target: string;
  reason: string;
  severity: 'Hoog' | 'Middel' | 'Laag';
  status: ModerationStatus;
};

type SystemHealth = {
  platform: 'Healthy' | 'Degraded';
  uptime: string;
  latencyMs: number;
  storagePct: number;
  webhookSuccessPct: number;
  queueDepth: number;
  backups: string;
  lastAuditAt: string;
};

const USER_FILTER_OPTIONS: UserFilterType[] = ['Alle', 'Candidate', 'Employer'];
const USER_STATUS_OPTIONS: UserStatus[] = ['Alle', 'Active', 'Pending'];
const JOB_STATUS_OPTIONS: JobStatus[] = ['Alle', 'Open', 'Paused'];
const MODERATION_FILTER_OPTIONS: ModerationFilter[] = ['Alle', 'Open', 'Resolved', 'Escalated', 'Removed'];
const BASE_TOTAL_USERS = 1458;
const BASE_ACTIVE_JOBS = 42;
const BASE_TOTAL_APPLICATIONS = 1245;
const BASE_DAILY_REVENUE_SRD = 12450;
const JOB_REVENUE_MULTIPLIER = 250;
const REVENUE_SERIES: Record<string, typeof USERS_GROWTH> = {
  '7': USERS_GROWTH,
  '30': [
    { name: 'W1', users: 2400, revenue: 15800 },
    { name: 'W2', users: 2650, revenue: 17150 },
    { name: 'W3', users: 2890, revenue: 18300 },
    { name: 'W4', users: 3125, revenue: 19640 },
  ],
};

function getCurrentUserType(currentUser: any): Exclude<UserFilterType, 'Alle'> {
  return currentUser?.role === 'employer' || currentUser?.accountType === 'employer' ? 'Employer' : 'Candidate';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [revenuePeriod, setRevenuePeriod] = useState('7');
  
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [showJobFilters, setShowJobFilters] = useState(false);
  const [userFilters, setUserFilters] = useState<{ type: UserFilterType; status: UserStatus }>({ type: 'Alle', status: 'Alle' });
  const [jobFilters, setJobFilters] = useState<{ status: JobStatus }>({ status: 'Alle' });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSystemLogsModal, setShowSystemLogsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({});
  const [userForm, setUserForm] = useState<AdminUser>({ name: '', email: '', type: 'Candidate', status: 'Active', date: 'Vandaag' });
  const [jobForm, setJobForm] = useState<{ title: string; company: string; status: Exclude<JobStatus, 'Alle'> }>({ title: '', company: '', status: 'Open' });
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>(() =>
    readJson('suri_admin_moderation_queue', [
      { id: 'mod-1', type: 'Report', target: 'Spam Account #12', reason: 'Massale outreach en verdachte links', severity: 'Hoog', status: 'Open' },
      { id: 'mod-2', type: 'Job Review', target: 'Onbekende vacature', reason: 'Omschrijving te vaag en mogelijk duplicaat', severity: 'Middel', status: 'Open' },
      { id: 'mod-3', type: 'Identity', target: 'Ricardo S.', reason: 'Pending verificatie langer dan 48 uur', severity: 'Laag', status: 'Open' },
    ])
  );
  const [moderationFilter, setModerationFilter] = useState<ModerationFilter>('Alle');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(() =>
    readJson('suri_admin_system_health', {
      platform: 'Healthy',
      uptime: '99.98%',
      latencyMs: 42,
      storagePct: 42,
      webhookSuccessPct: 97,
      queueDepth: 3,
      backups: 'Up-to-date',
      lastAuditAt: new Date().toISOString(),
    })
  );

  useEffect(() => {
    const loadAdminData = () => {
      const isAuth = sessionStorage.getItem('suri_admin_auth') === 'true';
      if (isAuth) setIsAuthorized(true);

      const storedJobs = JSON.parse(localStorage.getItem('suri_jobs') || '[]');
      const storedApps = JSON.parse(localStorage.getItem('suri_applications') || '[]');
      const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('suri_user') || 'null') : null;
      const extraUsers = readJson<AdminUser[]>('suri_admin_users', []);
      const hiddenUsers = readJson<string[]>('suri_admin_hidden_users', []);
      const hiddenJobs = readJson<string[]>('suri_admin_hidden_jobs', []);

      // Sync User List
      const demoUsers: AdminUser[] = [
        { name: 'Maikel J.', email: 'm.j@telesur.sr', type: 'Candidate', status: 'Active', date: '21-04-2026' },
        { name: 'Staatsolie NV', email: 'hr@staatsolie.sr', type: 'Employer', status: 'Active', date: '20-04-2026' },
        { name: 'Ricardo S.', email: 'r.s@gmail.com', type: 'Candidate', status: 'Pending', date: '19-04-2026' },
        { name: 'Finabank Suriname', email: 'careers@finabank.sr', type: 'Employer', status: 'Active', date: '18-04-2026' },
      ];

      if (currentUser?.email) {
        demoUsers.unshift({
          name: currentUser.name || currentUser.companyName || 'Admin Operator',
          email: currentUser.email,
          type: getCurrentUserType(currentUser),
          status: 'Active',
          date: 'Vandaag'
        });
      }
      const visibleUsers = [...demoUsers, ...extraUsers].filter((user) => !hiddenUsers.includes(user.email.toLowerCase()));
      setUsers(visibleUsers);

      // Sync Job List
      const jobStatusOverrides = readJson<Record<string, Exclude<JobStatus, 'Alle'>>>('suri_admin_job_status_overrides', {});
      const demoJobs: AdminJob[] = [
        { id: 'demo-ux', title: 'Senior UX Designer', company: 'Telesur', apps: 42, trends: '+5', status: 'Open' },
        { id: 'demo-drilling', title: 'Drilling Engineer', company: 'Staatsolie', apps: 12, trends: '+2', status: 'Paused' },
        { id: 'demo-support', title: 'Customer Support Lead', company: 'Finabank', apps: 156, trends: '+24', status: 'Open' }
      ].map((job) => ({ ...job, status: jobStatusOverrides[job.id] || job.status }));
      const combinedJobs = [
        ...demoJobs,
        ...storedJobs.map((j: any) => ({
          id: String(j.id),
          title: j.title,
          company: j.company,
          apps: storedApps.filter((a: any) => a.jobId === j.id).length,
          trends: 'Nieuw',
          status: (j.status || 'Open') as Exclude<JobStatus, 'Alle'>
        }))
      ].filter((job) => !hiddenJobs.includes(String(job.id)));
      setJobs(combinedJobs);
      setApplicationCount(storedApps.length);

      setLoading(false);
    };

    loadAdminData();
    window.addEventListener('storage', loadAdminData);
    const interval = setTimeout(() => setLoading(false), 800);
    return () => {
      clearTimeout(interval);
      window.removeEventListener('storage', loadAdminData);
    };
  }, []);

  const stats = useMemo(() => {
    const pendingVerifications = users.filter((user) => user.status === 'Pending').length;
    const dynamicRevenueSRD = BASE_DAILY_REVENUE_SRD + Math.max(0, jobs.length - 3) * JOB_REVENUE_MULTIPLIER;
    const dynamicRevenueEUR = Math.round(dynamicRevenueSRD / 38.3);

    return {
      totalUsers: BASE_TOTAL_USERS + users.length,
      activeJobs: BASE_ACTIVE_JOBS + jobs.length,
      totalApplications: BASE_TOTAL_APPLICATIONS + applicationCount,
      pendingVerifications,
      dailyRevenueSRD: dynamicRevenueSRD,
      dailyRevenueEUR: dynamicRevenueEUR,
    };
  }, [applicationCount, jobs.length, users]);

  useEffect(() => {
    writeJson('suri_admin_moderation_queue', moderationQueue);
  }, [moderationQueue]);

  useEffect(() => {
    writeJson('suri_admin_system_health', systemHealth);
  }, [systemHealth]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'SURILOGS2026') {
      setIsAuthorized(true);
      setAuthError(false);
      sessionStorage.setItem('suri_admin_auth', 'true');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const triggerNotify = (msg: string) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadActivityLog = () => {
    const lines = RECENT_ACTIVITY.map((entry) => `${entry.time} | ${entry.action} | ${entry.target}`);
    downloadFile(`surijobs-activity-log-${new Date().toISOString().slice(0, 10)}.txt`, lines.join('\n'));
    triggerNotify('Activity log gedownload');
  };

  const downloadSecurityAudit = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      status: 'healthy',
      summary: 'Geen kritieke beveiligingsmeldingen die directe actie vereisen.',
      checks: [
        { name: 'Platform status', result: 'ok' },
        { name: 'Suspicious activity', result: 'none detected' },
        { name: 'Pending verifications', result: stats.pendingVerifications },
      ],
    };
    downloadFile(
      `surijobs-security-audit-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(report, null, 2),
      'application/json;charset=utf-8'
    );
    triggerNotify('Security audit rapport gedownload');
  };

  const exportFinancialReport = () => {
    const rows = [
      ['metric', 'value'],
      ['daily_revenue_srd', String(stats.dailyRevenueSRD)],
      ['daily_revenue_eur', String(stats.dailyRevenueEUR)],
      ['total_users', String(stats.totalUsers)],
      ['active_jobs', String(stats.activeJobs)],
      ['total_applications', String(stats.totalApplications)],
    ];
    downloadFile(
      `surijobs-financial-report-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((row) => row.join(',')).join('\n'),
      'text/csv;charset=utf-8'
    );
    triggerNotify('Financieel rapport geëxporteerd');
  };

  const downloadDatabaseBackup = () => {
    if (typeof window === 'undefined') return;
    const snapshot = {
      generatedAt: new Date().toISOString(),
      jobs: JSON.parse(localStorage.getItem('suri_jobs') || '[]'),
      applications: JSON.parse(localStorage.getItem('suri_applications') || '[]'),
      user: JSON.parse(localStorage.getItem('suri_user') || 'null'),
    };
    downloadFile(
      `surijobs-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(snapshot, null, 2),
      'application/json;charset=utf-8'
    );
    triggerNotify('Database backup gedownload');
  };

  const handleDeleteUser = (email: string) => {
    const normalizedEmail = email.toLowerCase();
    const hiddenUsers = readJson<string[]>('suri_admin_hidden_users', []);
    writeJson('suri_admin_hidden_users', [...new Set([...hiddenUsers, normalizedEmail])]);
    const customUsers = readJson<AdminUser[]>('suri_admin_users', []).filter((user) => user.email.toLowerCase() !== normalizedEmail);
    writeJson('suri_admin_users', customUsers);
    setUsers(prev => prev.filter(u => u.email.toLowerCase() !== normalizedEmail));
    triggerNotify("Gebruiker permanent verwijderd");
  };

  const handleDeleteJob = (jobId: string, title: string) => {
    const hiddenJobs = readJson<string[]>('suri_admin_hidden_jobs', []);
    writeJson('suri_admin_hidden_jobs', [...new Set([...hiddenJobs, jobId])]);
    const updatedStoredJobs = readJson<any[]>('suri_jobs', []).filter((job) => String(job.id) !== jobId);
    writeJson('suri_jobs', updatedStoredJobs);
    const currentOverrides = readJson<Record<string, Exclude<JobStatus, 'Alle'>>>('suri_admin_job_status_overrides', {});
    const { [jobId]: _removedStatus, ...remainingOverrides } = currentOverrides;
    writeJson('suri_admin_job_status_overrides', remainingOverrides);
    setJobs(prev => prev.filter(j => String(j.id) !== jobId));
    setSelectedJob(null);
    triggerNotify(`Vacature "${title}" verwijderd uit monitor`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!userForm.name.trim()) nextErrors.user_name = 'Naam is verplicht.';
    if (!isValidEmail(userForm.email)) nextErrors.user_email = 'Voer een geldig e-mailadres in.';
    if (users.some((user) => user.email.toLowerCase() === userForm.email.toLowerCase())) {
      nextErrors.user_email = 'Deze gebruiker bestaat al.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setAdminErrors(nextErrors);
      return;
    }

    const newUser = {
      name: userForm.name.trim(),
      email: userForm.email.toLowerCase(),
      type: userForm.type,
      status: userForm.status,
      date: 'Vandaag'
    };
    const customUsers = [newUser, ...readJson<AdminUser[]>('suri_admin_users', [])];
    writeJson('suri_admin_users', customUsers);
    setUsers((prev) => [newUser, ...prev]);
    setUserForm({ name: '', email: '', type: 'Candidate', status: 'Active', date: 'Vandaag' });
    setAdminErrors({});
    setShowCreateUserModal(false);
    triggerNotify('Nieuwe gebruiker toegevoegd');
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!jobForm.title.trim()) nextErrors.job_title = 'Titel is verplicht.';
    if (!jobForm.company.trim()) nextErrors.job_company = 'Bedrijf is verplicht.';
    if (Object.keys(nextErrors).length > 0) {
      setAdminErrors(nextErrors);
      return;
    }

    const newJob = {
      id: Date.now(),
      title: jobForm.title.trim(),
      company: jobForm.company.trim(),
      location: 'Paramaribo',
      salary: 'Bespreekbaar',
      description: 'Handmatig toegevoegd door admin.',
      status: jobForm.status,
    };
    const storedJobs = [newJob, ...readJson<any[]>('suri_jobs', [])];
    writeJson('suri_jobs', storedJobs);
    setJobs((prev) => [{ id: String(newJob.id), title: newJob.title, company: newJob.company, apps: 0, trends: 'Nieuw', status: newJob.status }, ...prev]);
    setJobForm({ title: '', company: '', status: 'Open' });
    setAdminErrors({});
    setShowCreateJobModal(false);
    triggerNotify('Nieuwe vacature toegevoegd');
  };

  const handleJobStatusChange = (jobId: string, status: string) => {
    const nextStatus = status as Exclude<JobStatus, 'Alle'>;
    setJobs((prev) => prev.map((job) => String(job.id) === jobId ? { ...job, status: nextStatus } : job));
    const storedJobs = readJson<any[]>('suri_jobs', []).map((job) => String(job.id) === jobId ? { ...job, status: nextStatus } : job);
    writeJson('suri_jobs', storedJobs);
    const currentOverrides = readJson<Record<string, Exclude<JobStatus, 'Alle'>>>('suri_admin_job_status_overrides', {});
    writeJson('suri_admin_job_status_overrides', { ...currentOverrides, [jobId]: nextStatus });
    setSelectedJob((prev) => prev ? { ...prev, status: nextStatus } : null);
    triggerNotify(`Vacaturestatus bijgewerkt naar ${nextStatus}`);
  };

  const handleModerationAction = (caseId: string, action: 'resolved' | 'escalated' | 'removed') => {
    setModerationQueue((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: action === 'resolved' ? 'Resolved' : action === 'escalated' ? 'Escalated' : 'Removed',
            }
          : item
      )
    );
    triggerNotify(
      action === 'resolved'
        ? 'Moderation case afgehandeld'
        : action === 'escalated'
          ? 'Case geëscaleerd naar security'
          : 'Target verwijderd uit review queue'
    );
  };

  const closeCreateUserModal = () => {
    setShowCreateUserModal(false);
    setAdminErrors((prev) => {
      const next = { ...prev };
      delete next.user_name;
      delete next.user_email;
      return next;
    });
    setUserForm({ name: '', email: '', type: 'Candidate', status: 'Active', date: 'Vandaag' });
  };

  const closeCreateJobModal = () => {
    setShowCreateJobModal(false);
    setAdminErrors((prev) => {
      const next = { ...prev };
      delete next.job_title;
      delete next.job_company;
      return next;
    });
    setJobForm({ title: '', company: '', status: 'Open' });
  };

  const refreshSystemHealth = () => {
    const nextLatency = 35 + Math.floor(Math.random() * 18);
    const nextStorage = Math.min(86, Math.max(28, systemHealth.storagePct + (Math.random() > 0.5 ? 1 : -1)));
    const nextWebhook = Math.min(99, Math.max(92, systemHealth.webhookSuccessPct + (Math.random() > 0.5 ? 1 : -1)));
    const nextQueue = moderationQueue.filter((item) => item.status === 'Open').length;
    setSystemHealth({
      platform: nextLatency > 55 ? 'Degraded' : 'Healthy',
      uptime: systemHealth.uptime,
      latencyMs: nextLatency,
      storagePct: nextStorage,
      webhookSuccessPct: nextWebhook,
      queueDepth: nextQueue,
      backups: 'Up-to-date',
      lastAuditAt: new Date().toISOString(),
    });
    triggerNotify('System health vernieuwd');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const queryMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = userFilters.type === 'Alle' || user.type === userFilters.type;
      const statusMatch = userFilters.status === 'Alle' || user.status === userFilters.status;
      return queryMatch && typeMatch && statusMatch;
    });
  }, [searchQuery, userFilters, users]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const queryMatch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = jobFilters.status === 'Alle' || job.status === jobFilters.status;
      return queryMatch && statusMatch;
    });
  }, [jobFilters.status, jobs, searchQuery]);

  const filteredModerationQueue = useMemo(() => {
    return moderationQueue.filter((item) => moderationFilter === 'Alle' || item.status === moderationFilter);
  }, [moderationFilter, moderationQueue]);

  const systemLogEntries = useMemo(() => {
    return [
      `AUTH_OK | ${new Date().toLocaleTimeString('nl-NL')} | Admin sessie actief`,
      `USERS_SYNC | ${users.length} accounts gesynchroniseerd`,
      `JOBS_SYNC | ${jobs.length} vacatures geladen`,
      `APPLICATIONS_SYNC | ${stats.totalApplications} totale sollicitaties`,
      `HEALTHCHECK | platform status ${systemHealth.platform.toLowerCase()}`,
      `WEBHOOKS | success rate ${systemHealth.webhookSuccessPct}%`,
      `MODERATION | open cases ${moderationQueue.filter((item) => item.status === 'Open').length}`,
    ];
  }, [jobs.length, moderationQueue, stats.totalApplications, systemHealth.platform, systemHealth.webhookSuccessPct, users.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <Database className="w-16 h-16 text-blue-500 animate-pulse mb-8" />
        <div className="text-white font-black uppercase tracking-[0.5em] text-xs">SuriJobs+ Admin Panel Booting...</div>
        <div className="w-64 h-2 bg-slate-900 mt-8 relative overflow-hidden">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-1/2 h-full bg-blue-600"
          />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white border-8 border-slate-200 p-12 brutal-shadow"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-1">System <span className="text-blue-600">Access</span></h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restricted Area — SuriJobs Internal</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Token</label>
              <input 
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="********"
                className={cn(
                  "w-full bg-slate-50 border-4 p-4 font-black tracking-widest transition-all outline-none",
                  authError ? "border-red-500" : "border-black focus:bg-white"
                )}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-black text-white py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] active:scale-95"
            >
              Verify Identity
            </button>
          </form>
          {authError && (
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-600">
              Ongeldige admin toegangscode.
            </p>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center opacity-40">
            <div className="text-[8px] font-black uppercase tracking-widest italic">SuriJobs Core v2.4</div>
            <Database className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col lg:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-black text-white shrink-0 flex flex-col border-r-8 border-slate-200">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-black">S</div>
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Admin <span className="text-blue-500">Workspace</span></h1>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Internal Management v2.0</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'overview', icon: BarChart3, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'User Manager' },
            { id: 'jobs', icon: Briefcase, label: 'Job Monitor' },
            { id: 'revenue', icon: TrendingUp, label: 'Revenue Analytics' },
            { id: 'moderation', icon: AlertTriangle, label: 'Moderation' },
            { id: 'system', icon: ShieldCheck, label: 'System Health' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 font-black uppercase tracking-widest text-[10px] transition-all group relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {item.label}
              {activeTab === item.id && (
                <div className="absolute right-0 top-0 h-full w-2 bg-white" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black border-2 border-blue-500 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)]">A</div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest">Admin User</div>
              <div className="text-[8px] font-bold text-slate-500 uppercase">System Root</div>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full border-2 border-white/10 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Verlaat Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        
        {/* Top Header */}
        <header className="bg-white border-b-8 border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-50">
          <AnimatePresence>
            {showNotification && (
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] brutal-shadow z-[60] flex items-center gap-3 border-4 border-black"
              >
                <CheckCircle2 className="w-4 h-4" />
                {notificationMsg}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ZOEK GEBRUIKERS, JOBS OF TRANSACTIES..."
              className="w-full bg-slate-50 border-4 border-black p-4 pl-12 font-black uppercase tracking-tight text-xs outline-none focus:bg-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", systemHealth.platform === 'Healthy' ? "bg-emerald-500" : "bg-yellow-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System {systemHealth.platform}</span>
             </div>
             <div className="h-10 w-[1px] bg-slate-200" />
             <button 
               onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
               className="bg-black text-white p-3 brutal-shadow relative"
             >
                <Globe className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                   {[
                     { label: 'Total Users', val: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', trend: '+12%', up: true },
                     { label: 'Active Jobs', val: stats.activeJobs.toLocaleString(), icon: Briefcase, color: 'text-emerald-600', trend: '+5%', up: true },
                     { label: 'Pending Verifications', val: stats.pendingVerifications.toLocaleString(), icon: Clock, color: 'text-orange-600', trend: '+8%', up: true },
                     { label: 'Applications', val: stats.totalApplications.toLocaleString(), icon: Database, color: 'text-purple-600', trend: '-2%', up: false },
                     { 
                       label: 'Daily Revenue', 
                       val: `SRD ${stats.dailyRevenueSRD.toLocaleString()}`, 
                       subVal: `€${stats.dailyRevenueEUR.toLocaleString()}`,
                       icon: TrendingUp, 
                       color: 'text-yellow-600', 
                       trend: '+24%', 
                       up: true 
                     },
                   ].map((stat: any, i) => (
                     <div 
                       key={i}
                       className="bg-white border-4 border-black p-6 brutal-shadow group hover:-translate-y-1 transition-all"
                     >
                       <div className="flex justify-between items-start mb-4">
                         <div className={cn("p-3 border-2 border-black", stat.color.replace('text-', 'bg-').replace('600', '50'))}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                         </div>
                         <div className={cn("flex items-center gap-1 text-[10px] font-black", stat.up ? "text-emerald-600" : "text-red-500")}>
                            {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {stat.trend}
                         </div>
                       </div>
                       <div className="text-3xl font-black italic tracking-tighter leading-none">{stat.val}</div>
                       {stat.subVal && (
                         <div className="text-sm font-black text-blue-600 italic tracking-tighter mt-1 mb-2">
                            {stat.subVal} <span className="text-[8px] uppercase not-italic align-middle ml-1 text-slate-400">Est.</span>
                         </div>
                       )}
                       {!stat.subVal && <div className="mb-4" />}
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                     </div>
                   ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-8 bg-white border-8 border-black p-10 brutal-shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic">Platform Growth</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inlog-activiteit & Omzet monitoring</p>
                        </div>
                        <select 
                          value={revenuePeriod}
                          onChange={(e) => setRevenuePeriod(e.target.value)}
                          className="bg-slate-50 border-2 border-black p-2 text-[10px] font-black uppercase outline-none cursor-pointer"
                        >
                           <option value="7">Laatste 7 dagen</option>
                           <option value="30">Laatste 30 dagen</option>
                        </select>
                      </div>
                      <div className="h-[350px] w-full">
                         <ChartFrame className="h-full w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={REVENUE_SERIES[revenuePeriod] || USERS_GROWTH}>
                                <defs>
                                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fontWeight: 900 }}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip />
                                <Area 
                                  type="monotone" 
                                  dataKey="users" 
                                  stroke="#2563eb" 
                                  strokeWidth={6}
                                  fillOpacity={1} 
                                  fill="url(#colorUsers)" 
                                />
                              </AreaChart>
                           </ResponsiveContainer>
                         </ChartFrame>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 -skew-x-12 translate-x-1/2 -translate-y-1/2" />
                  </div>

                  <div className="col-span-12 lg:col-span-4 bg-white border-8 border-black p-10 brutal-shadow-lg">
                      <h3 className="text-xl font-black uppercase tracking-tight italic mb-8 border-b-4 border-blue-600 w-fit pb-1">Bedrijfs Abonnementen</h3>
                      <div className="h-[250px] w-full mb-8">
                         <ChartFrame className="h-full w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={PLAN_DISTRIBUTION}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {PLAN_DISTRIBUTION.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                         </ChartFrame>
                      </div>
                      <div className="space-y-4">
                         {PLAN_DISTRIBUTION.map((p, i) => (
                           <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border-2 border-transparent hover:border-black transition-all group">
                              <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: COLORS[i] }} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-black italic">{p.value} users</span>
                           </div>
                         ))}
                      </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="grid grid-cols-12 gap-8">
                   <div className="col-span-12 lg:col-span-7 bg-white border-4 border-black brutal-shadow overflow-hidden">
                      <div className="p-6 border-b-4 border-black flex justify-between items-center bg-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest italic">Live Activity Feed</h3>
                        <button onClick={downloadActivityLog} className="text-[8px] font-black uppercase tracking-widest text-blue-600 hover:underline">Download Log</button>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                           <thead className="bg-slate-900 text-white text-[9px] uppercase tracking-widest">
                             <tr>
                               <th className="p-4">Event</th>
                               <th className="p-4">Target Entity</th>
                               <th className="p-4">Timestamp</th>
                               <th className="p-4">Status</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 italic">
                              {RECENT_ACTIVITY.map((act) => (
                                <tr key={act.id} className="hover:bg-blue-50 transition-colors group">
                                  <td className="p-4">
                                     <div className="text-[10px] font-black uppercase tracking-tight group-hover:text-blue-600">{act.action}</div>
                                  </td>
                                  <td className="p-4">
                                     <div className="text-[10px] font-bold text-slate-500 uppercase">{act.target}</div>
                                  </td>
                                  <td className="p-4">
                                     <div className="text-[10px] font-black text-slate-400 uppercase">{act.time}</div>
                                  </td>
                                  <td className="p-4 text-emerald-500">
                                     <CheckCircle2 className="w-4 h-4" />
                                  </td>
                                </tr>
                              ))}
                           </tbody>
                         </table>
                      </div>
                      <div className="p-4 bg-slate-50 text-center border-t-4 border-black">
                         <button onClick={() => setShowActivityModal(true)} className="text-[10px] font-black uppercase tracking-widest hover:underline">Bekijk alle activity logs</button>
                      </div>
                   </div>

                   <div className="col-span-12 lg:col-span-5 space-y-8">
                      <div className="bg-red-600 text-white p-8 border-4 border-black brutal-shadow relative overflow-hidden group">
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                               <AlertTriangle className="w-6 h-6 animate-bounce" />
                               <h4 className="text-xl font-black uppercase tracking-tighter italic">Critical Security Alerts</h4>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-8 leading-relaxed opacity-80">
                               Er zijn momenteel geen kritieke beveiligingsmeldingen die onmiddellijke actie vereisen voor de Surinaamse regio.
                            </p>
                            <button 
                              onClick={downloadSecurityAudit}
                              className="w-full bg-black text-white py-4 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all"
                            >
                               Security Audit Starten
                            </button>
                         </div>
                         <ShieldCheck className="absolute -bottom-12 -right-12 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform" />
                      </div>

                      <div className="bg-white border-4 border-black p-8 brutal-shadow relative overflow-hidden">
                         <h3 className="text-sm font-black uppercase tracking-widest italic mb-6">Database Health</h3>
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Storage Capacity</span>
                                  <span>{systemHealth.storagePct}%</span>
                               </div>
                               <div className="h-2 bg-slate-100 border border-black overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${systemHealth.storagePct}%` }}
                                    className="h-full bg-blue-600" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Active IOPS</span>
                                  <span>{Math.max(8, Math.round(systemHealth.latencyMs / 4))}%</span>
                               </div>
                               <div className="h-2 bg-slate-100 border border-black overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(8, Math.round(systemHealth.latencyMs / 4))}%` }}
                                    className="h-full bg-emerald-500" 
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border-8 border-black p-10 brutal-shadow-lg space-y-8"
              >
                <div className="flex justify-between items-center border-b-4 border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Gebruikersbeheer</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totaal: {users.length} geregistreerde accounts</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowUserFilters((prev) => !prev)}
                      className="border-4 border-black px-6 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50"
                    >
                       <Filter className="w-3 h-3" /> Filters
                    </button>
                    <button 
                      onClick={() => setShowCreateUserModal(true)}
                      className="bg-blue-600 text-white px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                       + Gebruiker
                    </button>
                  </div>
                </div>

                {showUserFilters && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <select value={userFilters.type} onChange={(e) => setUserFilters((prev) => ({ ...prev, type: e.target.value as UserFilterType }))} className="p-3 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-white">
                      {USER_FILTER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={userFilters.status} onChange={(e) => setUserFilters((prev) => ({ ...prev, status: e.target.value as UserStatus }))} className="p-3 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-white">
                      {USER_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-6">
                   {filteredUsers.map((u) => (
                     <div key={u.email} className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-slate-100 hover:border-black transition-all bg-white relative group">
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                           <div className="w-12 h-12 bg-slate-900 text-blue-400 flex items-center justify-center font-black italic">{u.name[0]}</div>
                           <div>
                              <div className="text-xl font-black uppercase tracking-tight italic group-hover:text-blue-600 leading-none mb-1">{u.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                 <span>{u.email}</span>
                                 <span className="text-slate-200">|</span>
                                 <span className={cn(u.type === 'Candidate' ? "text-blue-500" : "text-purple-600")}>{u.type}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 w-full md:w-auto">
                           <div className="text-right hidden md:block">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Geregistreerd</div>
                              <div className="text-[11px] font-black">{u.date}</div>
                           </div>
                           <div className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest", u.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700")}>
                              {u.status}
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  window.location.href = u.type === 'Candidate' ? '/dashboard/candidate' : '/dashboard/company';
                                }}
                                className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                              >
                                 <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.email)}
                                className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:border-red-600 hover:text-red-600 transition-colors"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                   {filteredUsers.length === 0 && (
                     <div className="border-2 border-dashed border-slate-200 p-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       Geen gebruikers gevonden voor deze filters.
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'jobs' && (
              <motion.div
                key="jobs-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border-8 border-black p-10 brutal-shadow-lg space-y-8"
              >
                <div className="flex justify-between items-center border-b-4 border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Vacature Monitor</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actieve vacatures op het platform</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowJobFilters((prev) => !prev)}
                      className="border-4 border-black px-6 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50"
                    >
                      <Filter className="w-3 h-3" /> Filters
                    </button>
                    <button 
                      onClick={() => setShowCreateJobModal(true)}
                      className="bg-emerald-600 text-white px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                       + Handmatige Job
                    </button>
                  </div>
                </div>

                {showJobFilters && (
                  <div className="grid md:grid-cols-1 gap-4">
                    <select value={jobFilters.status} onChange={(e) => setJobFilters({ status: e.target.value as JobStatus })} className="p-3 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-white">
                      {JOB_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-6">
                   {filteredJobs.map((j) => (
                     <div key={j.id} className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-slate-100 hover:border-black transition-all bg-white group">
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                           <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center text-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <Briefcase className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="text-xl font-black uppercase tracking-tight italic group-hover:text-blue-600 leading-none mb-1">{j.title}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{j.company}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-12 w-full md:w-auto">
                           <div className="text-center">
                              <div className="text-xl font-black italic tracking-tighter leading-none">{j.apps}</div>
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sollicitaties</div>
                           </div>
                           <div className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-2", j.status === 'Open' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200")}>
                              {j.status}
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedJob(j)}
                                className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                              >
                                 <MoreHorizontal className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteJob(String(j.id), j.title)}
                                className="w-10 h-10 border-2 border-slate-100 flex items-center justify-center hover:border-red-600 hover:text-red-600 transition-colors"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                   {filteredJobs.length === 0 && (
                     <div className="border-2 border-dashed border-slate-200 p-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       Geen vacatures gevonden voor deze filters.
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'revenue' && (
              <motion.div
                key="revenue-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="bg-white border-8 border-black p-10 brutal-shadow-lg">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic">Omzet Analyse</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financiële monitoring en voorspellingen</p>
                    </div>
                    <button 
                      onClick={exportFinancialReport}
                      className="bg-yellow-500 text-black px-6 py-2 text-[9px] font-black uppercase tracking-widest brutal-shadow border-4 border-black"
                    >
                      Export Financials
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-slate-900 text-white p-8 border-4 border-black">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">Daily SRD</div>
                      <div className="text-4xl font-black italic tracking-tighter text-yellow-500">SRD {stats.dailyRevenueSRD.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-8 border-4 border-black">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Daily Est. EUR</div>
                      <div className="text-4xl font-black italic tracking-tighter text-blue-600">€{stats.dailyRevenueEUR.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="h-[400px] w-full bg-slate-50 p-6 border-4 border-black border-dashed">
                    <ChartFrame className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={USERS_GROWTH}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fill="#3b82f6" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartFrame>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'moderation' && (
              <motion.div
                key="moderation-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border-8 border-black p-10 brutal-shadow-lg space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-4 border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Moderation Queue</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review cases voor reports, verificaties en verdachte content</p>
                  </div>
                  <div className="flex gap-3">
                    {MODERATION_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setModerationFilter(option)}
                        className={cn(
                          "px-4 py-2 border-2 border-black text-[9px] font-black uppercase tracking-widest",
                          moderationFilter === option ? "bg-black text-white" : "bg-white hover:bg-slate-50"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border-2 border-black p-4 bg-slate-50">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Open Cases</div>
                    <div className="text-3xl font-black tracking-tighter">{moderationQueue.filter((item) => item.status === 'Open').length}</div>
                  </div>
                  <div className="border-2 border-black p-4 bg-slate-50">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Escalated</div>
                    <div className="text-3xl font-black tracking-tighter">{moderationQueue.filter((item) => item.status === 'Escalated').length}</div>
                  </div>
                  <div className="border-2 border-black p-4 bg-slate-50">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Resolved Today</div>
                    <div className="text-3xl font-black tracking-tighter">{moderationQueue.filter((item) => item.status === 'Resolved').length}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredModerationQueue.map((item) => (
                    <div key={item.id} className="border-2 border-black p-5 bg-white">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 border-2 border-black bg-slate-50">{item.type}</span>
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-1 border-2", item.severity === 'Hoog' ? "border-red-500 text-red-600 bg-red-50" : item.severity === 'Middel' ? "border-yellow-500 text-yellow-700 bg-yellow-50" : "border-blue-500 text-blue-600 bg-blue-50")}>{item.severity}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.status}</span>
                          </div>
                          <div className="text-lg font-black uppercase tracking-tight italic">{item.target}</div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">{item.reason}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleModerationAction(item.id, 'resolved')} className="border-2 border-black px-4 py-2 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-50">Resolve</button>
                          <button onClick={() => handleModerationAction(item.id, 'escalated')} className="border-2 border-black px-4 py-2 text-[8px] font-black uppercase tracking-widest hover:bg-yellow-50">Escalate</button>
                          <button onClick={() => handleModerationAction(item.id, 'removed')} className="border-2 border-black px-4 py-2 text-[8px] font-black uppercase tracking-widest hover:bg-red-50">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredModerationQueue.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 p-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Geen moderation cases in deze status.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white border-8 border-black p-10 brutal-shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic">System Health</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realtime platform status, storage en delivery health</p>
                    </div>
                    <button onClick={refreshSystemHealth} className="bg-black text-white px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                      Refresh Health
                    </button>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <div className="border-2 border-black p-4 bg-slate-50">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Platform</div>
                      <div className="text-2xl font-black uppercase tracking-tight">{systemHealth.platform}</div>
                    </div>
                    <div className="border-2 border-black p-4 bg-slate-50">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Latency</div>
                      <div className="text-2xl font-black uppercase tracking-tight">{systemHealth.latencyMs}ms</div>
                    </div>
                    <div className="border-2 border-black p-4 bg-slate-50">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Webhook Success</div>
                      <div className="text-2xl font-black uppercase tracking-tight">{systemHealth.webhookSuccessPct}%</div>
                    </div>
                    <div className="border-2 border-black p-4 bg-slate-50">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Open Queue</div>
                      <div className="text-2xl font-black uppercase tracking-tight">{systemHealth.queueDepth}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="border-4 border-black p-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Resource Usage</div>
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                            <span>Storage</span>
                            <span>{systemHealth.storagePct}%</span>
                          </div>
                          <div className="h-3 border-2 border-black bg-slate-100 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${systemHealth.storagePct}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                            <span>Webhook Delivery</span>
                            <span>{systemHealth.webhookSuccessPct}%</span>
                          </div>
                          <div className="h-3 border-2 border-black bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${systemHealth.webhookSuccessPct}%` }} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="border-4 border-black p-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Operational Checks</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-2 border-slate-100 p-3 bg-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest">Backups</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{systemHealth.backups}</span>
                        </div>
                        <div className="flex justify-between items-center border-2 border-slate-100 p-3 bg-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest">Uptime</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">{systemHealth.uptime}</span>
                        </div>
                        <div className="flex justify-between items-center border-2 border-slate-100 p-3 bg-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest">Laatste Audit</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">{new Date(systemHealth.lastAuditAt).toLocaleString('nl-NL')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="bg-black text-white p-12 border-t-8 border-slate-200 mt-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 mb-12">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-black">S</div>
                  <h1 className="text-xl font-black uppercase tracking-tighter italic">SuriJobs+ <span className="text-blue-500">Admin</span></h1>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed italic pr-12">
                  Toegewijde interne tool voor het monitoren en beheren van het grootste vacatureplatform van Suriname.
                </p>
             </div>
             <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2">Technical Health</h4>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                   <span className="text-slate-400">Server Uptime</span>
                   <span className="text-emerald-500">99.98%</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                   <span className="text-slate-400">Latency (Local)</span>
                   <span className="text-blue-400">42ms</span>
                </div>
             </div>
             <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2">Admin Actions</h4>
                <button 
                  onClick={() => setShowSystemLogsModal(true)}
                  className="text-[10px] font-black uppercase text-blue-400 hover:underline block"
                >
                  System Logs
                </button>
                <button 
                  onClick={downloadDatabaseBackup}
                  className="text-[10px] font-black uppercase text-blue-400 hover:underline block"
                >
                  Backup Database
                </button>
                <button 
                  type="button"
                  disabled
                  title="Emergency stop is uitgeschakeld in deze demo-omgeving"
                  className="text-[10px] font-black uppercase text-slate-500 block text-red-500 cursor-not-allowed"
                >
                  Emergency Stop
                </button>
             </div>
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-center pt-8 border-t border-white/5 opacity-30">
             CONFIDENTIAL — STRICTLY FOR INTERNAL SURITOPS STAFF ONLY — © 2026
          </div>
        </footer>

      </main>

      {showCreateUserModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={closeCreateUserModal} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg relative z-10 border-4 border-black p-8">
            <button onClick={closeCreateUserModal} className="absolute top-4 right-4 p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">Nieuwe Gebruiker</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input value={userForm.name} onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Naam" className="w-full p-4 border-2 border-black font-black uppercase text-xs" />
              {adminErrors.user_name && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{adminErrors.user_name}</p>}
              <input value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-mailadres" className="w-full p-4 border-2 border-black font-black uppercase text-xs" />
              {adminErrors.user_email && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{adminErrors.user_email}</p>}
              <div className="grid grid-cols-2 gap-4">
                <select value={userForm.type} onChange={(e) => setUserForm((prev) => ({ ...prev, type: e.target.value as Exclude<UserFilterType, 'Alle'> }))} className="p-4 border-2 border-black font-black uppercase text-xs bg-white">
                  <option>Candidate</option>
                  <option>Employer</option>
                </select>
                <select value={userForm.status} onChange={(e) => setUserForm((prev) => ({ ...prev, status: e.target.value as Exclude<UserStatus, 'Alle'> }))} className="p-4 border-2 border-black font-black uppercase text-xs bg-white">
                  <option>Active</option>
                  <option>Pending</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Opslaan</button>
            </form>
          </motion.div>
        </div>
      )}

      {showCreateJobModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={closeCreateJobModal} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg relative z-10 border-4 border-black p-8">
            <button onClick={closeCreateJobModal} className="absolute top-4 right-4 p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">Nieuwe Vacature</h3>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <input value={jobForm.title} onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Functietitel" className="w-full p-4 border-2 border-black font-black uppercase text-xs" />
              {adminErrors.job_title && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{adminErrors.job_title}</p>}
              <input value={jobForm.company} onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))} placeholder="Bedrijf" className="w-full p-4 border-2 border-black font-black uppercase text-xs" />
              {adminErrors.job_company && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{adminErrors.job_company}</p>}
              <select value={jobForm.status} onChange={(e) => setJobForm((prev) => ({ ...prev, status: e.target.value as Exclude<JobStatus, 'Alle'> }))} className="w-full p-4 border-2 border-black font-black uppercase text-xs bg-white">
                <option>Open</option>
                <option>Paused</option>
              </select>
              <button type="submit" className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Vacature Toevoegen</button>
            </form>
          </motion.div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowActivityModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto relative z-10 border-4 border-black p-8">
            <button onClick={() => setShowActivityModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">Activity Logs</h3>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((entry) => (
                <div key={entry.id} className="border-2 border-slate-100 p-4 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-widest">{entry.action}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2">{entry.target} • {entry.time}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {showSystemLogsModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowSystemLogsModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto relative z-10 border-4 border-black p-8">
            <button onClick={() => setShowSystemLogsModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">System Logs</h3>
            <div className="space-y-3">
              {systemLogEntries.map((entry) => (
                <pre key={entry} className="border-2 border-slate-100 bg-slate-50 p-4 text-[10px] font-black uppercase tracking-tight whitespace-pre-wrap">{entry}</pre>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedJob(null)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md relative z-10 border-4 border-black p-8">
            <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">{selectedJob.title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{selectedJob.company}</p>
            <div className="space-y-3">
              <button onClick={() => handleJobStatusChange(String(selectedJob.id), selectedJob.status === 'Open' ? 'Paused' : 'Open')} className="w-full border-2 border-black py-4 font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                {selectedJob.status === 'Open' ? 'Pauzeer vacature' : 'Activeer vacature'}
              </button>
              <button onClick={() => { setSelectedJob(null); window.location.href = '/vacatures'; }} className="w-full border-2 border-black py-4 font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                Bekijk in platform
              </button>
              <button onClick={() => handleDeleteJob(String(selectedJob.id), selectedJob.title)} className="w-full bg-red-600 text-white py-4 font-black uppercase tracking-widest hover:bg-black transition-all">
                Verwijder vacature
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
