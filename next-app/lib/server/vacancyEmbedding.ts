import Vacancy from '@/models/Vacancy';
import { generateEmbedding } from './embeddings';

export async function generateVacancyEmbedding(vacancyId: string): Promise<void> {
    try {
        const vacancy = await Vacancy.findById(vacancyId);
        if (!vacancy) return;
        const text = `${vacancy.title}\n${vacancy.description || ''}\n${vacancy.requirements || ''}`;
        if (text.trim().length < 10) {
            console.log(`Skipping embedding for vacancy ${vacancyId}: insufficient text`);
            return;
        }
        const embedding = await generateEmbedding(text);
        await Vacancy.findByIdAndUpdate(vacancyId, { embedding });
        console.log(`Embedding generated for vacancy: ${vacancy.title}`);
    } catch (err) {
        console.error(`Failed to generate embedding for vacancy ${vacancyId}:`, err instanceof Error ? err.message : err);
    }
}
