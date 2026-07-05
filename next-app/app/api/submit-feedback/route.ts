import { NextRequest, NextResponse } from 'next/server';
import { getTransporter } from '@/lib/server/mailer';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { escapeHtml } from '@/lib/server/security';

interface FeedbackData {
    feedbackName?: string;
    feedbackEmail?: string;
    feedbackRating?: string | number;
    feedbackMessage?: string;
}

export async function POST(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, { name: 'submit-feedback', limit: 10, windowMs: 60 * 60 * 1000 });
        if (limited) return limited;

        const data = (await req.json()) as FeedbackData;

        if (!data.feedbackMessage) {
            return NextResponse.json(
                { success: false, message: 'Feedback message is required' },
                { status: 400 },
            );
        }

        const rating = data.feedbackRating ? parseInt(String(data.feedbackRating), 10) : 0;
        const stars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '';

        const html = `
<!DOCTYPE html>
<html><head><style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
.feedback-header { background: linear-gradient(135deg, #2ec4b6, #26a69a); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
.feedback-content { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.feedback-field { margin-bottom: 15px; }
.feedback-label { font-weight: bold; color: #2d3748; margin-bottom: 5px; }
.feedback-value { color: #4a5568; background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #2ec4b6; }
.rating-stars { font-size: 18px; color: #ffd700; }
</style></head>
<body>
    <div class="feedback-header"><h2>💬 New Feedback Received</h2><p>CV Questionnaire User Feedback</p></div>
    <div class="feedback-content">
        ${data.feedbackName ? `<div class="feedback-field"><div class="feedback-label">Name:</div><div class="feedback-value">${escapeHtml(data.feedbackName)}</div></div>` : ''}
        ${data.feedbackEmail ? `<div class="feedback-field"><div class="feedback-label">Email:</div><div class="feedback-value">${escapeHtml(data.feedbackEmail)}</div></div>` : ''}
        ${rating > 0 ? `<div class="feedback-field"><div class="feedback-label">Rating:</div><div class="feedback-value"><span class="rating-stars">${stars}</span> (${rating}/5 stars)</div></div>` : ''}
        <div class="feedback-field"><div class="feedback-label">Feedback Message:</div><div class="feedback-value">${escapeHtml(data.feedbackMessage).replace(/\n/g, '<br>')}</div></div>
    </div>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666; text-align: center;">
        <p>Feedback submitted on: ${new Date().toLocaleString()}</p>
    </div>
</body></html>`;

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.RECIPIENT_EMAIL,
            subject: `CV Questionnaire Feedback ${rating > 0 ? `(${rating}★)` : ''}`,
            html,
            replyTo: data.feedbackEmail || process.env.EMAIL_USER,
        });

        console.log(`Feedback received ${data.feedbackName ? `from ${data.feedbackName}` : 'anonymously'}`);

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully!',
        });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        return NextResponse.json(
            { success: false, message: 'Failed to submit feedback' },
            { status: 500 },
        );
    }
}
