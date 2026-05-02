'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Languages,
  Briefcase,
  FileText,
  GraduationCap,
  Sparkles,
  Award,
  Target,
  Clock,
  DollarSign,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@/lib/validation';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  birthDate: string;
  languages: string;
  jobTitle: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  achievements: string;
  // Niet op CV — alleen voor matching/intake
  targetJob: string;
  availability: string;
  salaryIndication: string;
  preferredSector: string;
}

const EMPTY: FormData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  birthDate: '',
  languages: '',
  jobTitle: '',
  summary: '',
  experience: '',
  education: '',
  skills: '',
  achievements: '',
  targetJob: '',
  availability: '',
  salaryIndication: '',
  preferredSector: '',
};

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof User;
  validate: (d: FormData) => Partial<Record<keyof FormData, string>>;
}

const STEPS: Step[] = [
  {
    id: 'personal',
    title: 'Persoonlijke gegevens',
    subtitle: 'Wie ben je?',
    icon: User,
    validate: (d) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.fullName.trim()) errs.fullName = 'Naam is verplicht';
      if (!isValidEmail(d.email.trim())) errs.email = 'Ongeldig e-mailadres';
      if (!d.phone.trim()) errs.phone = 'Telefoonnummer is verplicht';
      if (!d.location.trim()) errs.location = 'Locatie is verplicht';
      return errs;
    },
  },
  {
    id: 'profile',
    title: 'Professioneel profiel',
    subtitle: 'Wat doe je en wat kan je?',
    icon: Briefcase,
    validate: (d) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.jobTitle.trim()) errs.jobTitle = 'Functie is verplicht';
      if (!d.summary.trim() || d.summary.trim().length < 20) {
        errs.summary = 'Geef een korte samenvatting (min. 20 tekens)';
      }
      if (!d.languages.trim()) errs.languages = 'Vul minstens één taal in';
      return errs;
    },
  },
  {
    id: 'experience',
    title: 'Werkervaring',
    subtitle: 'Wat heb je gedaan?',
    icon: FileText,
    validate: (d) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.experience.trim() || d.experience.trim().length < 30) {
        errs.experience = 'Beschrijf je werkervaring (min. 30 tekens)';
      }
      return errs;
    },
  },
  {
    id: 'education',
    title: 'Opleiding & vaardigheden',
    subtitle: 'Waar heb je geleerd?',
    icon: GraduationCap,
    validate: (d) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.education.trim()) errs.education = 'Vul je opleiding in';
      if (!d.skills.trim()) errs.skills = 'Vul je vaardigheden in';
      return errs;
    },
  },
  {
    id: 'preferences',
    title: 'Wat zoek je?',
    subtitle: 'Voor de beste matching',
    icon: Target,
    validate: (d) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.targetJob.trim()) errs.targetJob = 'Welke functie zoek je?';
      if (!d.availability.trim()) errs.availability = 'Wanneer ben je beschikbaar?';
      if (!d.preferredSector.trim()) errs.preferredSector = 'Welke sector?';
      return errs;
    },
  },
];

