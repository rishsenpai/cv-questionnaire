'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Clock, AlertTriangle, Share2, UserCheck, Mail } from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';

// Privacyverklaring + disclaimer voor jobparsing.com, gebaseerd op de door de
// eigenaar aangeleverde toestemmingstekst. Zelfde opzet als de algemene
// voorwaarden. Geen advocaat-bevestigde tekst — bedrijfsjurist moet hier nog langs.
const LAST_UPDATED = '7 juli 2026';
const COMPANY_NAME = 'Jobparsing+';
const COMPANY_EMAIL = 'info@jobparsing.com';

const PV_T = {
  nl: {
    heroEyebrow: 'Juridisch',
    heroTitleA: 'Privacy-',
    heroTitleHighlight: 'verklaring',
    heroSubtitle: 'Hoe wij omgaan met je persoonsgegevens — en waarvoor je ons toestemming geeft.',
    lastUpdatedLabel: 'Laatst bijgewerkt:',

    a1_title: 'Welkom bij Jobparsing+',
    a1_p1: 'is een AI-gedreven platform dat kandidaten en werkgevers met elkaar verbindt door middel van intelligente matching van CV’s en vacatures. Door een account aan te maken, je CV te uploaden, een CV te creëren via ons platform, persoonsgegevens te verstrekken of op enige wijze gebruik te maken van onze diensten, verklaar je dat je deze privacyverklaring en de ',
    a1_link: 'algemene voorwaarden',
    a1_p2: ' hebt gelezen, begrijpt en hiermee akkoord gaat.',

    a2_title: 'Welke gegevens we verwerken',
    a2_intro: 'Door gebruik te maken van het platform geef je uitdrukkelijk toestemming aan Jobparsing+ en haar gelieerde ondernemingen om de door jou verstrekte persoonsgegevens te verzamelen, op te slaan, te analyseren en te verwerken. Daaronder valt onder andere:',
    a2_bullets: [
      'Je CV en de inhoud daarvan.',
      'Werkervaring, opleidingen en certificeringen.',
      'Vaardigheden en voorkeuren.',
      'Contactgegevens.',
      'Overige door jou ingevoerde informatie.',
    ],

    a3_title: 'Waarvoor we je gegevens gebruiken',
    a3_intro: 'Deze verwerking vindt plaats met als doel:',
    a3_bullets: [
      'Het vinden van passende vacatures.',
      'Het automatisch en handmatig matchen van je profiel met vacatures.',
      'Het voorstellen van je profiel aan potentiële werkgevers of opdrachtgevers.',
      'Het verbeteren van onze AI-matchingtechnologie en dienstverlening.',
      'Het onderhouden van contact met je over relevante carrière- en arbeidsmogelijkheden.',
    ],

    a4_title: 'Hoe lang we je gegevens bewaren',
    a4_p1: 'Je begrijpt en aanvaardt dat wij je gegevens gedurende een langere periode mogen bewaren en verwerken, zodat ook in de toekomst passende vacatures aan je kunnen worden aangeboden. Er geldt geen vooraf vastgestelde maximale zoekduur: je gegevens blijven beschikbaar zolang je account actief is, of totdat je je toestemming intrekt of verzoekt je gegevens te verwijderen — tenzij een langere bewaartermijn wettelijk is toegestaan of vereist.',

    a5_title: 'Disclaimer: geen garantie op werk',
    a5_p1: 'Wij spannen ons in om passende functies voor je te vinden, maar kunnen niet garanderen dat daadwerkelijk een passende vacature of arbeidsovereenkomst wordt gevonden. AI-matches zijn suggesties; een aanstelling is altijd ter beoordeling van de werkgever.',

    a6_title: 'Met wie we je gegevens delen',
    a6_p1: 'Je persoonsgegevens worden uitsluitend gedeeld met potentiële werkgevers, opdrachtgevers of andere relevante partijen indien dit noodzakelijk is voor bemiddeling naar werk of indien je daarvoor toestemming hebt gegeven, tenzij een andere wettelijke grondslag van toepassing is. Je contactgegevens worden pas met een werkgever gedeeld na een expliciete contactaanvraag en goedkeuring door ons team.',

    a7_title: 'Je rechten',
    a7_p1: 'Je behoudt te allen tijde het recht om je gegevens in te zien, te wijzigen, aan te vullen, te laten verwijderen of je toestemming in te trekken, overeenkomstig de toepasselijke privacywetgeving. Intrekking van je toestemming heeft geen invloed op de rechtmatigheid van de verwerking die heeft plaatsgevonden vóór de intrekking. Stuur je verzoek naar ',
    a7_p2: '.',

    a8_title: 'Juistheid van je gegevens',
    a8_p1: 'Door gebruik te maken van Jobparsing+ bevestig je dat de door jou verstrekte gegevens juist en volledig zijn en dat je bevoegd bent deze gegevens aan ons te verstrekken.',

    a9_title: 'Contact',
    a9_p1: 'Heb je vragen over deze privacyverklaring of over je gegevens? Mail ons op ',
    a9_p2: '. We reageren meestal binnen 1 werkdag.',

    versionLabel: 'Versie',
    btnHome: 'Terug naar home',
    btnTerms: 'Algemene voorwaarden',
  },

  en: {
    heroEyebrow: 'Legal',
    heroTitleA: 'Privacy',
    heroTitleHighlight: 'Statement',
    heroSubtitle: 'How we handle your personal data — and what you consent to.',
    lastUpdatedLabel: 'Last updated:',

    a1_title: 'Welcome to Jobparsing+',
    a1_p1: 'is an AI-driven platform that connects candidates and employers through intelligent matching of CVs and vacancies. By creating an account, uploading your CV, building a CV via our platform, providing personal data or using our services in any way, you declare that you have read, understand and agree to this privacy statement and the ',
    a1_link: 'terms & conditions',
    a1_p2: '.',

    a2_title: 'What data we process',
    a2_intro: 'By using the platform you expressly consent to Jobparsing+ and its affiliated companies collecting, storing, analysing and processing the personal data you provide. This includes, among other things:',
    a2_bullets: [
      'Your CV and its contents.',
      'Work experience, education and certifications.',
      'Skills and preferences.',
      'Contact details.',
      'Any other information you enter.',
    ],

    a3_title: 'What we use your data for',
    a3_intro: 'This processing takes place for the purpose of:',
    a3_bullets: [
      'Finding suitable vacancies.',
      'Automatically and manually matching your profile with vacancies.',
      'Proposing your profile to potential employers or clients.',
      'Improving our AI matching technology and services.',
      'Staying in touch with you about relevant career and employment opportunities.',
    ],

    a4_title: 'How long we keep your data',
    a4_p1: 'You understand and accept that we may retain and process your data for an extended period, so that suitable vacancies can also be offered to you in the future. There is no predetermined maximum search period: your data remains available as long as your account is active, or until you withdraw your consent or request deletion of your data — unless a longer retention period is legally permitted or required.',

    a5_title: 'Disclaimer: no guarantee of work',
    a5_p1: 'We make every effort to find suitable positions for you, but cannot guarantee that a suitable vacancy or employment contract will actually be found. AI matches are suggestions; any appointment is always at the employer’s discretion.',

    a6_title: 'Who we share your data with',
    a6_p1: 'Your personal data is only shared with potential employers, clients or other relevant parties if this is necessary for mediation towards work or if you have given consent, unless another legal basis applies. Your contact details are only shared with an employer after an explicit contact request and approval by our team.',

    a7_title: 'Your rights',
    a7_p1: 'You retain the right at all times to access, change, supplement or delete your data, or to withdraw your consent, in accordance with applicable privacy legislation. Withdrawal of your consent does not affect the lawfulness of processing carried out before the withdrawal. Send your request to ',
    a7_p2: '.',

    a8_title: 'Accuracy of your data',
    a8_p1: 'By using Jobparsing+ you confirm that the data you provide is accurate and complete, and that you are authorised to provide this data to us.',

    a9_title: 'Contact',
    a9_p1: 'Do you have questions about this privacy statement or about your data? Email us at ',
    a9_p2: '. We usually respond within 1 business day.',

    versionLabel: 'Version',
    btnHome: 'Back to home',
    btnTerms: 'Terms & conditions',
  },

  es: {
    heroEyebrow: 'Legal',
    heroTitleA: 'Declaración de',
    heroTitleHighlight: 'Privacidad',
    heroSubtitle: 'Cómo tratamos tus datos personales y a qué das tu consentimiento.',
    lastUpdatedLabel: 'Última actualización:',

    a1_title: 'Bienvenido a Jobparsing+',
    a1_p1: 'es una plataforma impulsada por IA que conecta a candidatos y empleadores mediante el emparejamiento inteligente de CV y vacantes. Al crear una cuenta, subir tu CV, crear un CV a través de nuestra plataforma, proporcionar datos personales o utilizar nuestros servicios de cualquier manera, declaras que has leído, entiendes y aceptas esta declaración de privacidad y los ',
    a1_link: 'términos y condiciones',
    a1_p2: '.',

    a2_title: 'Qué datos procesamos',
    a2_intro: 'Al utilizar la plataforma, das tu consentimiento expreso a Jobparsing+ y sus empresas afiliadas para recopilar, almacenar, analizar y procesar los datos personales que proporcionas. Esto incluye, entre otros:',
    a2_bullets: [
      'Tu CV y su contenido.',
      'Experiencia laboral, formación y certificaciones.',
      'Competencias y preferencias.',
      'Datos de contacto.',
      'Cualquier otra información que introduzcas.',
    ],

    a3_title: 'Para qué usamos tus datos',
    a3_intro: 'Este procesamiento se realiza con el fin de:',
    a3_bullets: [
      'Encontrar vacantes adecuadas.',
      'Emparejar tu perfil con vacantes de forma automática y manual.',
      'Proponer tu perfil a empleadores o clientes potenciales.',
      'Mejorar nuestra tecnología de emparejamiento con IA y nuestros servicios.',
      'Mantener el contacto contigo sobre oportunidades profesionales y laborales relevantes.',
    ],

    a4_title: 'Cuánto tiempo conservamos tus datos',
    a4_p1: 'Entiendes y aceptas que podemos conservar y procesar tus datos durante un período prolongado, para que también en el futuro se te puedan ofrecer vacantes adecuadas. No existe un período máximo de búsqueda predeterminado: tus datos permanecen disponibles mientras tu cuenta esté activa, o hasta que retires tu consentimiento o solicites la eliminación de tus datos, salvo que la ley permita o exija un período de conservación más largo.',

    a5_title: 'Descargo de responsabilidad: sin garantía de empleo',
    a5_p1: 'Nos esforzamos por encontrar puestos adecuados para ti, pero no podemos garantizar que realmente se encuentre una vacante o un contrato de trabajo adecuado. Los matches de IA son sugerencias; una contratación queda siempre a criterio del empleador.',

    a6_title: 'Con quién compartimos tus datos',
    a6_p1: 'Tus datos personales solo se comparten con empleadores potenciales, clientes u otras partes relevantes si es necesario para la mediación laboral o si has dado tu consentimiento, salvo que se aplique otra base legal. Tus datos de contacto solo se comparten con un empleador tras una solicitud de contacto explícita y la aprobación de nuestro equipo.',

    a7_title: 'Tus derechos',
    a7_p1: 'Conservas en todo momento el derecho a acceder a tus datos, modificarlos, completarlos, eliminarlos o retirar tu consentimiento, de conformidad con la legislación de privacidad aplicable. La retirada de tu consentimiento no afecta a la licitud del procesamiento realizado antes de la retirada. Envía tu solicitud a ',
    a7_p2: '.',

    a8_title: 'Exactitud de tus datos',
    a8_p1: 'Al utilizar Jobparsing+ confirmas que los datos que proporcionas son correctos y completos, y que estás autorizado a proporcionárnoslos.',

    a9_title: 'Contacto',
    a9_p1: '¿Tienes preguntas sobre esta declaración de privacidad o sobre tus datos? Escríbenos a ',
    a9_p2: '. Normalmente respondemos en un plazo de 1 día hábil.',

    versionLabel: 'Versión',
    btnHome: 'Volver al inicio',
    btnTerms: 'Términos y condiciones',
  },
};

