'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Mail,
  User,
  Briefcase,
  MapPin,
  Phone,
  Loader2,
  Edit2,
  X,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidNLOrSRPhone } from '@/lib/contactExtract';
import { trackEvent } from '@/lib/analytics-client';
import { useT } from '@/lib/i18n/LanguageProvider';

const CVUPLOAD_T = {
  nl: {
    badge: 'AI-Powered Parser',
    uploadPre: 'Upload je',
    uploadPost: '',
    heroSubtitle: 'We analyseren je CV in seconden en koppelen je direct aan matchende vacatures.',
    dropTitle: 'Sleep je CV hierheen',
    dropSubtitle: 'Of klik om een bestand te kiezen',
    selectFile: 'Selecteer Bestand',
    fileHint: 'PDF of Word (.docx) — max 4.5 MB',
    feat1Title: 'AI Extractie',
    feat1Desc: 'Naam, ervaring, skills automatisch herkend',
    feat2Title: 'Smart Matching',
    feat2Desc: 'Direct gekoppeld aan onze vacaturedatabase',
    feat3Title: 'Gratis & Veilig',
    feat3Desc: 'Geen account nodig om te starten',
    analyzingTitle: 'CV wordt geanalyseerd...',
    step1: 'Tekst extractie uit document',
    step2: 'AI parsing (gpt-4o-mini)',
    step3: 'Skills & ervaring normaliseren',
    step4: 'Embedding genereren voor matching',
    analyzed: 'Geanalyseerd',
    chars: 'tekens',
    reviewTitle: 'Klopt deze info?',
    chooseOtherFile: 'Ander bestand kiezen',
    labelName: 'Naam *',
    labelJobTitle: 'Functie *',
    labelEmail: 'E-mail *',
    labelPhone: 'Telefoon *',
    labelLocation: 'Locatie',
    labelLanguages: 'Talen',
    labelSkills: 'Skills',
    toggleExpDetails: 'Werkervaring & Opleiding tonen',
    labelExperience: 'Werkervaring',
    labelEducation: 'Opleiding',
    fixFields: 'Vul of corrigeer onderstaande velden:',
    confirmShowMatches: 'Bevestig & toon matches',
    savingTitle: 'CV wordt opgeslagen',
    savingSubtitle: 'Embedding wordt gegenereerd voor matching...',
    errorTitle: 'Er ging iets mis',
    tryAgain: 'Probeer opnieuw',
    noCvPrompt: 'Geen CV bij de hand?',
    buildOne: 'Bouw er hier één',
    errNameRequired: 'Naam is verplicht (min. 2 tekens).',
    errEmailRequired: 'E-mailadres is verplicht.',
    errEmailInvalid: 'Ongeldig e-mailadres (bv. naam@domein.com).',
    errPhoneRequired: 'Telefoonnummer is verplicht.',
    errPhoneInvalid: 'Geen geldig NL of SR nummer (bv. 06-12345678 of +597 8123456).',
    errJobRequired: 'Functie is verplicht.',
    errFileTooLarge: 'Bestand is groter dan 4.5 MB. Comprimeer of gebruik een ander bestand.',
    errFileType: 'Alleen PDF of Word (.docx) bestanden worden ondersteund.',
    errParseFail: 'Er ging iets mis bij het analyseren van je CV.',
    errConnection: 'Verbinding mislukt. Probeer het opnieuw.',
    errSaveFail: 'Opslaan mislukt.',
    consent1: 'Door je CV te uploaden ga je akkoord met de ',
    consentPrivacy: 'privacyverklaring',
    consent2: ' en de ',
    consentTerms: 'algemene voorwaarden',
    consent3: '.',
  },
  en: {
    badge: 'AI-Powered Parser',
    uploadPre: 'Upload your',
    uploadPost: '',
    heroSubtitle: 'We analyze your CV in seconds and instantly match you to relevant vacancies.',
    dropTitle: 'Drag your CV here',
    dropSubtitle: 'Or click to choose a file',
    selectFile: 'Select File',
    fileHint: 'PDF or Word (.docx) — max 4.5 MB',
    feat1Title: 'AI Extraction',
    feat1Desc: 'Name, experience, skills recognized automatically',
    feat2Title: 'Smart Matching',
    feat2Desc: 'Instantly linked to our vacancy database',
    feat3Title: 'Free & Secure',
    feat3Desc: 'No account needed to get started',
    analyzingTitle: 'Analyzing CV...',
    step1: 'Extracting text from document',
    step2: 'AI parsing (gpt-4o-mini)',
    step3: 'Normalizing skills & experience',
    step4: 'Generating embedding for matching',
    analyzed: 'Analyzed',
    chars: 'characters',
    reviewTitle: 'Is this correct?',
    chooseOtherFile: 'Choose another file',
    labelName: 'Name *',
    labelJobTitle: 'Job title *',
    labelEmail: 'Email *',
    labelPhone: 'Phone *',
    labelLocation: 'Location',
    labelLanguages: 'Languages',
    labelSkills: 'Skills',
    toggleExpDetails: 'Show work experience & education',
    labelExperience: 'Work experience',
    labelEducation: 'Education',
    fixFields: 'Complete or correct the fields below:',
    confirmShowMatches: 'Confirm & show matches',
    savingTitle: 'Saving CV',
    savingSubtitle: 'Generating embedding for matching...',
    errorTitle: 'Something went wrong',
    tryAgain: 'Try again',
    noCvPrompt: 'No CV at hand?',
    buildOne: 'Build one here',
    errNameRequired: 'Name is required (min. 2 characters).',
    errEmailRequired: 'Email is required.',
    errEmailInvalid: 'Invalid email address (e.g. name@domain.com).',
    errPhoneRequired: 'Phone number is required.',
    errPhoneInvalid: 'Not a valid NL or SR number (e.g. 06-12345678 or +597 8123456).',
    errJobRequired: 'Job title is required.',
    errFileTooLarge: 'File is larger than 4.5 MB. Compress it or use another file.',
    errFileType: 'Only PDF or Word (.docx) files are supported.',
    errParseFail: 'Something went wrong while analyzing your CV.',
    errConnection: 'Connection failed. Please try again.',
    errSaveFail: 'Saving failed.',
    consent1: 'By uploading your CV you agree to the ',
    consentPrivacy: 'privacy statement',
    consent2: ' and the ',
    consentTerms: 'terms & conditions',
    consent3: '.',
  },
  es: {
    badge: 'Analizador con IA',
    uploadPre: 'Sube tu',
    uploadPost: '',
    heroSubtitle: 'Analizamos tu CV en segundos y te conectamos al instante con vacantes que coinciden.',
    dropTitle: 'Arrastra tu CV aquí',
    dropSubtitle: 'O haz clic para elegir un archivo',
    selectFile: 'Seleccionar archivo',
    fileHint: 'PDF o Word (.docx) — máx 4.5 MB',
    feat1Title: 'Extracción con IA',
    feat1Desc: 'Nombre, experiencia y habilidades reconocidos automáticamente',
    feat2Title: 'Emparejamiento inteligente',
    feat2Desc: 'Conectado al instante con nuestra base de vacantes',
    feat3Title: 'Gratis y seguro',
    feat3Desc: 'No necesitas cuenta para empezar',
    analyzingTitle: 'Analizando CV...',
    step1: 'Extrayendo texto del documento',
    step2: 'Análisis con IA (gpt-4o-mini)',
    step3: 'Normalizando habilidades y experiencia',
    step4: 'Generando embedding para el emparejamiento',
    analyzed: 'Analizado',
    chars: 'caracteres',
    reviewTitle: '¿Es correcta esta información?',
    chooseOtherFile: 'Elegir otro archivo',
    labelName: 'Nombre *',
    labelJobTitle: 'Puesto *',
    labelEmail: 'Correo *',
    labelPhone: 'Teléfono *',
    labelLocation: 'Ubicación',
    labelLanguages: 'Idiomas',
    labelSkills: 'Habilidades',
    toggleExpDetails: 'Mostrar experiencia laboral y educación',
    labelExperience: 'Experiencia laboral',
    labelEducation: 'Educación',
    fixFields: 'Completa o corrige los campos siguientes:',
    confirmShowMatches: 'Confirmar y ver coincidencias',
    savingTitle: 'Guardando CV',
    savingSubtitle: 'Generando embedding para el emparejamiento...',
    errorTitle: 'Algo salió mal',
    tryAgain: 'Inténtalo de nuevo',
    noCvPrompt: '¿No tienes un CV a mano?',
    buildOne: 'Créalo aquí',
    errNameRequired: 'El nombre es obligatorio (mín. 2 caracteres).',
    errEmailRequired: 'El correo es obligatorio.',
    errEmailInvalid: 'Correo no válido (p. ej. nombre@dominio.com).',
    errPhoneRequired: 'El teléfono es obligatorio.',
    errPhoneInvalid: 'No es un número NL o SR válido (p. ej. 06-12345678 o +597 8123456).',
    errJobRequired: 'El puesto es obligatorio.',
    errFileTooLarge: 'El archivo supera los 4.5 MB. Comprímelo o usa otro archivo.',
    errFileType: 'Solo se admiten archivos PDF o Word (.docx).',
    errParseFail: 'Algo salió mal al analizar tu CV.',
    errConnection: 'Error de conexión. Inténtalo de nuevo.',
    errSaveFail: 'Error al guardar.',
    consent1: 'Al subir tu CV aceptas la ',
    consentPrivacy: 'declaración de privacidad',
    consent2: ' y los ',
    consentTerms: 'términos y condiciones',
    consent3: '.',
  },
};

