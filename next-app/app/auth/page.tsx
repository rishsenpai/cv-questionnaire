'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Lock,
  Mail,
  Smartphone,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { readJson, writeJson } from '@/lib/storage';
import { isValidEmail } from '@/lib/validation';

function getNextLocalUserId(existingUsers: Array<{ id?: number | string }>) {
  const numericIds = existingUsers
    .map((user) => Number(user.id))
    .filter((id) => Number.isFinite(id));

  return (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const router = useRouter();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof formErrors = {};
    const email = formValues.email.trim().toLowerCase();
    const password = formValues.password;

    if (!isValidEmail(email)) nextErrors.email = 'Voer een geldig e-mailadres in.';
    if (password.length < 8) nextErrors.password = 'Gebruik minimaal 8 tekens.';

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    setTimeout(() => {
      const storedUsers = readJson<any[]>('suri_users', []);
      const existingUser = storedUsers.find((user) => String(user.email || '').trim().toLowerCase() === email);

      const userData = existingUser
        ? { ...existingUser, email, isLoggedIn: true }
        : {
            id: getNextLocalUserId(storedUsers),
            role,
            name: role === 'candidate' ? 'Jurgen Dijkstra' : 'SuriTech Corp',
            email,
            isLoggedIn: true,
            onboarded: false,
          };

      const nextUsers = existingUser
        ? storedUsers.map((storedUser) => (storedUser.id === existingUser.id ? userData : storedUser))
        : [userData, ...storedUsers];

      writeJson('suri_users', nextUsers);
      writeJson('suri_user', userData);
      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        if (!userData.onboarded) {
          router.push('/onboarding');
        } else if (userData.role === 'candidate') {
          router.push('/dashboard/candidate');
        } else {
          router.push('/dashboard/company');
        }
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-20 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 bg-white border-4 border-black shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] relative z-10"
      >
        {/* Left Side: Branding & Context */}
        <div className="bg-black text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-12 hover:text-blue-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Terug naar Home</span>
            </Link>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
              SuriJobs<span className="text-blue-600 italic">+</span>
            </h1>
            <p className="text-xl font-bold text-slate-400 uppercase tracking-tight italic max-w-sm mb-12">
              Toegang tot de meest geavanceerde talent hub van Suriname.
            </p>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, text: "Geverifieerde Profielen & Vacatures" },
                { icon: Zap, text: "AI-Powered Match Scoring" },
                { icon: Lock, text: "Veilig & Transparant Proces" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                  <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 mt-20 pt-10 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span>© 2026 SURIJOBS+</span>
            <div className="flex gap-4">
              <span>PRIVACY</span>
              <span>TERMS</span>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-12">
          {isSuccess ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">Succesvol!</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Je wordt nu doorverwezen naar je dashboard...</p>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2">
                    {isLogin ? 'Inloggen' : 'Registreren'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isLogin ? 'Welkom terug bij SuriJobs+' : 'Creëer je account in minder dan 2 minuten'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormErrors({});
                  }}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                >
                  {isLogin ? 'Account aanmaken' : 'Heb je al een account?'}
                </button>
              </div>

              {/* Role Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 border-2 transition-all group",
                    role === 'candidate' ? "border-black bg-black text-white" : "border-slate-100 hover:border-black text-slate-400"
                  )}
                >
                  <User className={cn("w-6 h-6", role === 'candidate' ? "text-blue-400" : "group-hover:text-black")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Kandidaat</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('employer')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 border-2 transition-all group",
                    role === 'employer' ? "border-black bg-black text-white" : "border-slate-100 hover:border-black text-slate-400"
                  )}
                >
                  <Building2 className={cn("w-6 h-6", role === 'employer' ? "text-blue-400" : "group-hover:text-black")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Werkgever</span>
                </button>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isLogin ? 'Kies de rol van het account waarmee je wilt doorgaan.' : 'Kies hoe je SuriJobs+ wilt gebruiken.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      name="email"
                      type="email" 
                      placeholder="E-MAILADRES" 
                      value={formValues.email}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                      aria-invalid={Boolean(formErrors.email)}
                      className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                  {formErrors.email && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{formErrors.email}</p>}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      name="password"
                      type="password" 
                      placeholder="WACHTWOORD" 
                      value={formValues.password}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                      aria-invalid={Boolean(formErrors.password)}
                      className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                  {formErrors.password && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{formErrors.password}</p>}
                  {formErrors.form && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{formErrors.form}</p>}
                  {isLogin && (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gebruik een demo-wachtwoord van minimaal 8 tekens</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 space-y-4">
                <button 
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-blue-600 text-white py-6 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verwerken...
                      </>
                    ) : (
                      <>
                        {isLogin ? 'Inloggen' : 'Account Creëren'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                    <span className="relative z-10 bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Of ga verder met</span>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                    <button type="button" disabled className="border-2 border-slate-100 p-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 opacity-50 cursor-not-allowed" title="Niet beschikbaar in deze demo">
                      <Smartphone className="w-4 h-4" /> Google
                    </button>
                    <button type="button" disabled className="border-2 border-slate-100 p-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 opacity-50 cursor-not-allowed" title="Niet beschikbaar in deze demo">
                      <Lock className="w-4 h-4" /> LinkedIn
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
