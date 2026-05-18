// LLM-gegenereerde 'waarom past dit?' toelichting voor een CV ↔ vacature pair.
// Gebruikt gpt-4o-mini: snel (~1s), goedkoop (~$0.002 per call), voldoende
// voor 2 zinnen redenering. Output blijft NL omdat de admin daarmee werkt.

import OpenAI from 'openai';
import { prepareCVText } from './embeddings';

let client: OpenAI | null = null;
function getClient(): OpenAI {
    if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return client;
}

interface CVForReason {
    fullName?: string;
    jobTitle?: string;
    skills?: string;
    experience?: string;
    education?: string;
    languages?: string;
    summary?: string;
    achievements?: string;
    fullText?: string;
}

interface VacancyForReason {
    title?: string;
    company?: string;
    description?: string;
    requirements?: string;
}

const SYSTEM_PROMPT = `Je bent recruitment-analist bij een Nederlands platform voor administratieve en financiële functies. Je legt in 2-3 korte zinnen uit waarom een specifieke kandidaat past bij een vacature. Focus op:
- Concrete overlap in werkervaring, sector, of specifieke tools (bv. ANVA, WFT)
- Belangrijke mismatches als die er zijn (te weinig ervaring, ontbrekende kwalificatie)
- Schrijf direct en zakelijk, geen marketing-taal

Antwoord puur in het Nederlands, max 60 woorden, geen opsomming, geen "deze kandidaat" of "deze vacature" — schrijf alsof je een collega vertelt waarom een match interessant is.`;

export async function generateMatchReason(
    cv: CVForReason,
    vacancy: VacancyForReason,
): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    const cvText = prepareCVText(cv);
    const vacancyText = [
        vacancy.title && `Functie: ${vacancy.title}`,
        vacancy.company && `Bedrijf: ${vacancy.company}`,
        vacancy.description && `Omschrijving: ${vacancy.description.slice(0, 1500)}`,
        vacancy.requirements && `Eisen: ${vacancy.requirements.slice(0, 800)}`,
    ].filter(Boolean).join('\n\n');

    if (!cvText || !vacancyText) return null;

    try {
        const completion = await getClient().chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 200,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `KANDIDAAT (${cv.fullName || 'onbekend'}):\n${cvText.slice(0, 3500)}\n\n---\n\nVACATURE:\n${vacancyText}`,
                },
            ],
        });
        const reason = completion.choices[0]?.message?.content?.trim();
        return reason || null;
    } catch (err) {
        console.error('generateMatchReason failed:', err instanceof Error ? err.message : err);
        return null;
    }
}
