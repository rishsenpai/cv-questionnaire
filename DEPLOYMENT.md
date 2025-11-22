# Deployment Instructies

## Probleem
GitHub Pages ondersteunt alleen statische bestanden en kan geen Node.js server draaien. Daarom werkt de CV submission niet.

## Oplossing: Deploy naar Vercel

### Stap 1: Maak een Vercel account
1. Ga naar [vercel.com](https://vercel.com)
2. Meld je aan met je GitHub account

### Stap 2: Deploy het project
1. Klik op "Add New Project"
2. Importeer je `cv-questionnaire` repository van GitHub
3. Vercel detecteert automatisch de configuratie

### Stap 3: Configureer environment variabelen
Voeg deze environment variabelen toe in Vercel dashboard:
- `EMAIL_USER` = jobmatcher.beyondjobs@gmail.com
- `EMAIL_PASS` = tiwk iucm jaot icsi
- `RECIPIENT_EMAIL` = jobmatcher.beyondjobs@gmail.com
- `PORT` = 3001 (optioneel, Vercel gebruikt eigen poort)

### Stap 4: Deploy
1. Klik op "Deploy"
2. Wacht tot de deployment klaar is
3. Je krijgt een URL zoals: `https://cv-questionnaire.vercel.app`

## Alternatief: Netlify
Als je liever Netlify gebruikt:
1. Ga naar [netlify.com](https://netlify.com)
2. Voeg de repository toe
3. Configureer de environment variabelen
4. Deploy

## Na deployment
- De oude GitHub Pages URL werkt niet meer voor CV submission
- Gebruik de nieuwe Vercel URL
- Alle functionaliteit werkt dan correct
