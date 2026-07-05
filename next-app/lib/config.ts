// Publiek beschikbare front-end configuratie.
// Zet NEXT_PUBLIC_WHATSAPP_NUMBER in je .env(.local), bv. 5978123456 (landcode + nummer, alleen cijfers).
// Als er geen nummer is geconfigureerd tonen we de WhatsApp-knop niet, zodat we nooit
// een dood 'isn't on WhatsApp'-scherm laten zien.

/** Genormaliseerd WhatsApp-nummer (alleen cijfers) of null als niet geconfigureerd. */
export const WHATSAPP_NUMBER: string | null = (() => {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
})();

/**
 * Bouwt een wa.me-deeplink met vooraf ingevulde tekst.
 * Retourneert null als er geen geldig WhatsApp-nummer is geconfigureerd — de aanroeper
 * hoort de knop dan te verbergen.
 */
export function buildWhatsAppUrl(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Support-/contactadres voor kandidaten (footer, contactlinks). */
export const SUPPORT_EMAIL = 'jobmatcher.beyondjobs@gmail.com';
