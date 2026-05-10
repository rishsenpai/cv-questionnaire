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
      setErrorMsg('Bestand is groter dan 4.5 MB. Comprimeer of gebruik een ander bestand.');
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx) {
      setErrorMsg('Alleen PDF of Word (.docx) bestanden worden ondersteund.');
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
        setErrorMsg(data.message || 'Er ging iets mis bij het analyseren van je CV.');
        return;
      }
      setParsed(data.data as ParsedCV);
      setExtractedText(`${data.extractedTextLength} tekens`);
      setStage('review');
    } catch (err) {
      console.error(err);
      setStage('error');
      setErrorMsg('Verbinding mislukt. Probeer het opnieuw.');
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
        setErrorMsg(data.message || 'Opslaan mislukt.');
        return;
      }
      try {
        localStorage.setItem('jobparsing_last_cv', JSON.stringify({
          _id: data.cvId,
          fullName: parsed.fullName || '',
          email: parsed.email || '',
        }));
      } catch { /* ignore quota errors */ }
      router.push(`/mijn-matches?cvId=${encodeURIComponent(data.cvId)}`);
    } catch (err) {
      console.error(err);
      setStage('review');
      setErrorMsg('Verbinding mislukt. Probeer het opnieuw.');
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
            <Sparkles className="w-3 h-3" /> AI-Powered Parser
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
            Upload je <span className="text-blue-600 italic">CV</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-400 uppercase tracking-tight italic max-w-2xl">
            We analyseren je CV in seconden en koppelen je direct aan matchende vacatures.
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
              className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
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
                className={`border-4 border-dashed p-12 md:p-20 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50/30'
                }`}
              >
                <UploadCloud className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                  Sleep je CV hierheen
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Of klik om een bestand te kiezen
                </p>
                <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all">
                  Selecteer Bestand <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8">
                  PDF of Word (.docx) — max 4.5 MB
                </p>
              </div>

              {errorMsg && (
                <div className="mt-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{errorMsg}</p>
                </div>
              )}

              <div className="mt-12 grid md:grid-cols-3 gap-6">
                {[
                  { icon: Sparkles, title: 'AI Extractie', desc: 'Naam, ervaring, skills automatisch herkend' },
                  { icon: Code2, title: 'Smart Matching', desc: 'Direct gekoppeld aan onze vacaturedatabase' },
                  { icon: CheckCircle2, title: 'Gratis & Veilig', desc: 'Geen account nodig om te starten' },
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
                CV wordt geanalyseerd...
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
                {fileName}
              </p>
              <div className="space-y-3 max-w-md mx-auto text-left">
                {[
                  'Tekst extractie uit document',
                  'AI parsing (gpt-4o-mini)',
                  'Skills & ervaring normaliseren',
                  'Embedding genereren voor matching',
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
              fullName: parsed.fullName.trim().length < 2 ? 'Naam is verplicht (min. 2 tekens).' : null,
              email: !parsed.email.trim()
                ? 'E-mailadres is verplicht.'
                : !isValidEmail(parsed.email) ? 'Ongeldig e-mailadres (bv. naam@domein.com).' : null,
              phone: !parsed.phone.trim()
                ? 'Telefoonnummer is verplicht.'
                : !isValidNLOrSRPhone(parsed.phone) ? 'Geen geldig NL of SR nummer (bv. 06-12345678 of +597 8123456).' : null,
              jobTitle: parsed.jobTitle.trim().length < 2 ? 'Functie is verplicht.' : null,
            };
            const hasErrors = Object.values(errors).some(Boolean);
            return (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Geanalyseerd ({extractedText})
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                    Klopt deze info?
                  </h2>
                </div>
                <button
                  onClick={reset}
                  className="p-3 hover:bg-slate-100 transition-colors border-2 border-slate-200"
                  aria-label="Ander bestand kiezen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Field icon={User} label="Naam *" value={parsed.fullName} onChange={(v) => setParsed(p => p ? { ...p, fullName: v } : p)} error={errors.fullName} />
                <Field icon={Briefcase} label="Functie *" value={parsed.jobTitle} onChange={(v) => setParsed(p => p ? { ...p, jobTitle: v } : p)} error={errors.jobTitle} />
                <Field icon={Mail} label="E-mail *" value={parsed.email} type="email" onChange={(v) => setParsed(p => p ? { ...p, email: v } : p)} error={errors.email} />
                <Field icon={Phone} label="Telefoon *" value={parsed.phone} type="tel" onChange={(v) => setParsed(p => p ? { ...p, phone: v } : p)} error={errors.phone} />
                <Field icon={MapPin} label="Locatie" value={parsed.location} onChange={(v) => setParsed(p => p ? { ...p, location: v } : p)} />
                <Field icon={Sparkles} label="Talen" value={parsed.languages} onChange={(v) => setParsed(p => p ? { ...p, languages: v } : p)} />
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Skills</label>
                <textarea
                  value={parsed.skills}
                  onChange={(e) => setParsed(p => p ? { ...p, skills: e.target.value } : p)}
                  rows={2}
                  className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <details className="mb-6 border-2 border-slate-100">
                <summary className="p-4 cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                  Werkervaring & Opleiding tonen
                </summary>
                <div className="p-4 space-y-4 border-t-2 border-slate-100">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Werkervaring</label>
                    <textarea
                      value={parsed.experience}
                      onChange={(e) => setParsed(p => p ? { ...p, experience: e.target.value } : p)}
                      rows={6}
                      className="w-full p-4 border-2 border-slate-100 outline-none focus:border-black font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Opleiding</label>
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
                      Vul of corrigeer onderstaande velden:
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
                Bevestig & toon matches <ArrowRight className="w-5 h-5" />
              </button>
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
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">CV wordt opgeslagen</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Embedding wordt gegenereerd voor matching...
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
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Er ging iets mis</h2>
              <p className="text-sm font-bold text-slate-500 mb-8">{errorMsg}</p>
              <button
                onClick={reset}
                className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all"
              >
                Probeer opnieuw
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Geen CV bij de hand?{' '}
            <Link href="/cv-builder" className="text-blue-600 hover:underline">
              Bouw er hier één
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
