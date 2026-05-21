import React from 'react';
import Link from 'next/link';
import { FileText, Scale, ShieldCheck, AlertTriangle, Mail } from 'lucide-react';

export const metadata = {
  title: 'Algemene Voorwaarden — Jobparsing+',
  description: 'De algemene voorwaarden van Jobparsing+, een transparant matching-platform voor werk in Suriname, Nederland en Guyana.',
};

// Generieke voorwaarden voor jobparsing.com. Bewust kort, plain language, één
// pagina. Geen advocaat-bevestigde tekst — bedrijfsjurist moet hier nog langs.
const LAST_UPDATED = '21 mei 2026';
const COMPANY_NAME = 'Jobparsing+';
const COMPANY_EMAIL = 'info@jobparsing.com';
const JURISDICTION = 'Suriname';

export default function AlgemeneVoorwaardenPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero */}
      <section className="relative pt-32 pb-16 border-b-8 border-black overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 italic flex items-center gap-2">
            <Scale className="w-4 h-4" /> Juridisch
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
            Algemene <br />
            <span className="text-blue-600 italic underline decoration-blue-100 decoration-8 underline-offset-8">Voorwaarden</span>
          </h1>
          <p className="text-base sm:text-lg font-bold uppercase tracking-tight italic text-slate-500 leading-tight max-w-2xl">
            De spelregels voor het gebruik van het Jobparsing+ platform.
          </p>
          <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Laatst bijgewerkt: {LAST_UPDATED}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/2 pointer-events-none" />
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Article number="1" title="Wie zijn wij" icon={<FileText className="w-5 h-5" />}>
            <p>
              {COMPANY_NAME} (hierna: &quot;wij&quot;, &quot;ons&quot;) exploiteert het platform op{' '}
              <span className="font-black">jobparsing.com</span>. Wij brengen werkzoekenden en werkgevers bij
              elkaar via AI-gedreven matching. Deze voorwaarden gelden voor iedereen die het
              platform gebruikt — werkzoekenden, werkgevers en bezoekers.
            </p>
          </Article>

          <Article number="2" title="Wat we doen" icon={<ShieldCheck className="w-5 h-5" />}>
            <p>Jobparsing+ biedt onder andere:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Een platform waar werkzoekenden hun CV kunnen uploaden of opbouwen.</li>
              <li>Een platform waar werkgevers vacatures kunnen plaatsen en kandidaten kunnen ontvangen.</li>
              <li>Geautomatiseerde matching tussen CV&apos;s en vacatures op basis van AI.</li>
              <li>Geanonimiseerde introducties: pas bij wederzijdse interesse worden contactgegevens gedeeld.</li>
            </ul>
            <p className="mt-3">
              Wij zijn een <strong>bemiddelend platform</strong>, geen werkgever en geen uitzendbureau.
              We sluiten geen arbeidsovereenkomst en zijn geen partij bij afspraken tussen werkzoekenden
              en werkgevers.
            </p>
          </Article>

          <Article number="3" title="Account & registratie">
            <ul className="list-disc pl-6 space-y-2">
              <li>Je gegevens moeten correct, actueel en volledig zijn.</li>
              <li>Je bent zelf verantwoordelijk voor het beheer en de geheimhouding van je inloggegevens.</li>
              <li>Eén account per persoon of bedrijf. Accounts zijn niet overdraagbaar.</li>
              <li>
                We mogen accounts blokkeren of verwijderen bij misbruik, valse informatie, schending van
                deze voorwaarden of wettelijke verplichtingen.
              </li>
            </ul>
          </Article>

          <Article number="4" title="Verplichtingen van werkzoekenden">
            <ul className="list-disc pl-6 space-y-2">
              <li>Je CV en profielinformatie zijn waarheidsgetrouw.</li>
              <li>Je gebruikt het platform alleen voor het zoeken naar werk voor jezelf.</li>
              <li>Je deelt geen vertrouwelijke informatie van derden zonder hun toestemming.</li>
              <li>
                Je begrijpt dat wij geen banen garanderen. Een match is een suggestie — een aanstelling
                is altijd ter beoordeling van de werkgever.
              </li>
            </ul>
          </Article>

          <Article number="5" title="Verplichtingen van werkgevers">
            <ul className="list-disc pl-6 space-y-2">
              <li>Geplaatste vacatures zijn echt, actueel en niet-misleidend.</li>
              <li>
                Je discrimineert niet op grond van afkomst, geslacht, leeftijd, religie, seksuele
                oriëntatie of handicap. Vacatureteksten reflecteren dit.
              </li>
              <li>
                Kandidaatgegevens (contact, CV, notities) gebruik je uitsluitend voor het invullen van
                de betreffende vacature en behandel je vertrouwelijk.
              </li>
              <li>
                Werving via het platform mag niet worden ingezet om kandidaten door te verkopen aan
                derden zonder hun toestemming.
              </li>
            </ul>
          </Article>

          <Article number="6" title="Prijzen & betaling">
            <ul className="list-disc pl-6 space-y-2">
              <li>Voor werkzoekenden is het platform gratis.</li>
              <li>
                Werkgevers betalen voor abonnementen, plaatsing of succesvolle matches volgens het
                tarief dat geldt op het moment van bestellen. Tarieven zijn vooraf zichtbaar.
              </li>
              <li>
                Tenzij anders vermeld, zijn bedragen in SRD (Suriname) of EUR (Nederland) en exclusief
                btw waar van toepassing.
              </li>
              <li>Facturen worden binnen 14 dagen na factuurdatum voldaan.</li>
              <li>
                Bij niet-tijdige betaling kunnen we de toegang tot betaalde functies pauzeren, na een
                eerste herinnering.
              </li>
            </ul>
          </Article>

          <Article number="7" title="AI-matching: hoe wij omgaan met geautomatiseerde beslissingen">
            <p>
              Wij gebruiken AI om CV&apos;s en vacatures aan elkaar te koppelen (onder andere via
              embeddings en re-ranking). AI-matches zijn <strong>suggesties</strong>, geen oordeel over
              een persoon. Een mens (admin of werkgever) neemt de uiteindelijke beslissing om iemand wel
              of niet te benaderen. Je hebt het recht om bezwaar te maken tegen volledig
              geautomatiseerde besluitvorming.
            </p>
          </Article>

          <Article number="8" title="Intellectueel eigendom">
            <p>
              Alle rechten op het platform, de software, de matching-algoritmes, de huisstijl en de
              content (uitgezonderd door gebruikers aangeleverde CV&apos;s en vacatures) liggen bij
              {' '}{COMPANY_NAME}. Je krijgt een persoonlijke, niet-exclusieve, niet-overdraagbare
              licentie om het platform te gebruiken voor de doelen waarvoor het bedoeld is. Je
              CV/vacaturetekst blijft van jou, maar je geeft ons toestemming om die te verwerken en
              tonen voor matching.
            </p>
          </Article>

          <Article number="9" title="Privacy" icon={<ShieldCheck className="w-5 h-5" />}>
            <p>
              We gaan zorgvuldig om met persoonsgegevens. CV-gegevens worden alleen gedeeld met een
              werkgever na een expliciete contactaanvraag en goedkeuring door ons team. Voor het
              gebruik en de bewaartermijnen geldt onze separate privacyverklaring. Het verzoek tot
              inzage, correctie of verwijdering kun je sturen naar{' '}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>.
            </p>
          </Article>

          <Article number="10" title="Aansprakelijkheid" icon={<AlertTriangle className="w-5 h-5" />}>
            <p>
              Wij doen ons best om het platform betrouwbaar en up-to-date te houden, maar bieden geen
              garanties op beschikbaarheid, juistheid of geschiktheid voor een specifiek doel. Onze
              aansprakelijkheid voor directe schade is beperkt tot het bedrag dat een werkgever in de
              voorgaande 12 maanden aan ons heeft betaald voor de betreffende dienst. Indirecte schade
              (winstderving, reputatieschade, gevolgschade) is uitgesloten, voor zover wettelijk
              toegestaan.
            </p>
          </Article>

          <Article number="11" title="Opzegging">
            <ul className="list-disc pl-6 space-y-2">
              <li>Je kunt je account op elk moment opzeggen.</li>
              <li>
                Betaalde abonnementen lopen door tot het einde van de afgesproken periode, tenzij
                anders schriftelijk overeengekomen.
              </li>
              <li>
                Wij mogen je toegang opzeggen of opschorten als je in strijd handelt met deze
                voorwaarden of de wet.
              </li>
            </ul>
          </Article>

          <Article number="12" title="Wijzigingen">
            <p>
              We kunnen deze voorwaarden van tijd tot tijd aanpassen. Bij belangrijke wijzigingen
              brengen we je op de hoogte via e-mail of via een melding in het platform. De versiedatum
              bovenaan deze pagina geeft aan welke versie geldt.
            </p>
          </Article>

          <Article number="13" title="Toepasselijk recht & geschillen">
            <p>
              Op deze voorwaarden is het recht van {JURISDICTION} van toepassing. Geschillen leggen we
              eerst voor aan elkaar; lukt het niet om er onderling uit te komen, dan beslecht de
              bevoegde rechter in {JURISDICTION}. Werkgevers en werkzoekenden in Nederland kunnen
              uiteraard ook hun lokale consumentenrechten inroepen waar dat dwingend van toepassing is.
            </p>
          </Article>

          <Article number="14" title="Contact" icon={<Mail className="w-5 h-5" />}>
            <p>
              Heb je vragen over deze voorwaarden of over je rechten? Mail ons op{' '}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-blue-600 underline font-black">
                {COMPANY_EMAIL}
              </a>. We reageren meestal binnen 1 werkdag.
            </p>
          </Article>

          <div className="border-t-2 border-slate-200 pt-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Versie {LAST_UPDATED} · {COMPANY_NAME}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/"
                className="bg-black text-white px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-colors"
              >
                Terug naar home
              </Link>
              <Link
                href="/over-ons"
                className="border-2 border-black px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
              >
                Over ons
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
