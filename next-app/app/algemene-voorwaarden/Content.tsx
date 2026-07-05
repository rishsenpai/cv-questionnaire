'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Scale, ShieldCheck, AlertTriangle, Mail } from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';

// Generieke voorwaarden voor jobparsing.com. Bewust kort, plain language, één
// pagina. Geen advocaat-bevestigde tekst — bedrijfsjurist moet hier nog langs.
const LAST_UPDATED = '21 mei 2026';
const COMPANY_NAME = 'Jobparsing+';
const COMPANY_EMAIL = 'info@jobparsing.com';
const JURISDICTION = 'Suriname';

const AVW_T = {
  nl: {
    heroEyebrow: 'Juridisch',
    heroTitleA: 'Algemene',
    heroTitleHighlight: 'Voorwaarden',
    heroSubtitle: 'De spelregels voor het gebruik van het Jobparsing+ platform.',
    lastUpdatedLabel: 'Laatst bijgewerkt:',

    a1_title: 'Wie zijn wij',
    a1_p1: '(hierna: "wij", "ons") exploiteert het platform op',
    a1_p2: '. Wij brengen werkzoekenden en werkgevers bij elkaar via AI-gedreven matching. Deze voorwaarden gelden voor iedereen die het platform gebruikt — werkzoekenden, werkgevers en bezoekers.',

    a2_title: 'Wat we doen',
    a2_intro: 'Jobparsing+ biedt onder andere:',
    a2_bullets: [
      'Een platform waar werkzoekenden hun CV kunnen uploaden of opbouwen.',
      'Een platform waar werkgevers vacatures kunnen plaatsen en kandidaten kunnen ontvangen.',
      'Geautomatiseerde matching tussen CV’s en vacatures op basis van AI.',
      'Geanonimiseerde introducties: pas bij wederzijdse interesse worden contactgegevens gedeeld.',
    ],
    a2_after_p1: 'Wij zijn een ',
    a2_after_strong: 'bemiddelend platform',
    a2_after_p2: ', geen werkgever en geen uitzendbureau. We sluiten geen arbeidsovereenkomst en zijn geen partij bij afspraken tussen werkzoekenden en werkgevers.',

    a3_title: 'Account & registratie',
    a3_bullets: [
      'Je gegevens moeten correct, actueel en volledig zijn.',
      'Je bent zelf verantwoordelijk voor het beheer en de geheimhouding van je inloggegevens.',
      'Eén account per persoon of bedrijf. Accounts zijn niet overdraagbaar.',
      'We mogen accounts blokkeren of verwijderen bij misbruik, valse informatie, schending van deze voorwaarden of wettelijke verplichtingen.',
    ],

    a4_title: 'Verplichtingen van werkzoekenden',
    a4_bullets: [
      'Je CV en profielinformatie zijn waarheidsgetrouw.',
      'Je gebruikt het platform alleen voor het zoeken naar werk voor jezelf.',
      'Je deelt geen vertrouwelijke informatie van derden zonder hun toestemming.',
      'Je begrijpt dat wij geen banen garanderen. Een match is een suggestie — een aanstelling is altijd ter beoordeling van de werkgever.',
    ],

    a5_title: 'Verplichtingen van werkgevers',
    a5_bullets: [
      'Geplaatste vacatures zijn echt, actueel en niet-misleidend.',
      'Je discrimineert niet op grond van afkomst, geslacht, leeftijd, religie, seksuele oriëntatie of handicap. Vacatureteksten reflecteren dit.',
      'Kandidaatgegevens (contact, CV, notities) gebruik je uitsluitend voor het invullen van de betreffende vacature en behandel je vertrouwelijk.',
      'Werving via het platform mag niet worden ingezet om kandidaten door te verkopen aan derden zonder hun toestemming.',
    ],

    a6_title: 'Prijzen & betaling',
    a6_bullets: [
      'Voor werkzoekenden is het platform gratis.',
      'Werkgevers betalen voor abonnementen, plaatsing of succesvolle matches volgens het tarief dat geldt op het moment van bestellen. Tarieven zijn vooraf zichtbaar.',
      'Tenzij anders vermeld, zijn bedragen in SRD (Suriname) of EUR (Nederland) en exclusief btw waar van toepassing.',
      'Facturen worden binnen 14 dagen na factuurdatum voldaan.',
      'Bij niet-tijdige betaling kunnen we de toegang tot betaalde functies pauzeren, na een eerste herinnering.',
    ],

    a7_title: 'AI-matching: hoe wij omgaan met geautomatiseerde beslissingen',
    a7_p1: 'Wij gebruiken AI om CV’s en vacatures aan elkaar te koppelen (onder andere via embeddings en re-ranking). AI-matches zijn ',
    a7_strong: 'suggesties',
    a7_p2: ', geen oordeel over een persoon. Een mens (admin of werkgever) neemt de uiteindelijke beslissing om iemand wel of niet te benaderen. Je hebt het recht om bezwaar te maken tegen volledig geautomatiseerde besluitvorming.',

    a8_title: 'Intellectueel eigendom',
    a8_p1: 'Alle rechten op het platform, de software, de matching-algoritmes, de huisstijl en de content (uitgezonderd door gebruikers aangeleverde CV’s en vacatures) liggen bij',
    a8_p2: '. Je krijgt een persoonlijke, niet-exclusieve, niet-overdraagbare licentie om het platform te gebruiken voor de doelen waarvoor het bedoeld is. Je CV/vacaturetekst blijft van jou, maar je geeft ons toestemming om die te verwerken en tonen voor matching.',

    a9_title: 'Privacy',
    a9_p1: 'We gaan zorgvuldig om met persoonsgegevens. CV-gegevens worden alleen gedeeld met een werkgever na een expliciete contactaanvraag en goedkeuring door ons team. Voor het gebruik en de bewaartermijnen geldt onze separate privacyverklaring. Het verzoek tot inzage, correctie of verwijdering kun je sturen naar ',
    a9_p2: '.',

    a10_title: 'Aansprakelijkheid',
    a10_body: 'Wij doen ons best om het platform betrouwbaar en up-to-date te houden, maar bieden geen garanties op beschikbaarheid, juistheid of geschiktheid voor een specifiek doel. Onze aansprakelijkheid voor directe schade is beperkt tot het bedrag dat een werkgever in de voorgaande 12 maanden aan ons heeft betaald voor de betreffende dienst. Indirecte schade (winstderving, reputatieschade, gevolgschade) is uitgesloten, voor zover wettelijk toegestaan.',

    a11_title: 'Opzegging',
    a11_bullets: [
      'Je kunt je account op elk moment opzeggen.',
      'Betaalde abonnementen lopen door tot het einde van de afgesproken periode, tenzij anders schriftelijk overeengekomen.',
      'Wij mogen je toegang opzeggen of opschorten als je in strijd handelt met deze voorwaarden of de wet.',
    ],

    a12_title: 'Wijzigingen',
    a12_body: 'We kunnen deze voorwaarden van tijd tot tijd aanpassen. Bij belangrijke wijzigingen brengen we je op de hoogte via e-mail of via een melding in het platform. De versiedatum bovenaan deze pagina geeft aan welke versie geldt.',

    a13_title: 'Toepasselijk recht & geschillen',
    a13_p1: 'Op deze voorwaarden is het recht van ',
    a13_p2: ' van toepassing. Geschillen leggen we eerst voor aan elkaar; lukt het niet om er onderling uit te komen, dan beslecht de bevoegde rechter in ',
    a13_p3: '. Werkgevers en werkzoekenden in Nederland kunnen uiteraard ook hun lokale consumentenrechten inroepen waar dat dwingend van toepassing is.',

    a14_title: 'Sancties & naleving',
    a14_p1: 'Je verklaart dat je niet voorkomt op een sanctielijst van de VN, EU, VS (OFAC) of een andere bevoegde autoriteit, en dat je niet handelt namens een persoon of entiteit die daarop voorkomt. Je gebruikt het platform niet in strijd met geldende sanctie-, export- of anti-witwasregels.',
    a14_p2: 'Wij mogen een account of vacature direct opschorten, weigeren of verwijderen als er een redelijk vermoeden is van betrokkenheid bij sancties, fraude, mensenhandel, dwangarbeid of andere illegale of misleidende arbeidspraktijken. Waar wettelijk vereist, melden wij dit bij de bevoegde instanties.',

    a15_title: 'Contact',
    a15_p1: 'Heb je vragen over deze voorwaarden of over je rechten? Mail ons op ',
    a15_p2: '. We reageren meestal binnen 1 werkdag.',

    versionLabel: 'Versie',
    btnHome: 'Terug naar home',
    btnAbout: 'Over ons',
  },

  en: {
    heroEyebrow: 'Legal',
    heroTitleA: 'Terms &',
    heroTitleHighlight: 'Conditions',
    heroSubtitle: 'The ground rules for using the Jobparsing+ platform.',
    lastUpdatedLabel: 'Last updated:',

    a1_title: 'Who we are',
    a1_p1: '(hereafter: "we", "us") operates the platform at',
    a1_p2: '. We connect job seekers and employers through AI-driven matching. These terms apply to everyone who uses the platform — job seekers, employers and visitors.',

    a2_title: 'What we do',
    a2_intro: 'Jobparsing+ offers, among other things:',
    a2_bullets: [
      'A platform where job seekers can upload or build their CV.',
      'A platform where employers can post vacancies and receive candidates.',
      'Automated matching between CVs and vacancies based on AI.',
      'Anonymised introductions: contact details are only shared once there is mutual interest.',
    ],
    a2_after_p1: 'We are an ',
    a2_after_strong: 'intermediary platform',
    a2_after_p2: ', not an employer and not a staffing agency. We do not conclude any employment contract and are not a party to arrangements between job seekers and employers.',

    a3_title: 'Account & registration',
    a3_bullets: [
      'Your details must be accurate, up to date and complete.',
      'You are responsible for managing and keeping your login credentials confidential.',
      'One account per person or company. Accounts are non-transferable.',
      'We may block or delete accounts in the event of misuse, false information, breach of these terms or legal obligations.',
    ],

    a4_title: 'Obligations of job seekers',
    a4_bullets: [
      'Your CV and profile information are truthful.',
      'You use the platform only to look for work for yourself.',
      'You do not share confidential information of third parties without their consent.',
      'You understand that we do not guarantee jobs. A match is a suggestion — any appointment is always at the employer’s discretion.',
    ],

    a5_title: 'Obligations of employers',
    a5_bullets: [
      'Posted vacancies are genuine, current and not misleading.',
      'You do not discriminate on the basis of origin, gender, age, religion, sexual orientation or disability. Vacancy texts reflect this.',
      'You use candidate data (contact details, CV, notes) solely to fill the relevant vacancy and treat it confidentially.',
      'Recruitment via the platform may not be used to resell candidates to third parties without their consent.',
    ],

    a6_title: 'Pricing & payment',
    a6_bullets: [
      'For job seekers the platform is free.',
      'Employers pay for subscriptions, posting or successful matches according to the rate applicable at the time of ordering. Rates are shown in advance.',
      'Unless stated otherwise, amounts are in SRD (Suriname) or EUR (Netherlands) and exclusive of VAT where applicable.',
      'Invoices are paid within 14 days of the invoice date.',
      'In the event of late payment we may pause access to paid features, following a first reminder.',
    ],

    a7_title: 'AI matching: how we handle automated decisions',
    a7_p1: 'We use AI to match CVs and vacancies (among other things via embeddings and re-ranking). AI matches are ',
    a7_strong: 'suggestions',
    a7_p2: ', not a judgement about a person. A human (admin or employer) makes the final decision on whether or not to approach someone. You have the right to object to fully automated decision-making.',

    a8_title: 'Intellectual property',
    a8_p1: 'All rights in the platform, the software, the matching algorithms, the visual identity and the content (except for CVs and vacancies supplied by users) belong to',
    a8_p2: '. You receive a personal, non-exclusive, non-transferable licence to use the platform for the purposes for which it is intended. Your CV/vacancy text remains yours, but you grant us permission to process and display it for matching.',

    a9_title: 'Privacy',
    a9_p1: 'We handle personal data with care. CV data is only shared with an employer after an explicit contact request and approval by our team. Our separate privacy statement governs its use and retention periods. You can send any request for access, correction or deletion to ',
    a9_p2: '.',

    a10_title: 'Liability',
    a10_body: 'We do our best to keep the platform reliable and up to date, but we provide no guarantees as to availability, accuracy or fitness for a specific purpose. Our liability for direct damage is limited to the amount an employer has paid us in the preceding 12 months for the relevant service. Indirect damage (loss of profit, reputational damage, consequential damage) is excluded, to the extent permitted by law.',

    a11_title: 'Termination',
    a11_bullets: [
      'You can cancel your account at any time.',
      'Paid subscriptions continue until the end of the agreed period, unless otherwise agreed in writing.',
      'We may terminate or suspend your access if you act in breach of these terms or the law.',
    ],

    a12_title: 'Changes',
    a12_body: 'We may adjust these terms from time to time. For significant changes we will notify you by email or via a notice in the platform. The version date at the top of this page indicates which version applies.',

    a13_title: 'Governing law & disputes',
    a13_p1: 'These terms are governed by the law of ',
    a13_p2: '. We will first put disputes to each other; if we cannot resolve them between us, the competent court in ',
    a13_p3: ' will decide. Employers and job seekers in the Netherlands may of course also invoke their local consumer rights where these are mandatorily applicable.',

    a14_title: 'Sanctions & compliance',
    a14_p1: 'You declare that you do not appear on a sanctions list of the UN, EU, US (OFAC) or any other competent authority, and that you are not acting on behalf of a person or entity that does. You do not use the platform in breach of applicable sanctions, export or anti-money-laundering rules.',
    a14_p2: 'We may immediately suspend, refuse or delete an account or vacancy if there is a reasonable suspicion of involvement in sanctions, fraud, human trafficking, forced labour or other illegal or misleading labour practices. Where legally required, we report this to the competent authorities.',

    a15_title: 'Contact',
    a15_p1: 'Do you have questions about these terms or about your rights? Email us at ',
    a15_p2: '. We usually respond within 1 business day.',

    versionLabel: 'Version',
    btnHome: 'Back to home',
    btnAbout: 'About us',
  },

  es: {
    heroEyebrow: 'Legal',
    heroTitleA: 'Términos y',
    heroTitleHighlight: 'Condiciones',
    heroSubtitle: 'Las reglas para el uso de la plataforma Jobparsing+.',
    lastUpdatedLabel: 'Última actualización:',

    a1_title: 'Quiénes somos',
    a1_p1: '(en adelante: "nosotros") opera la plataforma en',
    a1_p2: '. Conectamos a candidatos y empleadores mediante emparejamiento impulsado por IA. Estas condiciones se aplican a todos los que utilizan la plataforma: candidatos, empleadores y visitantes.',

    a2_title: 'Qué hacemos',
    a2_intro: 'Jobparsing+ ofrece, entre otras cosas:',
    a2_bullets: [
      'Una plataforma donde los candidatos pueden subir o crear su CV.',
      'Una plataforma donde los empleadores pueden publicar vacantes y recibir candidatos.',
      'Emparejamiento automatizado entre CV y vacantes basado en IA.',
      'Presentaciones anonimizadas: los datos de contacto solo se comparten cuando hay interés mutuo.',
    ],
    a2_after_p1: 'Somos una ',
    a2_after_strong: 'plataforma intermediaria',
    a2_after_p2: ', no un empleador ni una agencia de empleo. No celebramos ningún contrato de trabajo y no somos parte en los acuerdos entre candidatos y empleadores.',

    a3_title: 'Cuenta y registro',
    a3_bullets: [
      'Tus datos deben ser correctos, actuales y completos.',
      'Eres responsable de la gestión y confidencialidad de tus credenciales de acceso.',
      'Una cuenta por persona o empresa. Las cuentas no son transferibles.',
      'Podemos bloquear o eliminar cuentas en caso de uso indebido, información falsa, incumplimiento de estas condiciones u obligaciones legales.',
    ],

    a4_title: 'Obligaciones de los candidatos',
    a4_bullets: [
      'Tu CV y la información de tu perfil son veraces.',
      'Utilizas la plataforma únicamente para buscar trabajo para ti mismo.',
      'No compartes información confidencial de terceros sin su consentimiento.',
      'Entiendes que no garantizamos empleos. Un match es una sugerencia; una contratación queda siempre a criterio del empleador.',
    ],

    a5_title: 'Obligaciones de los empleadores',
    a5_bullets: [
      'Las vacantes publicadas son reales, actuales y no engañosas.',
      'No discriminas por origen, género, edad, religión, orientación sexual o discapacidad. Los textos de las vacantes lo reflejan.',
      'Utilizas los datos de los candidatos (contacto, CV, notas) exclusivamente para cubrir la vacante correspondiente y los tratas de forma confidencial.',
      'El reclutamiento a través de la plataforma no puede utilizarse para revender candidatos a terceros sin su consentimiento.',
    ],

    a6_title: 'Precios y pago',
    a6_bullets: [
      'Para los candidatos la plataforma es gratuita.',
      'Los empleadores pagan por suscripciones, publicación o matches exitosos según la tarifa vigente en el momento del pedido. Las tarifas se muestran de antemano.',
      'Salvo indicación en contrario, los importes son en SRD (Surinam) o EUR (Países Bajos) y excluyen el IVA cuando corresponda.',
      'Las facturas se abonan dentro de los 14 días siguientes a la fecha de la factura.',
      'En caso de pago tardío, podemos pausar el acceso a las funciones de pago, tras un primer recordatorio.',
    ],

    a7_title: 'Emparejamiento con IA: cómo gestionamos las decisiones automatizadas',
    a7_p1: 'Utilizamos IA para emparejar CV y vacantes (entre otros, mediante embeddings y re-ranking). Los matches de IA son ',
    a7_strong: 'sugerencias',
    a7_p2: ', no un juicio sobre una persona. Una persona (administrador o empleador) toma la decisión final de contactar o no a alguien. Tienes derecho a oponerte a decisiones totalmente automatizadas.',

    a8_title: 'Propiedad intelectual',
    a8_p1: 'Todos los derechos sobre la plataforma, el software, los algoritmos de emparejamiento, la identidad visual y el contenido (salvo los CV y las vacantes aportados por los usuarios) pertenecen a',
    a8_p2: '. Recibes una licencia personal, no exclusiva e intransferible para usar la plataforma con los fines para los que está destinada. Tu CV o texto de vacante sigue siendo tuyo, pero nos das permiso para procesarlo y mostrarlo con fines de emparejamiento.',

    a9_title: 'Privacidad',
    a9_p1: 'Tratamos los datos personales con cuidado. Los datos del CV solo se comparten con un empleador tras una solicitud de contacto explícita y la aprobación de nuestro equipo. Nuestra declaración de privacidad independiente rige su uso y los plazos de conservación. Puedes enviar cualquier solicitud de acceso, corrección o eliminación a ',
    a9_p2: '.',

    a10_title: 'Responsabilidad',
    a10_body: 'Hacemos todo lo posible por mantener la plataforma fiable y actualizada, pero no ofrecemos garantías de disponibilidad, exactitud o idoneidad para un fin específico. Nuestra responsabilidad por daños directos se limita al importe que un empleador nos haya pagado en los 12 meses anteriores por el servicio correspondiente. Los daños indirectos (lucro cesante, daño reputacional, daños consecuentes) quedan excluidos, en la medida en que lo permita la ley.',

    a11_title: 'Cancelación',
    a11_bullets: [
      'Puedes cancelar tu cuenta en cualquier momento.',
      'Las suscripciones de pago continúan hasta el final del período acordado, salvo que se acuerde otra cosa por escrito.',
      'Podemos cancelar o suspender tu acceso si actúas en contra de estas condiciones o de la ley.',
    ],

    a12_title: 'Modificaciones',
    a12_body: 'Podemos ajustar estas condiciones de vez en cuando. En caso de cambios importantes, te informaremos por correo electrónico o mediante un aviso en la plataforma. La fecha de versión en la parte superior de esta página indica qué versión se aplica.',

    a13_title: 'Ley aplicable y controversias',
    a13_p1: 'Estas condiciones se rigen por la ley de ',
    a13_p2: '. Primero plantearemos las controversias entre las partes; si no logramos resolverlas entre nosotros, decidirá el tribunal competente de ',
    a13_p3: '. Los empleadores y candidatos en los Países Bajos también pueden, por supuesto, invocar sus derechos de consumidor locales cuando sean de aplicación imperativa.',

    a14_title: 'Sanciones y cumplimiento',
    a14_p1: 'Declaras que no figuras en una lista de sanciones de la ONU, la UE, EE. UU. (OFAC) u otra autoridad competente, y que no actúas en nombre de una persona o entidad que figure en ella. No utilizas la plataforma en infracción de las normas de sanciones, exportación o prevención del blanqueo de capitales aplicables.',
    a14_p2: 'Podemos suspender, rechazar o eliminar de inmediato una cuenta o vacante si existe una sospecha razonable de implicación en sanciones, fraude, trata de personas, trabajo forzoso u otras prácticas laborales ilegales o engañosas. Cuando la ley lo exija, lo comunicaremos a las autoridades competentes.',

    a15_title: 'Contacto',
    a15_p1: '¿Tienes preguntas sobre estas condiciones o sobre tus derechos? Escríbenos a ',
    a15_p2: '. Normalmente respondemos en un plazo de 1 día hábil.',

    versionLabel: 'Versión',
    btnHome: 'Volver al inicio',
    btnAbout: 'Sobre nosotros',
  },
};

