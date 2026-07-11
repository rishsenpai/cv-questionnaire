'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
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
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';

const APPLICATIONS_EMAIL = 'info@jobparsing.com';
const CONTACT_PHONE = '+597 123-4567';
const MAX_FILE_BYTES = 4.5 * 1024 * 1024;

const WERKGEVERS_T = {
  nl: {
    // Server / fetch errors
    errServerBusy: 'De matching duurde te lang — de server is nu te druk. Probeer het over een moment opnieuw.',
    errFileTooLargeServer: 'Het bestand is te groot om te verwerken. Plak de tekst of gebruik een kleiner bestand.',
    errServerGeneric: 'Er ging iets mis op de server (foutcode {code}). Probeer het later opnieuw.',
    // Client validatie / status
    errNoQuery: 'Geef een zoekterm op',
    errSearchFailed: 'Zoeken mislukt',
    errConnection: 'Verbinding mislukt',
    errNoVacancy: 'Plak een vacaturetekst of upload een PDF/DOCX',
    errNoContact: 'Vul een e-mail of telefoonnummer in zodat we contact kunnen opnemen',
    consent1: 'Door je aanvraag te versturen ga je akkoord met de ',
    consentPrivacy: 'privacyverklaring',
    consent2: ' en de ',
    consentTerms: 'algemene voorwaarden',
    consent3: '.',
    errFileTooLarge: 'Bestand te groot (max 4.5 MB)',
    errMatchFailed: 'Matching mislukt',
    // Hero
    heroBadge: 'Voor werkgevers',
    heroTitleA: 'Vind direct kandidaten',
    heroTitleHighlight: 'zonder gedoe.',
    heroSubtitle: 'Plak je vacaturetekst, krijg meteen geanonimiseerde matches uit onze CV-database. Geen account nodig — bel of mail ons als een kandidaat je interesseert.',
    // Quick search
    quickTitle: 'Snel zoeken op functie / vaardigheid',
    quickSubtitle: 'Geanonimiseerde profielen — geen account nodig',
    quickPlaceholder: "Bv. 'software developer', 'accountant', 'electrician'...",
    search: 'Zoeken',
    quickCandidatesFoundFor: 'kandidaten gevonden voor',
    quickNoResults: 'Geen profielen gevonden voor deze zoekterm. Probeer een andere term of plak hieronder de volledige vacaturetekst.',
    quickClickHint: 'Klik op een kandidaat om contactgegevens te zien. Voor diepere matching: vul hieronder je volledige vacaturetekst in.',
    // Form
    step1Title: 'Stap 1 — Vacature',
    step1Subtitle: 'Plak de tekst óf upload een PDF/DOCX',
    vacancyTextLabel: 'Vacaturetekst',
    vacancyTextPlaceholder: 'Plak hier de volledige vacaturetekst — functie, vereisten, locatie...',
    vacancyTitleLabel: 'Vacaturetitel (optioneel)',
    vacancyTitlePlaceholder: 'Bv. Senior Software Engineer',
    uploadLabel: 'Of upload bestand',
    uploadButton: 'PDF of DOCX kiezen',
    step2Title: 'Stap 2 — Contact',
    step2Subtitle: 'Zodat we je kunnen bereiken als je een match wilt',
    companyLabel: 'Bedrijf',
    companyPlaceholder: 'Bedrijfsnaam',
    contactPersonLabel: 'Contactpersoon',
    contactPersonPlaceholder: 'Voor- en achternaam',
    emailLabel: 'E-mail *',
    emailPlaceholder: 'naam@bedrijf.com',
    phoneLabel: 'Telefoon *',
    phonePlaceholder: '+597 ... of +31 ...',
    contactRequired: '* E-mail óf telefoon is verplicht',
    matching: 'Matching...',
    findMatches: 'Vind matches',
    newSearch: 'Nieuwe zoekopdracht',
    // Results
    resultsBadge: 'Geanonimiseerde matches',
    noMatches: 'Geen matches gevonden',
    candidatesFound: 'kandidaten gevonden',
    fromCvsPrefix: 'Uit',
    fromCvsSuffix: "CV's in onze database",
    requestSaved: '✓ Aanvraag opgeslagen',
    contactWithin1Day: 'We nemen binnen 1 werkdag contact op',
    noSuitableCandidates: 'Op dit moment hebben we geen passende kandidaten',
    requestSavedNote: 'We hebben je aanvraag opgeslagen — zodra een passend profiel binnenkomt nemen we contact op.',
    topMatch: 'Top match',
    anonymousProfile: 'Anoniem profiel',
    matchLabel: 'Match',
    contactCta: 'Neem contact op',
    // How it works
    step1CardTitle: '1. Plak vacature',
    step1CardDesc: 'Tekst of bestand. Geen account.',
    step2CardTitle: '2. Zie matches',
    step2CardDesc: 'Direct geanonimiseerde kandidaten met match-score.',
    step3CardTitle: '3. Neem contact op',
    step3CardDesc: 'Bel of mail ons om een kandidaat te bereiken.',
    // Contact modal
    modalBadge: 'Kandidaat aanvragen',
    modalIntroPrefix: 'Wil je in contact komen met deze kandidaat',
    modalIntroSuffix: '% match)? Bel ons of stuur een email — vermeld het CV-nummer.',
    callLabel: 'Bel',
    mailLabel: 'Mail',
    emailSubjectPrefix: 'Aanvraag CV',
    emailGreeting: 'Hoi,',
    emailBodyLinePrefix: 'Ik wil graag in contact komen met kandidaat',
    emailMyVacancy: 'Mijn vacature:',
    emailSignoff: 'Met vriendelijke groet,',
    mentionPrefix: 'Vermeld',
    mentionSuffix: 'in je bericht zodat we de juiste kandidaat erbij kunnen pakken.',
    close: 'Sluiten',
  },
  en: {
    // Server / fetch errors
    errServerBusy: 'Matching took too long — the server is busy right now. Please try again in a moment.',
    errFileTooLargeServer: 'The file is too large to process. Paste the text or use a smaller file.',
    errServerGeneric: 'Something went wrong on the server (error code {code}). Please try again later.',
    // Client validation / status
    errNoQuery: 'Enter a search term',
    errSearchFailed: 'Search failed',
    errConnection: 'Connection failed',
    errNoVacancy: 'Paste a vacancy text or upload a PDF/DOCX',
    errNoContact: 'Enter an email or phone number so we can reach you',
    consent1: 'By submitting your request you agree to the ',
    consentPrivacy: 'privacy statement',
    consent2: ' and the ',
    consentTerms: 'terms & conditions',
    consent3: '.',
    errFileTooLarge: 'File too large (max 4.5 MB)',
    errMatchFailed: 'Matching failed',
    // Hero
    heroBadge: 'For employers',
    heroTitleA: 'Find candidates instantly',
    heroTitleHighlight: 'no hassle.',
    heroSubtitle: 'Paste your vacancy text and instantly get anonymised matches from our CV database. No account needed — call or email us if a candidate interests you.',
    // Quick search
    quickTitle: 'Quick search by role / skill',
    quickSubtitle: 'Anonymised profiles — no account needed',
    quickPlaceholder: "E.g. 'software developer', 'accountant', 'electrician'...",
    search: 'Search',
    quickCandidatesFoundFor: 'candidates found for',
    quickNoResults: 'No profiles found for this search term. Try a different term or paste the full vacancy text below.',
    quickClickHint: 'Click a candidate to see contact details. For deeper matching: fill in your full vacancy text below.',
    // Form
    step1Title: 'Step 1 — Vacancy',
    step1Subtitle: 'Paste the text or upload a PDF/DOCX',
    vacancyTextLabel: 'Vacancy text',
    vacancyTextPlaceholder: 'Paste the full vacancy text here — role, requirements, location...',
    vacancyTitleLabel: 'Vacancy title (optional)',
    vacancyTitlePlaceholder: 'E.g. Senior Software Engineer',
    uploadLabel: 'Or upload a file',
    uploadButton: 'Choose PDF or DOCX',
    step2Title: 'Step 2 — Contact',
    step2Subtitle: 'So we can reach you when you want a match',
    companyLabel: 'Company',
    companyPlaceholder: 'Company name',
    contactPersonLabel: 'Contact person',
    contactPersonPlaceholder: 'First and last name',
    emailLabel: 'Email *',
    emailPlaceholder: 'name@company.com',
    phoneLabel: 'Phone *',
    phonePlaceholder: '+597 ... or +31 ...',
    contactRequired: '* Email or phone is required',
    matching: 'Matching...',
    findMatches: 'Find matches',
    newSearch: 'New search',
    // Results
    resultsBadge: 'Anonymised matches',
    noMatches: 'No matches found',
    candidatesFound: 'candidates found',
    fromCvsPrefix: 'From',
    fromCvsSuffix: 'CVs in our database',
    requestSaved: '✓ Request saved',
    contactWithin1Day: 'We will get in touch within 1 business day',
    noSuitableCandidates: 'We have no suitable candidates at the moment',
    requestSavedNote: 'We have saved your request — as soon as a matching profile comes in we will get in touch.',
    topMatch: 'Top match',
    anonymousProfile: 'Anonymous profile',
    matchLabel: 'Match',
    contactCta: 'Contact us',
    // How it works
    step1CardTitle: '1. Paste vacancy',
    step1CardDesc: 'Text or file. No account.',
    step2CardTitle: '2. See matches',
    step2CardDesc: 'Anonymised candidates with match score, instantly.',
    step3CardTitle: '3. Contact us',
    step3CardDesc: 'Call or email us to reach a candidate.',
    // Contact modal
    modalBadge: 'Request candidate',
    modalIntroPrefix: 'Do you want to get in touch with this candidate',
    modalIntroSuffix: '% match)? Call us or send an email — mention the CV number.',
    callLabel: 'Call',
    mailLabel: 'Mail',
    emailSubjectPrefix: 'Request CV',
    emailGreeting: 'Hi,',
    emailBodyLinePrefix: 'I would like to get in touch with candidate',
    emailMyVacancy: 'My vacancy:',
    emailSignoff: 'Kind regards,',
    mentionPrefix: 'Mention',
    mentionSuffix: 'in your message so we can pull up the right candidate.',
    close: 'Close',
  },
  es: {
    // Server / fetch errors
    errServerBusy: 'La coincidencia tardó demasiado — el servidor está ocupado en este momento. Inténtalo de nuevo en un momento.',
    errFileTooLargeServer: 'El archivo es demasiado grande para procesarlo. Pega el texto o usa un archivo más pequeño.',
    errServerGeneric: 'Algo salió mal en el servidor (código de error {code}). Inténtalo de nuevo más tarde.',
    // Client validación / status
    errNoQuery: 'Introduce un término de búsqueda',
    errSearchFailed: 'La búsqueda falló',
    errConnection: 'La conexión falló',
    errNoVacancy: 'Pega un texto de vacante o sube un PDF/DOCX',
    errNoContact: 'Introduce un correo o número de teléfono para que podamos contactarte',
    consent1: 'Al enviar tu solicitud aceptas la ',
    consentPrivacy: 'declaración de privacidad',
    consent2: ' y los ',
    consentTerms: 'términos y condiciones',
    consent3: '.',
    errFileTooLarge: 'Archivo demasiado grande (máx. 4,5 MB)',
    errMatchFailed: 'La coincidencia falló',
    // Hero
    heroBadge: 'Para empleadores',
    heroTitleA: 'Encuentra candidatos al instante',
    heroTitleHighlight: 'sin complicaciones.',
    heroSubtitle: 'Pega el texto de tu vacante y obtén al instante coincidencias anonimizadas de nuestra base de datos de CV. Sin cuenta — llámanos o escríbenos si un candidato te interesa.',
    // Quick search
    quickTitle: 'Búsqueda rápida por puesto / habilidad',
    quickSubtitle: 'Perfiles anonimizados — sin cuenta necesaria',
    quickPlaceholder: "Ej. 'software developer', 'accountant', 'electrician'...",
    search: 'Buscar',
    quickCandidatesFoundFor: 'candidatos encontrados para',
    quickNoResults: 'No se encontraron perfiles para este término de búsqueda. Prueba otro término o pega abajo el texto completo de la vacante.',
    quickClickHint: 'Haz clic en un candidato para ver los datos de contacto. Para una coincidencia más profunda: completa abajo el texto completo de tu vacante.',
    // Form
    step1Title: 'Paso 1 — Vacante',
    step1Subtitle: 'Pega el texto o sube un PDF/DOCX',
    vacancyTextLabel: 'Texto de la vacante',
    vacancyTextPlaceholder: 'Pega aquí el texto completo de la vacante — puesto, requisitos, ubicación...',
    vacancyTitleLabel: 'Título de la vacante (opcional)',
    vacancyTitlePlaceholder: 'Ej. Senior Software Engineer',
    uploadLabel: 'O sube un archivo',
    uploadButton: 'Elegir PDF o DOCX',
    step2Title: 'Paso 2 — Contacto',
    step2Subtitle: 'Para que podamos contactarte cuando quieras una coincidencia',
    companyLabel: 'Empresa',
    companyPlaceholder: 'Nombre de la empresa',
    contactPersonLabel: 'Persona de contacto',
    contactPersonPlaceholder: 'Nombre y apellido',
    emailLabel: 'Correo *',
    emailPlaceholder: 'nombre@empresa.com',
    phoneLabel: 'Teléfono *',
    phonePlaceholder: '+597 ... o +31 ...',
    contactRequired: '* Correo o teléfono es obligatorio',
    matching: 'Buscando coincidencias...',
    findMatches: 'Encontrar coincidencias',
    newSearch: 'Nueva búsqueda',
    // Results
    resultsBadge: 'Coincidencias anonimizadas',
    noMatches: 'No se encontraron coincidencias',
    candidatesFound: 'candidatos encontrados',
    fromCvsPrefix: 'De',
    fromCvsSuffix: 'CV en nuestra base de datos',
    requestSaved: '✓ Solicitud guardada',
    contactWithin1Day: 'Te contactaremos dentro de 1 día hábil',
    noSuitableCandidates: 'Por el momento no tenemos candidatos adecuados',
    requestSavedNote: 'Hemos guardado tu solicitud — en cuanto llegue un perfil adecuado te contactaremos.',
    topMatch: 'Mejor coincidencia',
    anonymousProfile: 'Perfil anónimo',
    matchLabel: 'Coincidencia',
    contactCta: 'Contáctanos',
    // How it works
    step1CardTitle: '1. Pega la vacante',
    step1CardDesc: 'Texto o archivo. Sin cuenta.',
    step2CardTitle: '2. Ve las coincidencias',
    step2CardDesc: 'Candidatos anonimizados con puntuación de coincidencia, al instante.',
    step3CardTitle: '3. Contáctanos',
    step3CardDesc: 'Llámanos o escríbenos para contactar a un candidato.',
    // Contact modal
    modalBadge: 'Solicitar candidato',
    modalIntroPrefix: '¿Quieres ponerte en contacto con este candidato',
    modalIntroSuffix: '% de coincidencia)? Llámanos o envía un correo — menciona el número de CV.',
    callLabel: 'Llamar',
    mailLabel: 'Correo',
    emailSubjectPrefix: 'Solicitud CV',
    emailGreeting: 'Hola,',
    emailBodyLinePrefix: 'Me gustaría ponerme en contacto con el candidato',
    emailMyVacancy: 'Mi vacante:',
    emailSignoff: 'Un saludo cordial,',
    mentionPrefix: 'Menciona',
    mentionSuffix: 'en tu mensaje para que podamos localizar al candidato correcto.',
    close: 'Cerrar',
  },
};

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

