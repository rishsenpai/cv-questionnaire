'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buildWhatsAppUrl, SUPPORT_EMAIL } from '@/lib/config';
import { useT } from '@/lib/i18n/LanguageProvider';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const FAQ_T = {
  nl: {
    badge: 'Veelgestelde vragen',
    heroA: 'Alles wat je wilt ',
    heroHighlight: 'weten',
    ctaTitle: 'Vraag niet beantwoord?',
    ctaDesc: 'Stuur ons een bericht — we helpen je graag verder.',
    mailUs: 'Mail ons',
    whatsapp: 'WhatsApp',
    whatsappMsg: 'Hoi, ik heb een vraag over Jobparsing+',
    groups: [
      {
        title: 'Voor werkzoekenden',
        items: [
          {
            q: 'Wat is Jobparsing+?',
            a: 'Jobparsing+ is een vacatureplatform voor Suriname en Guyana dat jouw CV met AI vergelijkt met openstaande vacatures en je de best passende matches toont — met een transparante match-score.',
          },
          {
            q: 'Moet ik een account aanmaken om te solliciteren?',
            a: (
              <>
                Nee. Je kunt direct je CV uploaden en solliciteren zonder registratie vooraf. Een account is optioneel en handig
                om je matches en sollicitaties later terug te zien. <Link href="/cv-upload" className="text-blue-600 underline">Upload je CV</Link>.
              </>
            ),
          },
          {
            q: 'Is het gratis?',
            a: 'Ja, voor werkzoekenden is Jobparsing+ volledig gratis: CV uploaden, matchen en solliciteren kost niets.',
          },
          {
            q: 'Hoe werkt de AI-matching?',
            a: 'We zetten je CV om in een profiel en vergelijken dat inhoudelijk met alle vacatures — niet alleen op trefwoorden, maar op vaardigheden en ervaring. Je krijgt de vacatures met de hoogste match-score bovenaan.',
          },
          {
            q: 'Welke bestandstypen kan ik uploaden?',
            a: 'PDF of Word (.docx), tot maximaal 4,5 MB.',
          },
          {
            q: 'Is mijn data veilig?',
            a: 'Werkgevers zien nooit zomaar je contactgegevens: vacatures en kandidaten worden geanonimiseerd getoond. Contact verloopt via Jobparsing+ nadat er een match is.',
          },
          {
            q: 'In welke landen zijn er vacatures?',
            a: 'Op dit moment richten we ons op Suriname en Guyana. Vacatures uit andere landen worden voorlopig niet getoond.',
          },
        ],
      },
      {
        title: 'Voor werkgevers',
        items: [
          {
            q: 'Hoe plaats ik een vacature?',
            a: (
              <>
                Werkgevers kunnen zich aanmelden via de <Link href="/voor-werkgevers" className="text-blue-600 underline">werkgeverspagina</Link>.
                Wij helpen je vacature op te zetten en gekwalificeerde kandidaten te matchen.
              </>
            ),
          },
          {
            q: 'Hoe worden kandidaten gematcht?',
            a: 'Onze AI vergelijkt de vacature met onze geanonimiseerde kandidatendatabase en levert de best passende profielen — zodat je niet door honderden CV’s hoeft te ploegen.',
          },
          {
            q: 'Wat kost het voor werkgevers?',
            a: (
              <>
                Neem contact met ons op voor de mogelijkheden en tarieven via{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">{SUPPORT_EMAIL}</a>.
              </>
            ),
          },
        ],
      },
    ] as FaqGroup[],
  },
  en: {
    badge: 'Frequently asked questions',
    heroA: 'Everything you want to ',
    heroHighlight: 'know',
    ctaTitle: 'Question not answered?',
    ctaDesc: 'Send us a message — we’re happy to help.',
    mailUs: 'Email us',
    whatsapp: 'WhatsApp',
    whatsappMsg: 'Hi, I have a question about Jobparsing+',
    groups: [
      {
        title: 'For job seekers',
        items: [
          {
            q: 'What is Jobparsing+?',
            a: 'Jobparsing+ is a job platform for Suriname and Guyana that uses AI to compare your CV with open vacancies and shows you the best-fitting matches — with a transparent match score.',
          },
          {
            q: 'Do I need to create an account to apply?',
            a: (
              <>
                No. You can upload your CV and apply right away without registering first. An account is optional and handy
                for revisiting your matches and applications later. <Link href="/cv-upload" className="text-blue-600 underline">Upload your CV</Link>.
              </>
            ),
          },
          {
            q: 'Is it free?',
            a: 'Yes, Jobparsing+ is completely free for job seekers: uploading your CV, matching and applying cost nothing.',
          },
          {
            q: 'How does the AI matching work?',
            a: 'We turn your CV into a profile and compare it in depth with all vacancies — not just on keywords, but on skills and experience. You get the vacancies with the highest match score at the top.',
          },
          {
            q: 'Which file types can I upload?',
            a: 'PDF or Word (.docx), up to a maximum of 4.5 MB.',
          },
          {
            q: 'Is my data safe?',
            a: 'Employers never simply see your contact details: vacancies and candidates are shown anonymised. Contact goes through Jobparsing+ once there is a match.',
          },
          {
            q: 'In which countries are there vacancies?',
            a: 'At the moment we focus on Suriname and Guyana. Vacancies from other countries are not shown for now.',
          },
        ],
      },
      {
        title: 'For employers',
        items: [
          {
            q: 'How do I post a vacancy?',
            a: (
              <>
                Employers can sign up via the <Link href="/voor-werkgevers" className="text-blue-600 underline">employer page</Link>.
                We help you set up your vacancy and match qualified candidates.
              </>
            ),
          },
          {
            q: 'How are candidates matched?',
            a: 'Our AI compares the vacancy with our anonymised candidate database and delivers the best-fitting profiles — so you don’t have to plough through hundreds of CVs.',
          },
          {
            q: 'What does it cost for employers?',
            a: (
              <>
                Contact us about the options and rates via{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">{SUPPORT_EMAIL}</a>.
              </>
            ),
          },
        ],
      },
    ] as FaqGroup[],
  },
  es: {
    badge: 'Preguntas frecuentes',
    heroA: 'Todo lo que quieres ',
    heroHighlight: 'saber',
    ctaTitle: '¿No respondimos tu pregunta?',
    ctaDesc: 'Envíanos un mensaje — con gusto te ayudamos.',
    mailUs: 'Escríbenos',
    whatsapp: 'WhatsApp',
    whatsappMsg: 'Hola, tengo una pregunta sobre Jobparsing+',
    groups: [
      {
        title: 'Para candidatos',
        items: [
          {
            q: '¿Qué es Jobparsing+?',
            a: 'Jobparsing+ es una plataforma de empleo para Surinam y Guyana que usa IA para comparar tu CV con las vacantes abiertas y te muestra las coincidencias que mejor encajan — con una puntuación de coincidencia transparente.',
          },
          {
            q: '¿Necesito crear una cuenta para postularme?',
            a: (
              <>
                No. Puedes subir tu CV y postularte de inmediato sin registrarte antes. Una cuenta es opcional y útil
                para volver a ver tus coincidencias y postulaciones más adelante. <Link href="/cv-upload" className="text-blue-600 underline">Sube tu CV</Link>.
              </>
            ),
          },
          {
            q: '¿Es gratis?',
            a: 'Sí, para candidatos Jobparsing+ es totalmente gratis: subir tu CV, hacer coincidencias y postularte no cuesta nada.',
          },
          {
            q: '¿Cómo funciona la coincidencia con IA?',
            a: 'Convertimos tu CV en un perfil y lo comparamos a fondo con todas las vacantes — no solo por palabras clave, sino por habilidades y experiencia. Obtienes arriba las vacantes con la mayor puntuación de coincidencia.',
          },
          {
            q: '¿Qué tipos de archivo puedo subir?',
            a: 'PDF o Word (.docx), hasta un máximo de 4,5 MB.',
          },
          {
            q: '¿Están seguros mis datos?',
            a: 'Los empleadores nunca ven sin más tus datos de contacto: las vacantes y los candidatos se muestran de forma anónima. El contacto se realiza a través de Jobparsing+ una vez que hay una coincidencia.',
          },
          {
            q: '¿En qué países hay vacantes?',
            a: 'Por ahora nos centramos en Surinam y Guyana. Las vacantes de otros países no se muestran de momento.',
          },
        ],
      },
      {
        title: 'Para empleadores',
        items: [
          {
            q: '¿Cómo publico una vacante?',
            a: (
              <>
                Los empleadores pueden registrarse a través de la <Link href="/voor-werkgevers" className="text-blue-600 underline">página para empleadores</Link>.
                Te ayudamos a crear tu vacante y a encontrar candidatos cualificados.
              </>
            ),
          },
          {
            q: '¿Cómo se emparejan los candidatos?',
            a: 'Nuestra IA compara la vacante con nuestra base de candidatos anonimizada y entrega los perfiles que mejor encajan — para que no tengas que revisar cientos de CV.',
          },
          {
            q: '¿Cuánto cuesta para los empleadores?',
            a: (
              <>
                Contáctanos para conocer las opciones y tarifas en{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">{SUPPORT_EMAIL}</a>.
              </>
            ),
          },
        ],
      },
    ] as FaqGroup[],
  },
};

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-2 border-black bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left p-5 sm:p-6 group"
      >
        <span className="text-sm sm:text-base font-black uppercase tracking-tight italic group-hover:text-blue-600 transition-colors">
          {item.q}
        </span>
        <span className={cn('shrink-0 w-8 h-8 flex items-center justify-center border-2 border-black transition-colors', open ? 'bg-blue-600 text-white' : 'bg-white')}>
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t-2 border-slate-100"
          >
            <p className="p-5 sm:p-6 text-sm font-bold text-slate-600 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  const t = useT(FAQ_T);
  const whatsappUrl = buildWhatsAppUrl(t.whatsappMsg);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero */}
      <section className="bg-black text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic">
            <HelpCircle className="w-4 h-4" /> {t.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] italic break-words">
            {t.heroA}<span className="text-blue-500">{t.heroHighlight}</span>
          </h1>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 -skew-x-12 translate-x-1/2" />
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">
        {t.groups.map(group => (
          <div key={group.title}>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 w-fit italic">
              {group.title}
            </h2>
            <div className="space-y-4">
              {group.items.map(item => (
                <FaqRow key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="bg-white border-4 border-black p-8 sm:p-12 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] text-center">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic mb-3">{t.ctaTitle}</h3>
          <p className="text-sm font-bold text-slate-500 mb-8 max-w-md mx-auto">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all"
            >
              <Mail className="w-4 h-4" /> {t.mailUs}
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-emerald-500 text-white px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all border-2 border-black"
              >
                <MessageCircle className="w-4 h-4" /> {t.whatsapp}
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