export default function AlgemeneVoorwaardenContent() {
  const t = useT(AVW_T);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero */}
      <section className="relative pt-32 pb-16 border-b-8 border-black overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 italic flex items-center gap-2">
            <Scale className="w-4 h-4" /> {t.heroEyebrow}
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
          <Article number="1" title={t.a1_title} icon={<FileText className="w-5 h-5" />}>
            <p>
              {COMPANY_NAME} {t.a1_p1}{' '}
              <span className="font-black">jobparsing.com</span>{t.a1_p2}
            </p>
          </Article>

          <Article number="2" title={t.a2_title} icon={<ShieldCheck className="w-5 h-5" />}>
            <p>{t.a2_intro}</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              {t.a2_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <p className="mt-3">
              {t.a2_after_p1}<strong>{t.a2_after_strong}</strong>{t.a2_after_p2}
            </p>
          </Article>

          <Article number="3" title={t.a3_title}>
            <ul className="list-disc pl-6 space-y-2">
              {t.a3_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="4" title={t.a4_title}>
            <ul className="list-disc pl-6 space-y-2">
              {t.a4_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="5" title={t.a5_title}>
            <ul className="list-disc pl-6 space-y-2">
              {t.a5_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="6" title={t.a6_title}>
            <ul className="list-disc pl-6 space-y-2">
              {t.a6_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="7" title={t.a7_title}>
            <p>
              {t.a7_p1}<strong>{t.a7_strong}</strong>{t.a7_p2}
            </p>
          </Article>

          <Article number="8" title={t.a8_title}>
            <p>
              {t.a8_p1}
              {' '}{COMPANY_NAME}{t.a8_p2}
            </p>
          </Article>

          <Article number="9" title={t.a9_title} icon={<ShieldCheck className="w-5 h-5" />}>
            <p>
              {t.a9_p1}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>{t.a9_p2}
            </p>
          </Article>

          <Article number="10" title={t.a10_title} icon={<AlertTriangle className="w-5 h-5" />}>
            <p>{t.a10_body}</p>
          </Article>

          <Article number="11" title={t.a11_title}>
            <ul className="list-disc pl-6 space-y-2">
              {t.a11_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Article>

          <Article number="12" title={t.a12_title}>
            <p>{t.a12_body}</p>
          </Article>

          <Article number="13" title={t.a13_title}>
            <p>
              {t.a13_p1}{JURISDICTION}{t.a13_p2}{JURISDICTION}{t.a13_p3}
            </p>
          </Article>

          <Article number="14" title={t.a14_title} icon={<Scale className="w-5 h-5" />}>
            <p>{t.a14_p1}</p>
            <p className="mt-3">{t.a14_p2}</p>
          </Article>

          <Article number="15" title={t.a15_title} icon={<Mail className="w-5 h-5" />}>
            <p>
              {t.a15_p1}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>{t.a15_p2}
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
                href="/over-ons"
                className="border-2 border-black px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
              >
                {t.btnAbout}
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