interface ParsedCV {
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
}

type Stage = 'idle' | 'parsing' | 'review' | 'submitting' | 'error';

const MAX_FILE_BYTES = 4.5 * 1024 * 1024; // Vercel body limit on hobby plan

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CvUploadPage() {
  const t = useT(CVUPLOAD_T);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedCV | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg(t.errFileTooLarge);
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setErrorMsg(t.errFileType);
      return;
    }

    setStage('parsing');
    setFileName(file.name);
    setFileType(file.type);
    setFileSize(file.size);

    try {
      const base64 = await readFileAsBase64(file);
      setFileData(base64);

      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name, language: 'nl' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStage('error');
        setErrorMsg(data.message || t.errParseFail);
        return;
      }
      setParsed(data.data as ParsedCV);
      setExtractedText(String(data.extractedTextLength));
      setStage('review');
      trackEvent('cv_upload', { metadata: { fileType: file.type, fileSize: file.size } });
    } catch (err) {
      console.error(err);
      setStage('error');
      setErrorMsg(t.errConnection);
    }
  };

  const handleSubmit = async () => {
    if (!parsed) return;
    setStage('submitting');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/submit-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed,
          language: 'nl',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStage('review');
        setErrorMsg(data.message || t.errSaveFail);
        return;
      }
      try {
        localStorage.setItem('jobparsing_last_cv', JSON.stringify({
          _id: data.cvId,
          fullName: parsed.fullName || '',
          email: parsed.email || '',
        }));
      } catch { /* ignore quota errors */ }
      trackEvent('cv_submission', { metadata: { source: 'upload' } });
      router.push(`/mijn-matches?cvId=${encodeURIComponent(data.cvId)}`);
    } catch (err) {
      console.error(err);
      setStage('review');
      setErrorMsg(t.errConnection);
    }
  };

  const reset = () => {
    setStage('idle');
    setParsed(null);
    setFileName('');
    setFileData(null);
    setFileType('');
    setFileSize(0);
    setErrorMsg(null);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  void fileData;
  void fileType;
  void fileSize;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero */}
      <section className="bg-black text-white py-20 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
            {t.uploadPre} <span className="text-blue-600 italic">CV</span>{t.uploadPost}
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-400 uppercase tracking-tight italic max-w-2xl">
            {t.heroSubtitle}
          </p>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-4 border-black p-4 sm:p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] md:shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onInputChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`border-4 border-dashed p-6 sm:p-12 md:p-20 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50/30'
                }`}
              >
                <UploadCloud className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                  {t.dropTitle}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  {t.dropSubtitle}
                </p>
                <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all">
                  {t.selectFile} <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8">
                  {t.fileHint}
                </p>
              </div>

              <p className="text-[10px] font-bold text-slate-400 italic mt-4 text-center">
                {t.consent1}
                <Link href="/privacyverklaring" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentPrivacy}</Link>
                {t.consent2}
                <Link href="/algemene-voorwaarden" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentTerms}</Link>
                {t.consent3}
              </p>

              {errorMsg && (
                <div className="mt-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{errorMsg}</p>
                </div>
              )}

              <div className="mt-12 grid md:grid-cols-3 gap-3 md:gap-6">
                {[
                  { icon: Sparkles, title: t.feat1Title, desc: t.feat1Desc },
                  { icon: Code2, title: t.feat2Title, desc: t.feat2Desc },
                  { icon: CheckCircle2, title: t.feat3Title, desc: t.feat3Desc },
                ].map((f, i) => (
                  <div key={i} className="border-2 border-slate-100 p-6">
                    <f.icon className="w-6 h-6 text-blue-600 mb-3" />
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">{f.title}</h3>
                    <p className="text-xs font-bold text-slate-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {stage === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-4 border-black p-8 md:p-16 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] text-center"
            >
              <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [20, 50, 20], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    className="w-3 bg-blue-600"
                  />
                ))}
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">
                {t.analyzingTitle}
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
                {fileName}
              </p>
              <div className="space-y-3 max-w-md mx-auto text-left">
                {[
                  t.step1,
                  t.step2,
                  t.step3,
                  t.step4,
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
                    {step}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {stage === 'review' && parsed && (() => {
            const errors = {
              fullName: parsed.fullName.trim().length < 2 ? t.errNameRequired : null,
              email: !parsed.email.trim()
                ? t.errEmailRequired
                : !isValidEmail(parsed.email) ? t.errEmailInvalid : null,
              phone: !parsed.phone.trim()
                ? t.errPhoneRequired
                : !isValidNLOrSRPhone(parsed.phone) ? t.errPhoneInvalid : null,
              jobTitle: parsed.jobTitle.trim().length < 2 ? t.errJobRequired : null,
            };
            const hasErrors = Object.values(errors).some(Boolean);
            return (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-4 border-black p-4 sm:p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] md:shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {t.analyzed} ({extractedText} {t.chars})
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                    {t.reviewTitle}
                  </h2>
                </div>
                <button
                  onClick={reset}
                  className="p-3 hover:bg-slate-100 transition-colors border-2 border-slate-200"
                  aria-label={t.chooseOtherFile}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Field icon={User} label={t.labelName} value={parsed.fullName} onChange={(v) => setParsed(p => p ? { ...p, fullName: v } : p)} error={errors.fullName} />
                <Field icon={Briefcase} label={t.labelJobTitle} value={parsed.jobTitle} onChange={(v) => setParsed(p => p ? { ...p, jobTitle: v } : p)} error={errors.jobTitle} />
                <Field icon={Mail} label={t.labelEmail} value={parsed.email} type="email" onChange={(v) => setParsed(p => p ? { ...p, email: v } : p)} error={errors.email} />
                <Field icon={Phone} label={t.labelPhone} value={parsed.phone} type="tel" onChange={(v) => setParsed(p => p ? { ...p, phone: v } : p)} error={errors.phone} />
                <Field icon={MapPin} label={t.labelLocation} value={parsed.location} onChange={(v) => setParsed(p => p ? { ...p, location: v } : p)} />
                <Field icon={Sparkles} label={t.labelLanguages} value={parsed.languages} onChange={(v) => setParsed(p => p ? { ...p, languages: v } : p)} />
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{t.labelSkills}</label>
                <textarea
                  value={parsed.skills}
                  onChange={(e) => setParsed(p => p ? { ...p, skills: e.target.value } : p)}
                  rows={2}
                  className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <details className="mb-6 border-2 border-slate-100">
                <summary className="p-4 cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                  {t.toggleExpDetails}
                </summary>
                <div className="p-4 space-y-4 border-t-2 border-slate-100">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{t.labelExperience}</label>
                    <textarea
                      value={parsed.experience}
                      onChange={(e) => setParsed(p => p ? { ...p, experience: e.target.value } : p)}
                      rows={6}
                      className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{t.labelEducation}</label>
                    <textarea
                      value={parsed.education}
                      onChange={(e) => setParsed(p => p ? { ...p, education: e.target.value } : p)}
                      rows={4}
                      className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </details>

              {errorMsg && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{errorMsg}</p>
                </div>
              )}

              {hasErrors && (
                <div className="mb-6 flex items-start gap-3 bg-amber-50 border-2 border-amber-300 p-4 text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold space-y-1">
                    <p className="uppercase tracking-widest text-[10px] mb-2 font-black text-amber-900">
                      {t.fixFields}
                    </p>
                    {Object.values(errors).filter(Boolean).map((e, i) => (
                      <p key={i}>· {e}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={hasErrors}
                className="w-full bg-blue-600 text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                {t.confirmShowMatches} <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[10px] font-bold text-slate-400 italic mt-4 text-center">
                {t.consent1}
                <Link href="/privacyverklaring" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentPrivacy}</Link>
                {t.consent2}
                <Link href="/algemene-voorwaarden" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentTerms}</Link>
                {t.consent3}
              </p>
            </motion.div>
            );
          })()}

          {stage === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-4 border-black p-16 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] text-center"
            >
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">{t.savingTitle}</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {t.savingSubtitle}
              </p>
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-red-500 p-12 shadow-[16px_16px_0px_0px_rgba(239,68,68,0.2)] text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">{t.errorTitle}</h2>
              <p className="text-sm font-bold text-slate-500 mb-8">{errorMsg}</p>
              <button
                onClick={reset}
                className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all"
              >
                {t.tryAgain}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t.noCvPrompt}{' '}
            <Link href="/cv-builder" className="text-blue-600 hover:underline">
              {t.buildOne}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  error,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string | null;
}) {
  const [touched, setTouched] = useState(false);
  const showError = !!error && (touched || !!value);
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError || undefined}
          className={`w-full p-4 pr-10 border-2 outline-none font-bold text-sm bg-slate-50 focus:bg-white transition-all ${
            showError
              ? 'border-red-400 focus:border-red-600 bg-red-50/50'
              : 'border-slate-100 focus:border-black'
          }`}
        />
        <Edit2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 ${
          showError ? 'text-red-400' : 'text-slate-300 group-focus-within:text-blue-600'
        }`} />
      </div>
      {showError && (
        <p className="text-[11px] font-bold text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
