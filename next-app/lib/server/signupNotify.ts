import { getTransporter } from '@/lib/server/mailer';
import { escapeHtml } from '@/lib/server/security';

interface SignupInfo {
    type: 'candidate' | 'employer';
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
}

// Fire-and-forget mail naar de site-eigenaar (RECIPIENT_EMAIL) bij een nieuwe
// aanmelding. Mag de registratie nooit vertragen of laten falen: geen await
// in de route, fouten alleen loggen. In test-mode of zonder mail-config
// gebeurt er niets (geen echte mails vanuit Playwright).
export function notifySignup(info: SignupInfo): void {
    if (process.env.NODE_ENV === 'test') return;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.RECIPIENT_EMAIL) return;

    const label = info.type === 'candidate' ? 'Kandidaat' : 'Werkgever';
    const row = (k: string, v?: string) => v
        ? `<tr><td style="font-weight:bold;padding:4px 16px 4px 0;color:#2d3748">${k}</td><td style="color:#4a5568">${escapeHtml(v)}</td></tr>`
        : '';
    const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #2563eb; color: white; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin:0">Nieuwe ${label.toLowerCase()}-aanmelding</h2>
    </div>
    <table style="background:#f8fafc;border-radius:8px;padding:12px;width:100%" cellpadding="6">
        ${row('Bedrijf', info.companyName)}
        ${row('Naam', info.name)}
        ${row('E-mail', info.email)}
        ${row('Telefoon', info.phone)}
    </table>
    <p style="font-size:12px;color:#666;margin-top:20px">Aangemeld op ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })} · jobparsing.com</p>
</body></html>`;

    getTransporter().sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.RECIPIENT_EMAIL,
        subject: `Nieuwe ${label.toLowerCase()}-aanmelding: ${info.companyName || info.name}`,
        html,
        replyTo: info.email,
    }).then(() => {
        console.log(`[signup-notify] mail verstuurd voor ${info.type} ${info.email}`);
    }).catch(err => {
        console.error('[signup-notify] mail mislukt:', err instanceof Error ? err.message : err);
    });
}