interface QuickSearchResponse {
  success: boolean;
  message?: string;
  query?: string;
  totalCvs?: number;
  matches?: Array<{
    id: string;
    jobTitle: string;
    location: string;
    summary: string;
    topSkills: string[];
    matchScore: number;
  }>;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string).split(',')[1] || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Leest een API-antwoord veilig als JSON. Bij een niet-JSON body (bv. een
// HTML-foutpagina die Vercel teruggeeft als de functie time-out of crasht)
// geven we een leesbare melding i.p.v. de rauwe "Unexpected token '<'"-fout.
async function readJsonSafe<T>(
  res: Response,
  msgs: { busy: string; tooLarge: string; generic: string },
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text();
  try {
    if (text) return { ok: true, data: JSON.parse(text) as T };
  } catch {
    // valt door naar de foutmelding hieronder
  }
  if (res.status === 504 || res.status === 408 || res.status === 524) {
    return { ok: false, message: msgs.busy };
  }
  if (res.status === 413) {
    return { ok: false, message: msgs.tooLarge };
  }
  return { ok: false, message: msgs.generic.replace('{code}', String(res.status)) };
}

function VoorWerkgeversInner() {
  const t = useT(WERKGEVERS_T);
  const jsonMsgs = { busy: t.errServerBusy, tooLarge: t.errFileTooLargeServer, generic: t.errServerGeneric };
  const params = useSearchParams();
  const initialQuery = params.get('q') || '';

  const [quickQuery, setQuickQuery] = useState(initialQuery);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResults, setQuickResults] = useState<QuickSearchResponse | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

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

  const runQuickSearch = async (q: string) => {
    if (!q.trim()) {
      setQuickError(t.errNoQuery);
      return;
    }
    setQuickLoading(true);
    setQuickError(null);
    try {
      const res = await fetch(`/api/employer-public/search-cvs?q=${encodeURIComponent(q.trim())}`);
      const parsed = await readJsonSafe<QuickSearchResponse>(res, jsonMsgs);
      if (!parsed.ok) {
        setQuickError(parsed.message);
      } else if (!parsed.data.success) {
        setQuickError(parsed.data.message || t.errSearchFailed);
      } else {
        setQuickResults(parsed.data);
      }
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : t.errConnection);
    } finally {
      setQuickLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      runQuickSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vacancyText.trim() && !file) {
      setError(t.errNoVacancy);
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(t.errNoContact);
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError(t.errFileTooLarge);
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
      const parsed = await readJsonSafe<MatchResponse>(res, jsonMsgs);
      if (!parsed.ok) {
        setError(parsed.message);
        setLoading(false);
        return;
      }
      const data = parsed.data;
      if (!data.success) {
        setError(data.message || t.errMatchFailed);
        setLoading(false);
        return;
      }
      setResults(data);
      setLoading(false);
      window.scrollTo({ top: document.getElementById('results')?.offsetTop || 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errConnection);
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
            <Building2 className="w-3 h-3" /> {t.heroBadge}
          </div>
          <h1 className="text-5xl xs:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6 max-w-4xl">
            {t.heroTitleA}<br className="hidden md:block" /> <span className="text-blue-600 italic">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-slate-400 max-w-2xl">
            {t.heroSubtitle}
          </p>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Quick keyword search */}
        <section className="bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">{t.quickTitle}</h2>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">{t.quickSubtitle}</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={quickQuery}
              onChange={e => setQuickQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runQuickSearch(quickQuery); }}
              placeholder={t.quickPlaceholder}
              className="flex-1 border-2 border-slate-100 p-4 font-bold text-base outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={() => runQuickSearch(quickQuery)}
              disabled={quickLoading}
              className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t.search}
            </button>
          </div>
          {quickError && (
            <p className="mt-3 text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> {quickError}
            </p>
          )}

          {quickResults && quickResults.matches && (
            <div className="mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                {quickResults.matches.length} {t.quickCandidatesFoundFor} &quot;{quickResults.query}&quot;
              </p>
              {quickResults.matches.length === 0 ? (
                <p className="text-[11px] font-bold text-slate-400 italic">{t.quickNoResults}</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {quickResults.matches.slice(0, 8).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setContactMatch({ ...m, matchedTerms: [] })}
                      className="text-left bg-slate-50 border-2 border-slate-100 hover:border-blue-600 p-4 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5">CV #{m.id.slice(-6)}</span>
                        <span className={cn(
                          'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 text-white',
                          m.matchScore >= 70 ? 'bg-blue-600' : m.matchScore >= 40 ? 'bg-emerald-600' : 'bg-slate-400',
                        )}>
                          {m.matchScore}%
                        </span>
                      </div>
                      <p className="text-sm font-black uppercase tracking-tight italic mb-1 group-hover:text-blue-600 transition-colors">
                        {m.jobTitle}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mb-2">{m.location}</p>
                      {m.topSkills.length > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 truncate">
                          {m.topSkills.slice(0, 4).join(' · ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {quickResults.matches.length > 0 && (
                <p className="mt-4 text-[10px] font-bold text-slate-400 italic">
                  {t.quickClickHint}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Form */}
        <form onSubmit={submit} className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] space-y-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">{t.step1Title}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.step1Subtitle}</p>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest">{t.vacancyTextLabel}</label>
            <textarea
              value={vacancyText}
              onChange={e => setVacancyText(e.target.value)}
              rows={8}
              placeholder={t.vacancyTextPlaceholder}
              className="w-full border-2 border-slate-100 p-4 font-bold text-sm outline-none focus:border-black"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest">{t.vacancyTitleLabel}</label>
              <input
                type="text"
                value={vacancyTitle}
                onChange={e => setVacancyTitle(e.target.value)}
                placeholder={t.vacancyTitlePlaceholder}
                className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest">{t.uploadLabel}</label>
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
                <span className="truncate">{file ? file.name : t.uploadButton}</span>
              </button>
              {file && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
              )}
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">{t.step2Title}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">{t.step2Subtitle}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">{t.companyLabel}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder={t.companyPlaceholder}
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">{t.contactPersonLabel}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder={t.contactPersonPlaceholder}
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">{t.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest">{t.phoneLabel}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full border-2 border-slate-100 p-3 font-bold text-sm outline-none focus:border-black"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-3">{t.contactRequired}</p>
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.matching}</> : <><Target className="w-4 h-4" /> {t.findMatches}</>}
            </button>
            {results && (
              <button
                type="button"
                onClick={reset}
                className="border-2 border-black px-8 py-5 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
              >
                {t.newSearch}
              </button>
            )}
          </div>

          <p className="text-[10px] font-bold text-slate-400 italic text-center">
            {t.consent1}
            <Link href="/privacyverklaring" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentPrivacy}</Link>
            {t.consent2}
            <Link href="/algemene-voorwaarden" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentTerms}</Link>
            {t.consent3}
          </p>
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
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">{t.resultsBadge}</h2>
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                    {results.matches.length === 0 ? t.noMatches : `${results.matches.length} ${t.candidatesFound}`}
                  </h3>
                  {results.matches.length > 0 && results.totalCvs && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
                      {t.fromCvsPrefix} {results.totalCvs} {t.fromCvsSuffix}
                    </p>
                  )}
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-500 px-4 py-2">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.requestSaved}</p>
                  <p className="text-[10px] font-bold text-emerald-700">{t.contactWithin1Day}</p>
                </div>
              </div>

              {results.matches.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 p-16 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {t.noSuitableCandidates}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 italic">
                    {t.requestSavedNote}
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
                          <Sparkles className="w-3 h-3" /> {t.topMatch}
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-slate-900 text-white px-2 py-0.5">CV #{m.id.slice(-6)}</span>
                            <span className="text-slate-400">{t.anonymousProfile}</span>
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
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.matchLabel}</div>
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
                            {t.contactCta} <ArrowRight className="w-3 h-3" />
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
              { icon: Briefcase, title: t.step1CardTitle, desc: t.step1CardDesc },
              { icon: Target, title: t.step2CardTitle, desc: t.step2CardDesc },
              { icon: Phone, title: t.step3CardTitle, desc: t.step3CardDesc },
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
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t.modalBadge}</p>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">CV #{contactMatch.id.slice(-6)}</h3>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-sm font-bold text-slate-600">
                  {t.modalIntroPrefix} ({contactMatch.jobTitle}, {contactMatch.matchScore}{t.modalIntroSuffix}
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
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t.callLabel}</p>
                      <p className="text-base font-black tracking-tight">{CONTACT_PHONE}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${APPLICATIONS_EMAIL}?subject=${encodeURIComponent(t.emailSubjectPrefix)} %23${contactMatch.id.slice(-6)} - ${encodeURIComponent(contactMatch.jobTitle)}&body=${encodeURIComponent(`${t.emailGreeting}\n\n${t.emailBodyLinePrefix} CV #${contactMatch.id.slice(-6)} (${contactMatch.jobTitle}, ${contactMatch.matchScore}% match).\n\n${t.emailMyVacancy} ${results?.vacancyTitle || ''}\n\n${t.emailSignoff}\n${contactName || companyName || ''}`)}`}
                    className="flex items-center gap-4 bg-slate-50 border-2 border-black p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest">{t.mailLabel}</p>
                      <p className="text-base font-black tracking-tight truncate">{APPLICATIONS_EMAIL}</p>
                    </div>
                  </a>
                </div>
                <p className="text-[10px] font-bold text-slate-400">
                  {t.mentionPrefix} <strong>CV #{contactMatch.id.slice(-6)}</strong> {t.mentionSuffix}
                </p>
                <button
                  type="button"
                  onClick={() => setContactMatch(null)}
                  className="w-full border-2 border-black py-3 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-white transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VoorWerkgeversPage() {
  return (
    <Suspense fallback={null}>
      <VoorWerkgeversInner />
    </Suspense>
  );
}
