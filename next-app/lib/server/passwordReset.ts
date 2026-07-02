import crypto from 'crypto';
import { Types } from 'mongoose';
import PasswordResetToken, { ResetUserType } from '@/models/PasswordResetToken';
import { getTransporter } from '@/lib/server/mailer';

// Resetlink is 1 uur geldig.
export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export function hashResetToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Maakt een nieuwe reset-token aan voor de gegeven gebruiker en slaat de hash op.
 * Eventuele oudere tokens van dezelfde gebruiker worden verwijderd (max. 1 actief).
 * Geeft de RUWE token terug — die hoort enkel in de e-maillink thuis.
 */
export async function createResetToken(userType: ResetUserType, userId: Types.ObjectId): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);

    await PasswordResetToken.deleteMany({ userType, userId });
    await PasswordResetToken.create({
        userType,
        userId,
        tokenHash,
        expires: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    });

    return rawToken;
}

/**
 * Zoekt een geldige (niet-verlopen) reset-token op basis van de ruwe token.
 * Geeft null terug als de token onbekend of verlopen is.
 */
export async function consumeResetToken(rawToken: string, userType: ResetUserType) {
    const tokenHash = hashResetToken(rawToken);
    const doc = await PasswordResetToken.findOne({
        tokenHash,
        userType,
        expires: { $gt: new Date() },
    });
    return doc;
}

export async function sendPasswordResetEmail(opts: {
    to: string;
    resetUrl: string;
    displayName?: string;
}): Promise<void> {
    const { to, resetUrl, displayName } = opts;
    const greeting = displayName ? `Hoi ${displayName},` : 'Hoi,';

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
    <h2 style="color: #2563eb;">🔑 Wachtwoord opnieuw instellen</h2>
    <p>${greeting}</p>
    <p>We ontvingen een verzoek om het wachtwoord van je Jobparsing+ account opnieuw in te stellen.
       Klik op de knop hieronder om een nieuw wachtwoord te kiezen.</p>
    <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Nieuw wachtwoord instellen
        </a>
    </p>
    <p style="color: #718096; font-size: 14px;">
        Werkt de knop niet? Kopieer dan deze link in je browser:<br>
        <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="color: #718096; font-size: 14px;">
        Deze link is <strong>1 uur</strong> geldig. Heb je dit niet aangevraagd?
        Dan kun je deze e-mail negeren — je wachtwoord blijft ongewijzigd.
    </p>
</div>`;

    await getTransporter().sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: '🔑 Wachtwoord opnieuw instellen — Jobparsing+',
        html,
    });
}

export function getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3001';
}
