export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
export const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function isNonEmpty(value: unknown) {
  return String(value ?? '').trim().length > 0;
}

export function isValidEmail(value: unknown) {
  return emailPattern.test(String(value ?? '').trim());
}

export function isValidPhone(value: unknown) {
  return phonePattern.test(String(value ?? '').trim());
}

export function isValidUrl(value: unknown) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return false;
  return urlPattern.test(normalized);
}

export function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
