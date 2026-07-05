import { test, expect } from '@playwright/test';
import { escapeHtml, escapeRegex, decodeBase64Limited } from '../lib/server/security';

test.describe('Security helpers', () => {
  test('escapeHtml neutraliseert markup en quotes', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(escapeHtml(`"'&<>`)).toBe('&quot;&#39;&amp;&lt;&gt;');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('escapeRegex ontwapent ReDoS-metatekens', () => {
    // De klassieke catastrophic-backtracking-payload mag als letterlijke string
    // worden behandeld, niet als operator.
    const safe = escapeRegex('(a+)+$');
    expect(safe).toBe('\\(a\\+\\)\\+\\$');
    // Als letterlijke tekst gebruikt matcht 'ie zichzelf en explodeert niet.
    expect(new RegExp(safe).test('(a+)+$')).toBe(true);
    expect(new RegExp(safe).test('aaaa')).toBe(false);
  });

  test('decodeBase64Limited weigert te grote payloads vóór allocatie', () => {
    const smallB64 = Buffer.from('hallo').toString('base64');
    const ok = decodeBase64Limited(smallB64, 1024);
    expect(ok.tooLarge).toBe(false);
    expect(ok.buffer?.toString()).toBe('hallo');

    // ~3KB payload tegen een 1KB-limiet → geweigerd, geen buffer.
    const bigB64 = Buffer.alloc(3000, 0x41).toString('base64');
    const rejected = decodeBase64Limited(bigB64, 1024);
    expect(rejected.tooLarge).toBe(true);
    expect(rejected.buffer).toBeNull();

    // Lege / niet-string input → geen buffer, niet "tooLarge".
    expect(decodeBase64Limited('', 1024)).toEqual({ buffer: null, tooLarge: false });
    expect(decodeBase64Limited(undefined, 1024)).toEqual({ buffer: null, tooLarge: false });
  });
});
