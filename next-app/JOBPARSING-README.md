# Jobparsing+

Jobparsing+ is een moderne vacature- en talentplatform prototype voor Suriname, gebouwd met Next.js, React en Tailwind CSS. De app bevat kandidaat- en bedrijfsflows, vacatureoverzichten, dashboards en lokale interactieve tools zonder externe AI-API keys.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- Recharts

## Belangrijkste functies

- Homepage met zoekflow en interactieve parser-demo
- Vacatureoverzicht en vacature-detailpagina's
- Bedrijvenoverzicht en bedrijfspagina's
- Kandidaat-dashboard met profiel, CV-analyse en roadmap-tools
- Bedrijfsdashboard met vacatureteksten, interviewvragen en salarisbenchmark-tools
- Onboardingflow voor kandidaten en werkgevers
- Lokale storage-gebaseerde demo-data voor snelle prototyping

## Projectstructuur

```text
app/
components/
hooks/
lib/
```

Belangrijke routes:

- `/` home
- `/vacatures` vacatures overzicht
- `/vacatures/[id]` vacature detail
- `/bedrijven` bedrijven overzicht
- `/bedrijven/[id]` bedrijf detail
- `/dashboard/candidate` kandidaat dashboard
- `/dashboard/company` bedrijfsdashboard
- `/onboarding` onboarding flow
- `/auth` login / registratie demo

## Lokaal draaien

Vereisten:

- Node.js 20+ aanbevolen
- npm

Installeren en starten:

```bash
npm install
npm run dev
```

Open daarna:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Data en gedrag

Deze app gebruikt op meerdere plekken `localStorage` voor demo-data, zoals:

- gebruiker (`suri_user`)
- vacatures (`suri_jobs`)
- sollicitaties (`suri_applications`)
- opgeslagen vacatures (`suri_saved_jobs`)

Daardoor werkt het project goed als prototype, maar nog niet als productie-backend.

## Huidige status

- Geen Gemini of Google AI Studio dependency meer
- Geen API key nodig om de app te starten
- `npm run lint` slaagt
- `npm run build` slaagt

## Volgende verbeteringen

- echte backend en database koppelen
- authenticatie vervangen door echte auth
- localStorage demo-data migreren naar API of database
- charts SSR-vriendelijker maken om build-waarschuwingen te verminderen

## Repository

[GitHub repo](https://github.com/Z-Chami/surijobs-plus)
