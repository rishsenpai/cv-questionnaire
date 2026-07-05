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
import { trackEvent } from '@/lib/analytics-client';
import { useT } from '@/lib/i18n/LanguageProvider';

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

const CVBUILDER_T = {
  nl: {
    heroBadge: 'CV Builder',
    heroUploadLink: 'Liever uploaden? →',
    heroTitleA: 'Bouw je',
    heroTitleHighlight: 'CV',
    stepOf: (c: number, total: number) => `Stap ${c} van ${total}`,
    // Step titles & subtitles
    stepPersonalTitle: 'Persoonlijke gegevens',
    stepPersonalSubtitle: 'Wie ben je?',
    stepProfileTitle: 'Professioneel profiel',
    stepProfileSubtitle: 'Wat doe je en wat kan je?',
    stepExperienceTitle: 'Werkervaring',
    stepExperienceSubtitle: 'Wat heb je gedaan?',
    stepEducationTitle: 'Opleiding & vaardigheden',
    stepEducationSubtitle: 'Waar heb je geleerd?',
    stepPreferencesTitle: 'Wat zoek je?',
    stepPreferencesSubtitle: 'Voor de beste matching',
    // Validation
    errFullName: 'Naam is verplicht',
    errEmail: 'Ongeldig e-mailadres',
    errPhone: 'Telefoonnummer is verplicht',
    errLocation: 'Locatie is verplicht',
    errJobTitle: 'Functie is verplicht',
    errSummary: 'Geef een korte samenvatting (min. 20 tekens)',
    errLanguages: 'Vul minstens één taal in',
    errExperience: 'Beschrijf je werkervaring (min. 30 tekens)',
    errEducation: 'Vul je opleiding in',
    errSkills: 'Vul je vaardigheden in',
    errTargetJob: 'Welke functie zoek je?',
    errAvailability: 'Wanneer ben je beschikbaar?',
    errPreferredSector: 'Welke sector?',
    // Personal fields
    lblFullName: 'Volledige naam',
    lblEmail: 'E-mailadres',
    lblPhone: 'Telefoonnummer',
    phPhone: '06 12345678',
    lblLocation: 'Locatie',
    phLocation: 'Stad, Land',
    lblBirthDate: 'Geboortedatum (optioneel)',
    phBirthDate: 'dd/mm/jjjj',
    // Profile fields
    lblJobTitle: 'Huidige of gewenste functie',
    phJobTitle: 'Software Developer',
    lblLanguages: 'Talen die je spreekt',
    phLanguages: 'Nederlands (moedertaal), Engels (vloeiend), Duits (basis)...',
    lblSummary: 'Korte professionele samenvatting',
    phSummary: 'Wie ben je, wat doe je, wat zijn je sterke kanten...',
    // Experience
    lblExperience: 'Werkervaring',
    phExperience:
      '• Software Developer bij TechBedrijf\n  Januari 2020 - Heden\n  - Ontwikkelen van webapplicaties\n  - Samenwerken met design team\n\n• Junior Developer bij StartupX\n  Juni 2018 - December 2019\n  - ...',
    experienceTip: 'Tip: vermeld per functie titel, bedrijf, periode en taken.',
    // Education
    lblEducation: 'Opleiding',
    phEducation: '• Bachelor Informatica\n  Universiteit van Amsterdam\n  2016-2020\n  Diploma behaald\n\n• HAVO\n  ...',
    lblSkills: 'Vaardigheden',
    phSkills: 'JavaScript, React, Node.js, communicatie, leiderschap, projectmanagement...',
    lblAchievements: 'Prestaties & projecten (optioneel)',
    phAchievements: 'Awards, succesvolle projecten, vrijwilligerswerk, certificeringen...',
    // Preferences
    prefNotOnCv: 'Deze info komt niet op je CV',
    prefNotOnCvDesc: 'We gebruiken het alleen om de beste matches voor je te vinden.',
    lblTargetJob: 'Welke functie zoek je?',
    phTargetJob: 'Frontend Developer, Marketing Manager...',
    lblAvailability: 'Wanneer beschikbaar & uren per week',
    phAvailability: 'Per direct beschikbaar, 40 uur per week',
    lblSalary: 'Salarisindicatie (optioneel)',
    phSalary: '€3000-4000 per maand',
    lblPreferredSector: 'Voorkeurssector',
    phPreferredSector: 'IT, Marketing, Financiën...',
    // Buttons
    btnPrev: 'Vorige',
    btnToReview: 'Naar Overzicht',
    btnNext: 'Volgende',
    btnBackEdit: 'Terug bewerken',
    btnSubmitting: 'Indienen...',
    btnSubmit: 'Verstuur & toon matches',
    // Review
    reviewTitle: 'Klaar om in te dienen',
    reviewSubtitle: 'Controleer je gegevens voor je verzendt',
    rsPersonal: 'Persoonlijk',
    rsProfile: 'Profiel',
    rsExperience: 'Werkervaring',
    rsEducation: 'Opleiding & Vaardigheden',
    rsPreferences: 'Voorkeuren (niet op CV)',
    rvName: 'Naam',
    rvEmail: 'E-mail',
    rvPhone: 'Telefoon',
    rvLocation: 'Locatie',
    rvBirthDate: 'Geboortedatum',
    rvJobTitle: 'Functie',
    rvLanguages: 'Talen',
    rvSummary: 'Samenvatting',
    rvExperience: 'Werkervaring',
    rvEducation: 'Opleiding',
    rvSkills: 'Vaardigheden',
    rvAchievements: 'Prestaties',
    rvTargetJob: 'Gezochte functie',
    rvAvailability: 'Beschikbaarheid',
    rvSalary: 'Salaris',
    rvSector: 'Sector',
    // Submit errors
    submitFailed: 'Opslaan mislukt',
    connectionFailed: 'Verbinding mislukt. Probeer het opnieuw.',
  },
  en: {
    heroBadge: 'CV Builder',
    heroUploadLink: 'Rather upload? →',
    heroTitleA: 'Build your',
    heroTitleHighlight: 'CV',
    stepOf: (c: number, total: number) => `Step ${c} of ${total}`,
    stepPersonalTitle: 'Personal details',
    stepPersonalSubtitle: 'Who are you?',
    stepProfileTitle: 'Professional profile',
    stepProfileSubtitle: 'What do you do and what can you do?',
    stepExperienceTitle: 'Work experience',
    stepExperienceSubtitle: 'What have you done?',
    stepEducationTitle: 'Education & skills',
    stepEducationSubtitle: 'Where did you learn?',
    stepPreferencesTitle: 'What are you looking for?',
    stepPreferencesSubtitle: 'For the best matching',
    errFullName: 'Name is required',
    errEmail: 'Invalid email address',
    errPhone: 'Phone number is required',
    errLocation: 'Location is required',
    errJobTitle: 'Job title is required',
    errSummary: 'Provide a short summary (min. 20 characters)',
    errLanguages: 'Enter at least one language',
    errExperience: 'Describe your work experience (min. 30 characters)',
    errEducation: 'Enter your education',
    errSkills: 'Enter your skills',
    errTargetJob: 'Which job are you looking for?',
    errAvailability: 'When are you available?',
    errPreferredSector: 'Which sector?',
    lblFullName: 'Full name',
    lblEmail: 'Email address',
    lblPhone: 'Phone number',
    phPhone: '06 12345678',
    lblLocation: 'Location',
    phLocation: 'City, Country',
    lblBirthDate: 'Date of birth (optional)',
    phBirthDate: 'dd/mm/yyyy',
    lblJobTitle: 'Current or desired job title',
    phJobTitle: 'Software Developer',
    lblLanguages: 'Languages you speak',
    phLanguages: 'Dutch (native), English (fluent), German (basic)...',
    lblSummary: 'Short professional summary',
    phSummary: 'Who you are, what you do, what your strengths are...',
    lblExperience: 'Work experience',
    phExperience:
      '• Software Developer at TechCompany\n  January 2020 - Present\n  - Developing web applications\n  - Collaborating with the design team\n\n• Junior Developer at StartupX\n  June 2018 - December 2019\n  - ...',
    experienceTip: 'Tip: for each role list the title, company, period and tasks.',
    lblEducation: 'Education',
    phEducation:
      '• Bachelor Computer Science\n  University of Amsterdam\n  2016-2020\n  Degree obtained\n\n• High school\n  ...',
    lblSkills: 'Skills',
    phSkills: 'JavaScript, React, Node.js, communication, leadership, project management...',
    lblAchievements: 'Achievements & projects (optional)',
    phAchievements: 'Awards, successful projects, volunteer work, certifications...',
    prefNotOnCv: 'This info will not appear on your CV',
    prefNotOnCvDesc: 'We only use it to find the best matches for you.',
    lblTargetJob: 'Which job are you looking for?',
    phTargetJob: 'Frontend Developer, Marketing Manager...',
    lblAvailability: 'When available & hours per week',
    phAvailability: 'Available immediately, 40 hours per week',
    lblSalary: 'Salary indication (optional)',
    phSalary: '€3000-4000 per month',
    lblPreferredSector: 'Preferred sector',
    phPreferredSector: 'IT, Marketing, Finance...',
    btnPrev: 'Previous',
    btnToReview: 'To Overview',
    btnNext: 'Next',
    btnBackEdit: 'Back to edit',
    btnSubmitting: 'Submitting...',
    btnSubmit: 'Submit & show matches',
    reviewTitle: 'Ready to submit',
    reviewSubtitle: 'Check your details before you send',
    rsPersonal: 'Personal',
    rsProfile: 'Profile',
    rsExperience: 'Work experience',
    rsEducation: 'Education & Skills',
    rsPreferences: 'Preferences (not on CV)',
    rvName: 'Name',
    rvEmail: 'Email',
    rvPhone: 'Phone',
    rvLocation: 'Location',
    rvBirthDate: 'Date of birth',
    rvJobTitle: 'Job title',
    rvLanguages: 'Languages',
    rvSummary: 'Summary',
    rvExperience: 'Work experience',
    rvEducation: 'Education',
    rvSkills: 'Skills',
    rvAchievements: 'Achievements',
    rvTargetJob: 'Desired job',
    rvAvailability: 'Availability',
    rvSalary: 'Salary',
    rvSector: 'Sector',
    submitFailed: 'Saving failed',
    connectionFailed: 'Connection failed. Please try again.',
  },
  es: {
    heroBadge: 'CV Builder',
    heroUploadLink: '¿Prefieres subir? →',
    heroTitleA: 'Crea tu',
    heroTitleHighlight: 'CV',
    stepOf: (c: number, total: number) => `Paso ${c} de ${total}`,
    stepPersonalTitle: 'Datos personales',
    stepPersonalSubtitle: '¿Quién eres?',
    stepProfileTitle: 'Perfil profesional',
    stepProfileSubtitle: '¿Qué haces y qué sabes hacer?',
    stepExperienceTitle: 'Experiencia laboral',
    stepExperienceSubtitle: '¿Qué has hecho?',
    stepEducationTitle: 'Educación y habilidades',
    stepEducationSubtitle: '¿Dónde has aprendido?',
    stepPreferencesTitle: '¿Qué buscas?',
    stepPreferencesSubtitle: 'Para el mejor emparejamiento',
    errFullName: 'El nombre es obligatorio',
    errEmail: 'Correo electrónico no válido',
    errPhone: 'El número de teléfono es obligatorio',
    errLocation: 'La ubicación es obligatoria',
    errJobTitle: 'El puesto es obligatorio',
    errSummary: 'Proporciona un breve resumen (mín. 20 caracteres)',
    errLanguages: 'Introduce al menos un idioma',
    errExperience: 'Describe tu experiencia laboral (mín. 30 caracteres)',
    errEducation: 'Introduce tu educación',
    errSkills: 'Introduce tus habilidades',
    errTargetJob: '¿Qué puesto buscas?',
    errAvailability: '¿Cuándo estás disponible?',
    errPreferredSector: '¿Qué sector?',
    lblFullName: 'Nombre completo',
    lblEmail: 'Correo electrónico',
    lblPhone: 'Número de teléfono',
    phPhone: '06 12345678',
    lblLocation: 'Ubicación',
    phLocation: 'Ciudad, País',
    lblBirthDate: 'Fecha de nacimiento (opcional)',
    phBirthDate: 'dd/mm/aaaa',
    lblJobTitle: 'Puesto actual o deseado',
    phJobTitle: 'Software Developer',
    lblLanguages: 'Idiomas que hablas',
    phLanguages: 'Neerlandés (nativo), Inglés (fluido), Alemán (básico)...',
    lblSummary: 'Breve resumen profesional',
    phSummary: 'Quién eres, qué haces, cuáles son tus puntos fuertes...',
    lblExperience: 'Experiencia laboral',
    phExperience:
      '• Software Developer en TechEmpresa\n  Enero 2020 - Presente\n  - Desarrollo de aplicaciones web\n  - Colaboración con el equipo de diseño\n\n• Junior Developer en StartupX\n  Junio 2018 - Diciembre 2019\n  - ...',
    experienceTip: 'Consejo: para cada puesto indica el título, la empresa, el periodo y las tareas.',
    lblEducation: 'Educación',
    phEducation:
      '• Grado en Informática\n  Universidad de Ámsterdam\n  2016-2020\n  Título obtenido\n\n• Bachillerato\n  ...',
    lblSkills: 'Habilidades',
    phSkills: 'JavaScript, React, Node.js, comunicación, liderazgo, gestión de proyectos...',
    lblAchievements: 'Logros y proyectos (opcional)',
    phAchievements: 'Premios, proyectos exitosos, voluntariado, certificaciones...',
    prefNotOnCv: 'Esta información no aparecerá en tu CV',
    prefNotOnCvDesc: 'Solo la usamos para encontrar las mejores coincidencias para ti.',
    lblTargetJob: '¿Qué puesto buscas?',
    phTargetJob: 'Frontend Developer, Marketing Manager...',
    lblAvailability: 'Cuándo disponible y horas por semana',
    phAvailability: 'Disponible de inmediato, 40 horas por semana',
    lblSalary: 'Indicación salarial (opcional)',
    phSalary: '€3000-4000 al mes',
    lblPreferredSector: 'Sector preferido',
    phPreferredSector: 'TI, Marketing, Finanzas...',
    btnPrev: 'Anterior',
    btnToReview: 'Al Resumen',
    btnNext: 'Siguiente',
    btnBackEdit: 'Volver a editar',
    btnSubmitting: 'Enviando...',
    btnSubmit: 'Enviar y mostrar coincidencias',
    reviewTitle: 'Listo para enviar',
    reviewSubtitle: 'Revisa tus datos antes de enviar',
    rsPersonal: 'Personal',
    rsProfile: 'Perfil',
    rsExperience: 'Experiencia laboral',
    rsEducation: 'Educación y Habilidades',
    rsPreferences: 'Preferencias (no en el CV)',
    rvName: 'Nombre',
    rvEmail: 'Correo',
    rvPhone: 'Teléfono',
    rvLocation: 'Ubicación',
    rvBirthDate: 'Fecha de nacimiento',
    rvJobTitle: 'Puesto',
    rvLanguages: 'Idiomas',
    rvSummary: 'Resumen',
    rvExperience: 'Experiencia laboral',
    rvEducation: 'Educación',
    rvSkills: 'Habilidades',
    rvAchievements: 'Logros',
    rvTargetJob: 'Puesto buscado',
    rvAvailability: 'Disponibilidad',
    rvSalary: 'Salario',
    rvSector: 'Sector',
    submitFailed: 'Error al guardar',
    connectionFailed: 'Error de conexión. Inténtalo de nuevo.',
  },
};

