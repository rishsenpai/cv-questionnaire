'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Briefcase,
  Sparkles,
  Upload,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Target,
  FileText,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const APPLICATIONS_EMAIL = 'info@jobparsing.com';
const CONTACT_PHONE = '+597 123-4567';
const MAX_FILE_BYTES = 4.5 * 1024 * 1024;

interface AnonymousMatch {
  id: string;
  jobTitle: string;
  location: string;
  summary: string;
  topSkills: string[];
  matchScore: number;
  matchedTerms: string[];
}

interface MatchResponse {
  success: boolean;
  message?: string;
  leadId?: string;
  vacancyTitle?: string;
  totalCvs?: number;
  matches?: AnonymousMatch[];
  terms?: string[];
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VoorWerkgeversPage() {
  const [vacancyText, setVacancyText] = useState('');
  const [vacancyTitle, setVacancyTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [contactMatch, setContactMatch] = useState<AnonymousMatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vacancyText.trim() && !file) {
      setError('Plak een vacaturetekst of upload een PDF/DOCX');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Vul een e-mail of telefoonnummer in zodat we contact kunnen opnemen');
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError('Bestand te groot (max 4.5 MB)');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        vacancyText: vacancyText.trim(),
        vacancyTitle: vacancyTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (file) {
        payload.fileName = file.name;
        payload.fileType = file.type || 'application/octet-stream';
        payload.fileSize = file.size;
        payload.fileData = await readFileAsBase64(file);
      }

      const res = await fetch('/api/employer-public/match-vacancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: MatchResponse = await res.json();
      if (!data.success) {
        setError(data.message || 'Matching mislukt');
        setLoading(false);
        return;
      }
      setResults(data);
      setLoading(false);
      window.scrollTo({ top: document.getElementById('results')?.offsetTop || 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbinding mislukt');
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
    setVacancyText('');
    setVacancyTitle('');
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Hero */}
      <section className="bg-black text-white py-20 border-b-8 border-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            <Building2 className="w-3 h-3" /> Voor werkgevers
          </div>
          <h1 className="text-5xl xs:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6 max-w-4xl">
            Vind direct kandidaten<br className="hidden md:block" /> <span className="text-blue-600 italic">zonder gedoe.</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-slate-400 max-w-2xl">
            Plak je vacaturetekst, krijg meteen geanonimiseerde matches uit onze CV-database. Geen account nodig — bel of mail ons als een kandidaat je interesseert.
          </p>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Form */}
        <form onSubmit={submit} className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] space-y-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Stap 1 — Vacature</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plak de tekst óf upload een PDF/DOCX</p>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest">Vacaturetekst</label>
            <textarea
              value={vacancyText}
              onChange={e => setVacancyText(e.target.value)}
              rows={8}
              placeholder="Plak hier de volledige vacaturetekst — functie, vereisten, locatie..."
              className="w-full border-2 border-slate-100 p-4 font-bold text-sm outline-none focus:border-black"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest">Vacaturetitel (optioneel)</label>
              <input
                type="text"
                value={vacancyTitle}
                onChange={e => setVacancyTitle(e.target.value)}
                placeholder="Bv. Senior Software Engineer"
                className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest">Of upload bestand</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-slate-100 p-3 font-bold text-sm flex items-center gap-3 hover:border-black transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="truncate">{file ? file.name : 'PDF of DOCX kiezen'}</span>
              </button>
              {file && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
              )}
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Stap 2 — Contact</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Zodat we je kunnen bereiken als je een match wilt</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">Bedrijf</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Bedrijfsnaam"
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">Contactpersoon</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Voor- en achternaam"
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="naam@bedrijf.com"
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">Telefoon *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+597 ... of +31 ..."
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-3">* E-mail óf telefoon is verplicht</p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-10 py-5 font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Matching...</> : <><Target className="w-4 h-4" /> Vind matches</>}
            </button>
            {results && (
              <button
                type="button"
                onClick={reset}
                className="border-2 border-black px-8 py-5 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
              >
                Nieuwe zoekopdracht
              </button>
            )}
          </div>
        </form>

        {/* Results */}
        <AnimatePresence>
          {results && results.matches && (
            <motion.section
              id="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-slate-100">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Geanonimiseerde matches</h2>
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                    {results.matches.length === 0 ? 'Geen matches gevonden' : `${results.matches.length} kandidaten gevonden`}
                  </h3>
                  {results.matches.length > 0 && results.totalCvs && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
                      Uit {results.totalCvs} CV&apos;s in onze database
                    </p>
                  )}
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-500 px-4 py-2">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ Aanvraag opgeslagen</p>
                  <p className="text-[10px] font-bold text-emerald-700">We nemen binnen 1 werkdag contact op</p>
                </div>
              </div>

              {results.matches.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 p-16 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Op dit moment hebben we geen passende kandidaten
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 italic">
                    We hebben je aanvraag opgeslagen — zodra een passend profiel binnenkomt nemen we contact op.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {results.matches.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'bg-white border-2 p-6 md:p-8 transition-all relative shadow-[8px_8px_0px_0px_rgba(241,245,249,1)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.2)] hover:border-blue-600',
                        m.matchScore >= 70 ? 'border-blue-600/40' : 'border-slate-100',
                      )}
                    >
                      {m.matchScore >= 70 && (
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white px-3 py-1 font-black text-[9px] uppercase tracking-widest -rotate-3 border-2 border-black flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Top match
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-slate-900 text-white px-2 py-0.5">CV #{m.id.slice(-6)}</span>
                            <span className="text-slate-400">Anoniem profiel</span>
                          </div>

                          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic mb-3">
                            {m.jobTitle}
                          </h3>

                          {m.location && (
                            <p className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                              <MapPin className="w-3 h-3 text-blue-600" /> {m.location}
                            </p>
                          )}

                          {m.summary && (
                            <p className="text-sm font-bold text-slate-600 mb-4 line-clamp-3">{m.summary}</p>
                          )}

                          {m.topSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {m.topSkills.map(s => (
                                <span key={s} className="text-[10px] font-black bg-slate-50 border border-slate-200 px-2 py-1">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 self-stretch lg:self-center w-full lg:w-auto">
                          <div className="text-right shrink-0">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Match</div>
                            <div className={cn(
                              'text-4xl font-black leading-none italic',
                              m.matchScore >= 70 ? 'text-blue-600' : m.matchScore >= 50 ? 'text-emerald-600' : 'text-slate-700',
                            )}>
                              {m.matchScore}%
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setContactMatch(m)}
                            className="flex-1 lg:flex-none bg-black text-white px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                          >
                            Neem contact op <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* How it works */}
        {!results && (
          <section className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: '1. Plak vacature', desc: 'Tekst of bestand. Geen account.' },
              { icon: Target, title: '2. Zie matches', desc: 'Direct geanonimiseerde kandidaten met match-score.' },
              { icon: Phone, title: '3. Neem contact op', desc: 'Bel of mail ons om een kandidaat te bereiken.' },
            ].map(item => (
              <div key={item.title} className="bg-white border-2 border-black p-6">
                <div className="w-12 h-12 bg-black text-blue-400 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter italic mb-2">{item.title}</h3>
                <p className="text-[11px] font-bold text-slate-500">{item.desc}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Contact modal */}
      <AnimatePresence>
        {contactMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContactMatch(null)}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-4 border-black w-full max-w-lg shadow-[16px_16px_0px_0px_rgba(59,130,246,1)]"
            >
              <div className="bg-black text-white p-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Kandidaat aanvragen</p>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">CV #{contactMatch.id.slice(-6)}</h3>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-sm font-bold text-slate-600">
                  Wil je in contact komen met deze kandidaat ({contactMatch.jobTitle}, {contactMatch.matchScore}% match)? Bel ons of stuur een email — vermeld het CV-nummer.
                </p>
                <div className="space-y-3">
                  <a
                    href={`tel:${CONTACT_PHONE.replace(/\s|-/g, '')}`}
                    className="flex items-center gap-4 bg-blue-50 border-2 border-blue-600 p-4 hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bel</p>
                      <p className="text-base font-black tracking-tight">{CONTACT_PHONE}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${APPLICATIONS_EMAIL}?subject=Aanvraag CV %23${contactMatch.id.slice(-6)} - ${encodeURIComponent(contactMatch.jobTitle)}&body=${encodeURIComponent(`Hoi,\n\nIk wil graag in contact komen met kandidaat CV #${contactMatch.id.slice(-6)} (${contactMatch.jobTitle}, ${contactMatch.matchScore}% match).\n\nMijn vacature: ${results?.vacancyTitle || ''}\n\nMet vriendelijke groet,\n${contactName || companyName || ''}`)}`}
                    className="flex items-center gap-4 bg-slate-50 border-2 border-black p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest">Mail</p>
                      <p className="text-base font-black tracking-tight truncate">{APPLICATIONS_EMAIL}</p>
                    </div>
                  </a>
                </div>
                <p className="text-[10px] font-bold text-slate-400">
                  Vermeld <strong>CV #{contactMatch.id.slice(-6)}</strong> in je bericht zodat we de juiste kandidaat erbij kunnen pakken.
                </p>
                <button
                  type="button"
                  onClick={() => setContactMatch(null)}
                  className="w-full border-2 border-black py-3 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