export default function PrivacyverklaringContent() {
  const t = useT(PV_T);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero */}
      <section className="relative pt-32 pb-16 border-b-8 border-black overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 italic flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {t.heroEyebrow}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
            {t.heroTitleA} <br />
            <span className="text-blue-600 italic underline decoration-blue-100 decoration-8 underline-offset-8">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-base sm:text-lg font-bold uppercase tracking-tight italic text-slate-500 leading-tight max-w-2xl">
            {t.heroSubtitle}
          </p>
          <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t.lastUpdatedLabel} {LAST_UPDATED}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/2 pointer-events-none" />
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Article number="1" title={t.a1_title} icon={<ShieldCheck className="w-5 h-5" />}>
            <p>
              <span className="font-black">{COMPANY_NAME}</span> {t.a1_p1}
              <Link href="/algemene-voorwaarden" className="text-blue-600 underline font-black">
                {t.a1_link}
              </Link>{t.a1_p2}
            </p>
          </Article>

          <Article number="2" title={t.a2_title} icon={<Database className="w-5 h-5" />}>
            <p>{t.a2_intro}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              {t.a2_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="3" title={t.a3_title}>
            <p>{t.a3_intro}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              {t.a3_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="4" title={t.a4_title} icon={<Clock className="w-5 h-5" />}>
            <p>{t.a4_p1}</p>
          </Article>

          <Article number="5" title={t.a5_title} icon={<AlertTriangle className="w-5 h-5" />}>
            <p>{t.a5_p1}</p>
          </Article>

          <Article number="6" title={t.a6_title} icon={<Share2 className="w-5 h-5" />}>
            <p>{t.a6_p1}</p>
          </Article>

          <Article number="7" title={t.a7_title} icon={<UserCheck className="w-5 h-5" />}>
            <p>
              {t.a7_p1}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>{t.a7_p2}
            </p>
          </Article>

          <Article number="8" title={t.a8_title}>
            <p>{t.a8_p1}</p>
          </Article>

          <Article number="9" title={t.a9_title} icon={<Mail className="w-5 h-5" />}>
            <p>
              {t.a9_p1}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>{t.a9_p2}
            </p>
          </Article>

          <div className="border-t-2 border-slate-200 pt-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t.versionLabel} {LAST_UPDATED} · {COMPANY_NAME}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/"
                className="bg-black text-white px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-colors"
              >
                {t.btnHome}
              </Link>
              <Link
                href="/algemene-voorwaarden"
                className="border-2 border-black px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
              >
                {t.btnTerms}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Article({
  number, title, icon, children,
}: {
  number: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article id={`art-${number}`} className="scroll-mt-32">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Artikel {number}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic mb-4 leading-none">
        {title}
      </h2>
      <div className="text-base font-bold text-slate-600 leading-relaxed space-y-2">
        {children}
      </div>
    </article>
  );
}