type Dict = typeof CVBUILDER_T['nl'];

interface Step {
  id: string;
  icon: typeof User;
  title: (t: Dict) => string;
  subtitle: (t: Dict) => string;
  validate: (d: FormData, t: Dict) => Partial<Record<keyof FormData, string>>;
}

const STEPS: Step[] = [
  {
    id: 'personal',
    icon: User,
    title: (t) => t.stepPersonalTitle,
    subtitle: (t) => t.stepPersonalSubtitle,
    validate: (d, t) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.fullName.trim()) errs.fullName = t.errFullName;
      if (!isValidEmail(d.email.trim())) errs.email = t.errEmail;
      if (!d.phone.trim()) errs.phone = t.errPhone;
      if (!d.location.trim()) errs.location = t.errLocation;
      return errs;
    },
  },
  {
    id: 'profile',
    icon: Briefcase,
    title: (t) => t.stepProfileTitle,
    subtitle: (t) => t.stepProfileSubtitle,
    validate: (d, t) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.jobTitle.trim()) errs.jobTitle = t.errJobTitle;
      if (!d.summary.trim() || d.summary.trim().length < 20) {
        errs.summary = t.errSummary;
      }
      if (!d.languages.trim()) errs.languages = t.errLanguages;
      return errs;
    },
  },
  {
    id: 'experience',
    icon: FileText,
    title: (t) => t.stepExperienceTitle,
    subtitle: (t) => t.stepExperienceSubtitle,
    validate: (d, t) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.experience.trim() || d.experience.trim().length < 30) {
        errs.experience = t.errExperience;
      }
      return errs;
    },
  },
  {
    id: 'education',
    icon: GraduationCap,
    title: (t) => t.stepEducationTitle,
    subtitle: (t) => t.stepEducationSubtitle,
    validate: (d, t) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.education.trim()) errs.education = t.errEducation;
      if (!d.skills.trim()) errs.skills = t.errSkills;
      return errs;
    },
  },
  {
    id: 'preferences',
    icon: Target,
    title: (t) => t.stepPreferencesTitle,
    subtitle: (t) => t.stepPreferencesSubtitle,
    validate: (d, t) => {
      const errs: Partial<Record<keyof FormData, string>> = {};
      if (!d.targetJob.trim()) errs.targetJob = t.errTargetJob;
      if (!d.availability.trim()) errs.availability = t.errAvailability;
      if (!d.preferredSector.trim()) errs.preferredSector = t.errPreferredSector;
      return errs;
    },
  },
];

