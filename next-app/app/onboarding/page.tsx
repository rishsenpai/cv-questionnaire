'use client';

import React, { startTransition, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  Zap,
  Sparkles,
  ChevronLeft,
  GraduationCap,
  Globe,
  Users,
  Target,
  Trophy,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { isValidPhone, isValidUrl } from '@/lib/validation';
import { readJson, writeJson } from '@/lib/storage';

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedUser = readJson<any>('suri_user', null);
      if (!storedUser) {
        router.push('/auth');
        return;
      }

      if (storedUser.onboarded) {
        router.push(storedUser.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/company');
        return;
      }

      startTransition(() => {
        setUser(storedUser);

        if (storedUser?.role === 'employer') {
          setFormData({
            companyName: storedUser.companyName || storedUser.name,
            email: storedUser.email,
            website: storedUser.website || '',
            sector: storedUser.sector || '',
            teamSize: storedUser.teamSize || '',
            brandVibe: storedUser.brandVibe || '',
            hqLocation: storedUser.hqLocation || '',
            goal: storedUser.goal || '',
          });
        } else if (storedUser?.role === 'candidate') {
          setFormData({
            name: storedUser.name,
            email: storedUser.email,
            location: storedUser.location || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
            sector: storedUser.sector || '',
            experience: storedUser.experience || '',
            skills: storedUser.skills || '',
            minSalary: storedUser.minSalary || '',
            maxSalary: storedUser.maxSalary || '',
            remote: Boolean(storedUser.remote),
            fulltime: Boolean(storedUser.fulltime),
            freelance: Boolean(storedUser.freelance),
            parttime: Boolean(storedUser.parttime),
          });
        }
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!user) return null;

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const validateStep = (targetStep: number) => {
    const nextErrors: Record<string, string> = {};

    if (user?.role === 'candidate') {
      if (targetStep === 1) {
        if (!formData.name?.trim()) nextErrors.name = 'Voer je volledige naam in.';
        if (!formData.location) nextErrors.location = 'Selecteer een locatie.';
        if (!formData.phone?.trim()) nextErrors.phone = 'Voer je telefoonnummer in.';
        else if (!isValidPhone(formData.phone)) nextErrors.phone = 'Voer een geldig telefoonnummer in.';
      }
      if (targetStep === 2) {
        if (!formData.sector) nextErrors.sector = 'Kies een sector.';
        if (!formData.experience) nextErrors.experience = 'Kies je ervaringsniveau.';
      }
    } else {
      if (targetStep === 1) {
        if (!formData.companyName?.trim()) nextErrors.companyName = 'Voer de bedrijfsnaam in.';
        if (formData.website?.trim() && !isValidUrl(formData.website)) nextErrors.website = 'Voer een geldige URL in, bijvoorbeeld https://bedrijf.sr.';
        if (!formData.sector) nextErrors.sector = 'Selecteer een sector.';
      }
      if (targetStep === 2) {
        if (!formData.teamSize) nextErrors.teamSize = 'Selecteer een teamgrootte.';
      }
    }

    return nextErrors;
  };

  const handleFinish = () => {
    const nextErrors = validateStep(totalSteps);
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    setIsFinishing(true);
    setTimeout(() => {
      const updatedUser = { ...user, ...formData, onboarded: true };
      const storedUsers = readJson<any[]>('suri_users', []);
      const nextUsers = storedUsers.some((storedUser) => storedUser.id === updatedUser.id)
        ? storedUsers.map((storedUser) => (storedUser.id === updatedUser.id ? updatedUser : storedUser))
        : [updatedUser, ...storedUsers];

      writeJson('suri_users', nextUsers);
      writeJson('suri_user', updatedUser);
      
      if (user.role === 'candidate') {
        router.push('/dashboard/candidate');
      } else {
        router.push('/dashboard/company');
      }
    }, 2000);
  };

  const nextStep = () => {
    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});
    setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateData = (newData: any) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      Object.keys(newData).forEach((key) => delete next[key]);
      return next;
    });
    setFormData((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Progress Bar Header */}
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-100 z-[100]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Context & Step Counter */}
        <div className="w-full lg:w-[450px] bg-black text-white p-12 md:p-20 flex flex-col justify-between border-r-8 border-blue-600">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-12 italic">
              Step 0{step} / 0{totalSteps}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-8 italic">
              {user.role === 'candidate' ? (
                <>Bouw je <br/><span className="text-blue-600 underline decoration-white decoration-8 underline-offset-8">Profiel</span></>
              ) : (
                <>Positioneer je <br/><span className="text-blue-600 underline decoration-white decoration-8 underline-offset-8">Merk</span></>
              )}
            </h1>
            
            <p className="text-lg font-bold text-slate-400 uppercase tracking-tight italic mb-12 leading-tight">
              {user.role === 'candidate' 
                ? "Laat werkgevers zien wie je echt bent. Geen CV, maar een interactief profiel."
                : "Maak indruk op Surinaams toptalent met een krachtige bedrijfspagina."}
            </p>

            <div className="space-y-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center font-black text-xs border-2 transition-all",
                    step === i + 1 ? "bg-white text-black border-white" : 
                    step > i + 1 ? "bg-blue-600 text-white border-blue-600" : "bg-transparent text-slate-700 border-slate-900"
                  )}>
                    {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : `0${i + 1}`}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    step === i + 1 ? "text-white" : "text-slate-700"
                  )}>
                    {user.role === 'candidate' ? (
                      ['Identiteit', 'Expertise', 'Ambitie'][i]
                    ) : (
                      ['Organisatie', 'Cultuur', 'Strategie'][i]
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest italic">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI OPTIMIZED PROFILING ENGINE V4.0
          </div>
        </div>

        {/* Right Side: Step Content */}
        <div className="flex-1 p-8 md:p-20 bg-slate-50 relative overflow-hidden">
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            <AnimatePresence mode="wait">
              {isFinishing ? (
                <motion.div 
                  key="finishing"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative mb-12">
                     <div className="w-32 h-32 bg-blue-100 rounded-full animate-ping absolute inset-0 opacity-20" />
                     <div className="w-32 h-32 bg-white border-8 border-blue-600 text-blue-600 rounded-full flex items-center justify-center relative shadow-[16px_16px_0px_0px_rgba(59,130,246,0.1)]">
                        <Zap className="w-16 h-16 fill-current animate-pulse" />
                     </div>
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter italic mb-4">MATCHING ENGINE <br/>WORDT GELADEN</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm">
                    We analyseren je gegevens en configureren je gepersonaliseerde dashboard...
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key={step}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex-1"
                >
                  {user.role === 'candidate' ? (
                    <CandidateSteps step={step} updateData={updateData} data={formData} errors={formErrors} />
                  ) : (
                    <EmployerSteps step={step} updateData={updateData} data={formData} errors={formErrors} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!isFinishing && (
              <div className="mt-12 flex items-center justify-between pt-12 border-t-2 border-slate-200">
                <button 
                  onClick={prevStep}
                  disabled={step === 1}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    step === 1 ? "text-slate-300 pointer-events-none" : "text-black hover:text-blue-600"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" /> Vorige
                </button>

                {step === totalSteps ? (
                  <button 
                    onClick={handleFinish}
                    disabled={isFinishing}
                    className="bg-blue-600 text-white px-12 py-5 font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFinishing ? (
                      <>Afronden... <Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : (
                      <>Finish Profile <CheckCircle2 className="w-5 h-5 text-yellow-400" /></>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={nextStep}
                    className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] flex items-center gap-4"
                  >
                    Volgende <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SECTORS = [
  'Technologie & IT',
  'Financiën & Verzekeringen',
  'Mijnbouw & Natuurlijke Hulpbronnen',
  'Energie & Water',
  'Transport & Logistiek',
  'Landbouw, Veeteelt & Visserij',
  'Toerisme & Gastvrijheid',
  'Gezondheidszorg & Welzijn',
  'Onderwijs & Wetenschap',
  'Overheid & Publieke Sector',
  'Bouw & Infrastructuur',
  'Detailhandel & Handel',
  'Media & Entertainment',
  'Juridische Dienstverlening',
  'Veiligheid & Defensie',
  'Kunst & Cultuur',
  'Administratie & Support',
  'HR & Recruitment',
  'Anders...'
];

function CandidateSteps({ step, updateData, data, errors }: { step: number, updateData: (d: any) => void, data: any, errors: Record<string, string> }) {
  if (step === 1) {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic">Wie ben je?</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volledige Naam</label>
            <input 
              type="text" 
              value={data.name || ''} 
              onChange={(e) => updateData({ name: e.target.value })}
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
            />
            {errors.name && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locatie</label>
              <select 
                value={data.location || ''} 
                onChange={(e) => updateData({ location: e.target.value })}
                className="w-full p-4 border-4 border-black outline-none bg-white font-bold uppercase tracking-widest text-sm"
              >
                <option value="">Kies District</option>
                <option>Paramaribo</option>
                <option>Wanica</option>
                <option>Nickerie</option>
                <option>Commewijne</option>
                <option>Saramacca</option>
                <option>Para</option>
                <option>Marowijne</option>
                <option>Coronie</option>
                <option>Brokopondo</option>
                <option>Sipaliwini</option>
              </select>
              {errors.location && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</label>
              <input 
                type="tel" 
                value={data.phone || ''} 
                onChange={(e) => updateData({ phone: e.target.value })}
                placeholder="+597 ..." 
                className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
              />
              {errors.phone && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.phone}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mini-Bio (Wie ben je in 1 zin?)</label>
            <textarea 
              value={data.bio || ''} 
              onChange={(e) => updateData({ bio: e.target.value })}
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm min-h-[100px]" 
              placeholder="Bv: Senior engineer met passie voor Surinaamse innovatie..." 
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic">Wat kun je?</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jouw Sector</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {SECTORS.map(sec => (
                <button 
                  type="button"
                  key={sec} 
                  onClick={() => updateData({ sector: sec })}
                  className={cn(
                    "flex flex-col items-start gap-2 p-3 border-2 transition-all font-black uppercase tracking-widest text-[8px] text-left h-24 justify-between",
                    data.sector === sec ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                  )}
                >
                  <Briefcase className={cn("w-4 h-4", data.sector === sec ? "text-blue-400" : "text-slate-300")} />
                  {sec}
                </button>
              ))}
            </div>
            {errors.sector && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.sector}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ervaring Niveau</label>
            <div className="flex gap-4">
               {['Starter', 'Junior', 'Mid', 'Senior', 'Lead', 'Expert'].map(lvl => (
                 <button 
                    type="button"
                    key={lvl} 
                    onClick={() => updateData({ experience: lvl })}
                    className={cn(
                      "flex-1 py-4 border-2 transition-all font-black uppercase tracking-widest text-[10px]",
                      data.experience === lvl ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                    )}
                 >
                   {lvl}
                 </button>
               ))}
            </div>
            {errors.experience && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.experience}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specialisaties / Top Skills</label>
            <input 
              type="text" 
              value={data.skills || ''} 
              onChange={(e) => updateData({ skills: e.target.value })}
              placeholder="Bv: Project Management, Klantenservice, IT Support..." 
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-black uppercase tracking-tighter italic">Wat wil je?</h2>
      <div className="grid gap-8">
         <div className="bg-black text-white p-8 border-l-8 border-blue-600">
           <div className="flex items-center gap-4 mb-4">
             <Target className="w-6 h-6 text-blue-400" />
             <h3 className="text-lg font-black uppercase tracking-widest">Salaris Expectatie (Per Maand)</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" 
                value={data.minSalary || ''} 
                onChange={(e) => updateData({ minSalary: e.target.value })}
                placeholder="VAN (SRD)" 
                className="bg-slate-900 border-2 border-slate-700 p-4 text-sm font-bold outline-none focus:border-blue-500" 
              />
              <input 
                type="number" 
                value={data.maxSalary || ''} 
                onChange={(e) => updateData({ maxSalary: e.target.value })}
                placeholder="TOT (SRD)" 
                className="bg-slate-900 border-2 border-slate-700 p-4 text-sm font-bold outline-none focus:border-blue-500" 
              />
           </div>
         </div>

         <div className="space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Werkvoorkeuren</label>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Remote / Thuiswerk', icon: Globe, id: 'remote' },
                { label: 'Full-time / Voltijds', icon: Zap, id: 'fulltime' },
                { label: 'Freelance / ZZP', icon: Trophy, id: 'freelance' },
                { label: 'Part-time / Deeltijds', icon: Clock, id: 'parttime' }
              ].map(p => (
                <button 
                  type="button"
                  key={p.id} 
                  onClick={() => updateData({ [p.id]: !data[p.id] })}
                  className={cn(
                    "p-4 border-2 flex items-center gap-3 transition-all",
                    data[p.id] ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                  )}
                >
                   <p.icon className={cn("w-4 h-4", data[p.id] ? "text-blue-400" : "text-blue-600")} />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">{p.label}</span>
                </button>
              ))}
           </div>
         </div>
      </div>
    </div>
  );
}

function EmployerSteps({ step, updateData, data, errors }: { step: number, updateData: (d: any) => void, data: any, errors: Record<string, string> }) {
  if (step === 1) {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic">Bedrijfsgegevens</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bedrijfsnaam</label>
            <input 
              type="text" 
              value={data.companyName || ''} 
              onChange={(e) => updateData({ companyName: e.target.value })}
              placeholder="Bedrijfsnaam..." 
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
            />
            {errors.companyName && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.companyName}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Website & Socials</label>
            <input 
              type="text" 
              value={data.website || ''} 
              onChange={(e) => updateData({ website: e.target.value })}
              placeholder="https://www.company.sr of LinkedIn handle" 
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
            />
            {errors.website && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.website}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bedrijfssector</label>
            <select 
              value={data.sector || ''} 
              onChange={(e) => updateData({ sector: e.target.value })}
              className="w-full p-4 border-4 border-black outline-none bg-white font-bold uppercase tracking-widest text-sm"
            >
              <option value="">Kies Sector</option>
              {SECTORS.map(sec => <option key={sec}>{sec}</option>)}
            </select>
            {errors.sector && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.sector}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic">Bedrijfscultuur</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Grootte</label>
            <div className="flex gap-4">
               {['Minder dan 10', '11-50', '51-200', '201-500', '500+'].map(size => (
                 <button 
                    type="button"
                    key={size} 
                    onClick={() => updateData({ teamSize: size })}
                    className={cn(
                      "flex-1 py-4 border-2 transition-all font-black uppercase tracking-widest text-[10px]",
                      data.teamSize === size ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                    )}
                 >
                   {size}
                 </button>
               ))}
            </div>
            {errors.teamSize && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.teamSize}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kies je Brand Vibe</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Modern & Fris', color: 'bg-blue-600', id: 'modern' },
                { label: 'Bold & Direct', color: 'bg-black', id: 'bold' },
                { label: 'Warm & Sociaal', color: 'bg-orange-500', id: 'warm' }
              ].map(vibe => (
                <button 
                  type="button"
                  key={vibe.id} 
                  onClick={() => updateData({ brandVibe: vibe.id })}
                  className={cn(
                    "p-4 border-2 flex flex-col items-center gap-3 transition-all group",
                    data.brandVibe === vibe.id ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                  )}
                >
                   <div className={cn("w-8 h-8 rounded-full", vibe.color)} />
                   <span className="text-[8px] font-black uppercase tracking-widest">{vibe.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locatie Hoofdkantoor</label>
            <input 
              type="text" 
              value={data.hqLocation || ''} 
              onChange={(e) => updateData({ hqLocation: e.target.value })}
              placeholder="bv. Paramaribo, Waterkant" 
              className="w-full p-4 border-4 border-black outline-none focus:bg-blue-50 font-bold uppercase tracking-widest text-sm" 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-black uppercase tracking-tighter italic">Recruitment Strategie</h2>
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wat is je hoofddoel?</label>
          <div className="grid gap-4">
             {[
               { id: 'hiring', title: 'Actief aannemen', desc: 'Direct vacatures plaatsen en kandidaten screenen.' },
               { id: 'talentpool', title: 'Talent Pool Bouwen', desc: 'Netwerken met toptalent voor toekomstige functies.' },
               { id: 'branding', title: 'Merkbekendheid', desc: 'Je bedrijf op de kaart zetten als topwerkgever.' }
             ].map(goal => (
               <button 
                  key={goal.id} 
                  onClick={() => updateData({ goal: goal.id })}
                  className={cn(
                    "p-6 border-2 text-left group flex items-start gap-4 transition-all",
                    data.goal === goal.id ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-black"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center shrink-0 border transition-colors",
                    data.goal === goal.id ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200"
                  )}>
                    <Target className={cn("w-5 h-5", data.goal === goal.id ? "text-blue-400" : "text-slate-400 group-hover:text-blue-600")} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{goal.title}</h4>
                    <p className={cn(
                      "text-[9px] font-bold uppercase tracking-widest leading-relaxed",
                      data.goal === goal.id ? "text-slate-400" : "text-slate-400"
                    )}>{goal.desc}</p>
                  </div>
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
