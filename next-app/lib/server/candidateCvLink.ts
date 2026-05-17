// Koppelt CVs aan een Candidate op basis van email-match.
// Aanroepen bij register, login en CV-upload zodat de relatie up-to-date blijft.

import { Types } from 'mongoose';
import Candidate from '@/models/Candidate';
import CV from '@/models/CV';

export async function linkCvsByEmail(
    candidateId: Types.ObjectId | string,
    email: string,
): Promise<number> {
    if (!email) return 0;
    const normalized = email.toLowerCase().trim();
    if (!normalized) return 0;

    const cvs = await CV.find({ email: normalized }).select('_id').lean();
    if (cvs.length === 0) return 0;

    const cvIds = cvs.map(c => c._id);
    const candidate = await Candidate.findByIdAndUpdate(
        candidateId,
        { $addToSet: { linkedCvIds: { $each: cvIds } } },
        { new: true },
    ).select('linkedCvIds');

    return candidate ? candidate.linkedCvIds.length : 0;
}

// Andersom: bij een nieuwe CV-upload of update, koppel hem aan de bijbehorende
// Candidate (als die bestaat) zodat de kandidaat hem in zijn portaal ziet.
export async function linkCandidateByCvEmail(
    cvId: Types.ObjectId | string,
    email: string,
): Promise<boolean> {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    if (!normalized) return false;

    const candidate = await Candidate.findOne({ email: normalized }).select('_id');
    if (!candidate) return false;

    await Candidate.updateOne(
        { _id: candidate._id },
        { $addToSet: { linkedCvIds: cvId } },
    );
    return true;
}