export default function CvBuilderPage() {
  const t = useT(CVBUILDER_T);
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
    const stepErrors = step.validate(data, t);
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
        setSubmitError(result.message || t.submitFailed);
        setSubmitting(false);
        return;
      }
      trackEvent('cv_manual', { metadata: { source: 'builder' } });
      trackEvent('cv_submission', { metadata: { source: 'builder' } });
      router.push(`/mijn-matches?cvId=${encodeURIComponent(result.cvId)}`);
    } catch {
      setSubmitError(t.connectionFailed);
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
              <Sparkles className="w-3 h-3" /> {t.heroBadge}
            </div>
            <Link
              href="/cv-upload"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              {t.heroUploadLink}
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
            {t.heroTitleA} <span className="text-blue-600 italic">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-tight italic">
            {t.stepOf(Math.min(currentStep + 1, STEPS.length + 1), STEPS.length + 1)}
            {!isReview && step && ` — ${step.title(t)}`}
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
                    {step.title(t)}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {step.subtitle(t)}
                  </p>
                </div>
              </div>

              {step.id === 'personal' && (
                <div className="space-y-6">
                  <Field icon={User} label={t.lblFullName} value={data.fullName} onChange={(v) => update('fullName', v)} error={errors.fullName} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field icon={Mail} label={t.lblEmail} type="email" value={data.email} onChange={(v) => update('email', v)} error={errors.email} />
                    <Field icon={Phone} label={t.lblPhone} type="tel" value={data.phone} onChange={(v) => update('phone', v)} error={errors.phone} placeholder={t.phPhone} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field icon={MapPin} label={t.lblLocation} value={data.location} onChange={(v) => update('location', v)} error={errors.location} placeholder={t.phLocation} />
                    <Field icon={Calendar} label={t.lblBirthDate} value={data.birthDate} onChange={(v) => update('birthDate', v)} placeholder={t.phBirthDate} />
                  </div>
                </div>
              )}

              {step.id === 'profile' && (
                <div className="space-y-6">
                  <Field icon={Briefcase} label={t.lblJobTitle} value={data.jobTitle} onChange={(v) => update('jobTitle', v)} error={errors.jobTitle} placeholder={t.phJobTitle} />
                  <TextareaField icon={Languages} label={t.lblLanguages} value={data.languages} onChange={(v) => update('languages', v)} error={errors.languages} rows={3} placeholder={t.phLanguages} />
                  <TextareaField icon={FileText} label={t.lblSummary} value={data.summary} onChange={(v) => update('summary', v)} error={errors.summary} rows={5} placeholder={t.phSummary} />
                </div>
              )}

              {step.id === 'experience' && (
                <div className="space-y-6">
                  <TextareaField
                    icon={Briefcase}
                    label={t.lblExperience}
                    value={data.experience}
                    onChange={(v) => update('experience', v)}
                    error={errors.experience}
                    rows={10}
                    placeholder={t.phExperience}
                  />
                  <p className="text-[11px] font-bold text-slate-400 italic">
                    {t.experienceTip}
                  </p>
                </div>
              )}

              {step.id === 'education' && (
                <div className="space-y-6">
                  <TextareaField
                    icon={GraduationCap}
                    label={t.lblEducation}
                    value={data.education}
                    onChange={(v) => update('education', v)}
                    error={errors.education}
                    rows={6}
                    placeholder={t.phEducation}
                  />
                  <TextareaField
                    icon={Sparkles}
                    label={t.lblSkills}
                    value={data.skills}
                    onChange={(v) => update('skills', v)}
                    error={errors.skills}
                    rows={4}
                    placeholder={t.phSkills}
                  />
                  <TextareaField
                    icon={Award}
                    label={t.lblAchievements}
                    value={data.achievements}
                    onChange={(v) => update('achievements', v)}
                    rows={4}
                    placeholder={t.phAchievements}
                  />
                </div>
              )}

              {step.id === 'preferences' && (
                <>
                  <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-700">
                      {t.prefNotOnCv}
                    </p>
                    <p className="text-xs font-bold text-slate-600 mt-1 italic">
                      {t.prefNotOnCvDesc}
                    </p>
                  </div>
                  <div className="space-y-6">
                    <Field icon={Target} label={t.lblTargetJob} value={data.targetJob} onChange={(v) => update('targetJob', v)} error={errors.targetJob} placeholder={t.phTargetJob} />
                    <TextareaField icon={Clock} label={t.lblAvailability} value={data.availability} onChange={(v) => update('availability', v)} error={errors.availability} rows={2} placeholder={t.phAvailability} />
                    <Field icon={DollarSign} label={t.lblSalary} value={data.salaryIndication} onChange={(v) => update('salaryIndication', v)} placeholder={t.phSalary} />
                    <Field icon={Building2} label={t.lblPreferredSector} value={data.preferredSector} onChange={(v) => update('preferredSector', v)} error={errors.preferredSector} placeholder={t.phPreferredSector} />
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-12 pt-8 border-t-2 border-slate-100">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="bg-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-4 h-4" /> {t.btnPrev}
                </button>
                <button
                  onClick={goNext}
                  className="bg-blue-600 text-white px-12 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {currentStep === STEPS.length - 1 ? t.btnToReview : t.btnNext}
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
                    {t.reviewTitle}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {t.reviewSubtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-12">
                <ReviewSection title={t.rsPersonal} items={[
                  [t.rvName, data.fullName],
                  [t.rvEmail, data.email],
                  [t.rvPhone, data.phone],
                  [t.rvLocation, data.location],
                  [t.rvBirthDate, data.birthDate || '—'],
                ]} />
                <ReviewSection title={t.rsProfile} items={[
                  [t.rvJobTitle, data.jobTitle],
                  [t.rvLanguages, data.languages],
                ]} multiline={[[t.rvSummary, data.summary]]} />
                <ReviewSection title={t.rsExperience} multiline={[[t.rvExperience, data.experience]]} />
                <ReviewSection title={t.rsEducation} multiline={[
                  [t.rvEducation, data.education],
                  [t.rvSkills, data.skills],
                  ...(data.achievements ? [[t.rvAchievements, data.achievements] as [string, string]] : []),
                ]} />
                <ReviewSection title={t.rsPreferences} items={[
                  [t.rvTargetJob, data.targetJob],
                  [t.rvAvailability, data.availability],
                  [t.rvSalary, data.salaryIndication || '—'],
                  [t.rvSector, data.preferredSector],
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
                  <ArrowLeft className="w-4 h-4" /> {t.btnBackEdit}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-12 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.btnSubmitting}
                    </>
                  ) : (
                    <>
                      {t.btnSubmit} <ArrowRight className="w-4 h-4" />
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