export default function CvBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const goNext = () => {
    const step = STEPS[currentStep];
    const stepErrors = step.validate(data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(s => Math.min(s + 1, STEPS.length));
  };

  const goPrev = () => {
    setErrors({});
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/submit-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, language: 'nl' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setSubmitError(result.message || 'Opslaan mislukt');
        setSubmitting(false);
        return;
      }
      router.push(`/mijn-matches?cvId=${encodeURIComponent(result.cvId)}`);
    } catch {
      setSubmitError('Verbinding mislukt. Probeer het opnieuw.');
      setSubmitting(false);
    }
  };

  const isReview = currentStep === STEPS.length;
  const progress = ((currentStep + 1) / (STEPS.length + 1)) * 100;
  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-12 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3" /> CV Builder
            </div>
            <Link
              href="/cv-upload"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              Liever uploaden? →
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
            Bouw je <span className="text-blue-600 italic">CV</span>
          </h1>
          <p className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-tight italic">
            Stap {Math.min(currentStep + 1, STEPS.length + 1)} van {STEPS.length + 1}
            {!isReview && step && ` — ${step.title}`}
          </p>

          {/* Progress bar */}
          <div className="mt-8 h-1 bg-white/10 overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {!isReview && step && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-100">
                <div className="w-14 h-14 bg-black flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
                    {step.title}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              {step.id === 'personal' && (
                <div className="space-y-6">
                  <Field icon={User} label="Volledige naam" value={data.fullName} onChange={(v) => update('fullName', v)} error={errors.fullName} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field icon={Mail} label="E-mailadres" type="email" value={data.email} onChange={(v) => update('email', v)} error={errors.email} />
                    <Field icon={Phone} label="Telefoonnummer" type="tel" value={data.phone} onChange={(v) => update('phone', v)} error={errors.phone} placeholder="06 12345678" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field icon={MapPin} label="Locatie" value={data.location} onChange={(v) => update('location', v)} error={errors.location} placeholder="Stad, Land" />
                    <Field icon={Calendar} label="Geboortedatum (optioneel)" value={data.birthDate} onChange={(v) => update('birthDate', v)} placeholder="dd/mm/jjjj" />
                  </div>
                </div>
              )}

              {step.id === 'profile' && (
                <div className="space-y-6">
                  <Field icon={Briefcase} label="Huidige of gewenste functie" value={data.jobTitle} onChange={(v) => update('jobTitle', v)} error={errors.jobTitle} placeholder="Software Developer" />
                  <TextareaField icon={Languages} label="Talen die je spreekt" value={data.languages} onChange={(v) => update('languages', v)} error={errors.languages} rows={3} placeholder="Nederlands (moedertaal), Engels (vloeiend), Duits (basis)..." />
                  <TextareaField icon={FileText} label="Korte professionele samenvatting" value={data.summary} onChange={(v) => update('summary', v)} error={errors.summary} rows={5} placeholder="Wie ben je, wat doe je, wat zijn je sterke kanten..." />
                </div>
              )}

              {step.id === 'experience' && (
                <div className="space-y-6">
                  <TextareaField
                    icon={Briefcase}
                    label="Werkervaring"
                    value={data.experience}
                    onChange={(v) => update('experience', v)}
                    error={errors.experience}
                    rows={10}
                    placeholder={'• Software Developer bij TechBedrijf\n  Januari 2020 - Heden\n  - Ontwikkelen van webapplicaties\n  - Samenwerken met design team\n\n• Junior Developer bij StartupX\n  Juni 2018 - December 2019\n  - ...'}
                  />
                  <p className="text-[11px] font-bold text-slate-400 italic">
                    Tip: vermeld per functie titel, bedrijf, periode en taken.
                  </p>
                </div>
              )}

              {step.id === 'education' && (
                <div className="space-y-6">
                  <TextareaField
                    icon={GraduationCap}
                    label="Opleiding"
                    value={data.education}
                    onChange={(v) => update('education', v)}
                    error={errors.education}
                    rows={6}
                    placeholder={'• Bachelor Informatica\n  Universiteit van Amsterdam\n  2016-2020\n  Diploma behaald\n\n• HAVO\n  ...'}
                  />
                  <TextareaField
                    icon={Sparkles}
                    label="Vaardigheden"
                    value={data.skills}
                    onChange={(v) => update('skills', v)}
                    error={errors.skills}
                    rows={4}
                    placeholder="JavaScript, React, Node.js, communicatie, leiderschap, projectmanagement..."
                  />
                  <TextareaField
                    icon={Award}
                    label="Prestaties & projecten (optioneel)"
                    value={data.achievements}
                    onChange={(v) => update('achievements', v)}
                    rows={4}
                    placeholder="Awards, succesvolle projecten, vrijwilligerswerk, certificeringen..."
                  />
                </div>
              )}

              {step.id === 'preferences' && (
                <>
                  <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-700">
                      Deze info komt niet op je CV
                    </p>
                    <p className="text-xs font-bold text-slate-600 mt-1 italic">
                      We gebruiken het alleen om de beste matches voor je te vinden.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <Field icon={Target} label="Welke functie zoek je?" value={data.targetJob} onChange={(v) => update('targetJob', v)} error={errors.targetJob} placeholder="Frontend Developer, Marketing Manager..." />
                    <TextareaField icon={Clock} label="Wanneer beschikbaar & uren per week" value={data.availability} onChange={(v) => update('availability', v)} error={errors.availability} rows={2} placeholder="Per direct beschikbaar, 40 uur per week" />
                    <Field icon={DollarSign} label="Salarisindicatie (optioneel)" value={data.salaryIndication} onChange={(v) => update('salaryIndication', v)} placeholder="€3000-4000 per maand" />
                    <Field icon={Building2} label="Voorkeurssector" value={data.preferredSector} onChange={(v) => update('preferredSector', v)} error={errors.preferredSector} placeholder="IT, Marketing, Financiën..." />
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-12 pt-8 border-t-2 border-slate-100">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-4 h-4" /> Vorige
                </button>
                <button
                  onClick={goNext}
                  className="bg-blue-600 text-white px-12 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {currentStep === STEPS.length - 1 ? 'Naar Overzicht' : 'Volgende'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {isReview && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-100">
                <div className="w-14 h-14 bg-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
                    Klaar om in te dienen
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    Controleer je gegevens voor je verzendt
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-12">
                <ReviewSection title="Persoonlijk" items={[
                  ['Naam', data.fullName],
                  ['E-mail', data.email],
                  ['Telefoon', data.phone],
                  ['Locatie', data.location],
                  ['Geboortedatum', data.birthDate || '—'],
                ]} />
                <ReviewSection title="Profiel" items={[
                  ['Functie', data.jobTitle],
                  ['Talen', data.languages],
                ]} multiline={[['Samenvatting', data.summary]]} />
                <ReviewSection title="Werkervaring" multiline={[['Werkervaring', data.experience]]} />
                <ReviewSection title="Opleiding & Vaardigheden" multiline={[
                  ['Opleiding', data.education],
                  ['Vaardigheden', data.skills],
                  ...(data.achievements ? [['Prestaties', data.achievements] as [string, string]] : []),
                ]} />
                <ReviewSection title="Voorkeuren (niet op CV)" items={[
                  ['Gezochte functie', data.targetJob],
                  ['Beschikbaarheid', data.availability],
                  ['Salaris', data.salaryIndication || '—'],
                  ['Sector', data.preferredSector],
                ]} />
              </div>

              {submitError && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t-2 border-slate-100">
                <button
                  onClick={goPrev}
                  disabled={submitting}
                  className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-4 h-4" /> Terug bewerken
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-12 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Indienen...
                    </>
                  ) : (
                    <>
                      Verstuur & toon matches <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
        <Icon className="w-3 h-3 text-blue-600" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full p-4 border-2 outline-none font-bold text-sm transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-black focus:bg-white'
        }`}
      />
      {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function TextareaField({
  icon: Icon,
  label,
  value,
  onChange,
  error,
  rows = 4,
  placeholder,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
        <Icon className="w-3 h-3 text-blue-600" /> {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full p-4 border-2 outline-none font-bold text-sm transition-all leading-relaxed ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-black focus:bg-white'
        }`}
      />
      {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function ReviewSection({
  title,
  items = [],
  multiline = [],
}: {
  title: string;
  items?: Array<[string, string]>;
  multiline?: Array<[string, string]>;
}) {
  return (
    <div className="border-2 border-slate-100 p-6">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4 italic">{title}</h3>
      {items.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {items.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{k}</dt>
              <dd className="font-bold text-slate-900 break-words">{v || '—'}</dd>
            </div>
          ))}
        </dl>
      )}
      {multiline.length > 0 && (
        <div className={`space-y-4 ${items.length > 0 ? 'mt-4 pt-4 border-t border-slate-100' : ''}`}>
          {multiline.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{k}</dt>
              <dd className="font-bold text-slate-700 text-sm whitespace-pre-wrap break-words">{v || '—'}</dd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
