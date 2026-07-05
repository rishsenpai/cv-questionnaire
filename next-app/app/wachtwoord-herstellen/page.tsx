'use client';

import React, { Suspense, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n/LanguageProvider';

const WWHERSTELLEN_T = {
  nl: {
    invalidLink: 'Ongeldige link',
    invalidLinkDesc: 'Deze herstellink is onvolledig. Vraag een nieuwe aan.',
    requestNewLink: 'Nieuwe link aanvragen',
    success: 'Gelukt!',
    successDesc: 'Je wachtwoord is opnieuw ingesteld. Je wordt doorgestuurd naar de inlogpagina...',
    title: 'Nieuw wachtwoord',
    subtitle: 'Kies een nieuw wachtwoord voor je account',
    newPasswordPlaceholder: 'NIEUW WACHTWOORD',
    confirmPasswordPlaceholder: 'BEVESTIG WACHTWOORD',
    saving: 'Opslaan...',
    savePassword: 'Wachtwoord opslaan',
    errorEmployerPassword: 'Min. 8 tekens, met een letter én een cijfer.',
    errorMinLength: 'Gebruik minimaal 8 tekens.',
    errorMismatch: 'Wachtwoorden komen niet overeen.',
    resetFailed: 'Wachtwoord opnieuw instellen mislukt.',
    genericError: 'Er ging iets mis. Probeer het later opnieuw.',
  },
  en: {
    invalidLink: 'Invalid link',
    invalidLinkDesc: 'This reset link is incomplete. Please request a new one.',
    requestNewLink: 'Request a new link',
    success: 'Success!',
    successDesc: 'Your password has been reset. You are being redirected to the login page...',
    title: 'New password',
    subtitle: 'Choose a new password for your account',
    newPasswordPlaceholder: 'NEW PASSWORD',
    confirmPasswordPlaceholder: 'CONFIRM PASSWORD',
    saving: 'Saving...',
    savePassword: 'Save password',
    errorEmployerPassword: 'Min. 8 characters, with a letter and a number.',
    errorMinLength: 'Use at least 8 characters.',
    errorMismatch: 'Passwords do not match.',
    resetFailed: 'Resetting the password failed.',
    genericError: 'Something went wrong. Please try again later.',
  },
  es: {
    invalidLink: 'Enlace no válido',
    invalidLinkDesc: 'Este enlace de restablecimiento está incompleto. Solicita uno nuevo.',
    requestNewLink: 'Solicitar un enlace nuevo',
    success: '¡Listo!',
    successDesc: 'Tu contraseña ha sido restablecida. Se te redirigirá a la página de inicio de sesión...',
    title: 'Nueva contraseña',
    subtitle: 'Elige una nueva contraseña para tu cuenta',
    newPasswordPlaceholder: 'NUEVA CONTRASEÑA',
    confirmPasswordPlaceholder: 'CONFIRMAR CONTRASEÑA',
    saving: 'Guardando...',
    savePassword: 'Guardar contraseña',
    errorEmployerPassword: 'Mín. 8 caracteres, con una letra y un número.',
    errorMinLength: 'Usa al menos 8 caracteres.',
    errorMismatch: 'Las contraseñas no coinciden.',
    resetFailed: 'No se pudo restablecer la contraseña.',
    genericError: 'Algo salió mal. Inténtalo de nuevo más tarde.',
  },
};

type ResetType = 'candidate' | 'employer';

function ResetInner() {
  const t = useT(WWHERSTELLEN_T);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const typeParam = searchParams.get('type');
  const type: ResetType = typeParam === 'employer' ? 'employer' : 'candidate';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Werkgever heeft een strengere eis (letter + cijfer); kandidaat alleen lengte.
  const validatePassword = (pw: string): string | null => {
    if (type === 'employer') {
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw)) {
        return t.errorEmployerPassword;
      }
    } else if (pw.length < 8) {
      return t.errorMinLength;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError(t.errorMismatch); return; }

    setIsLoading(true);
    try {
      const endpoint = type === 'employer' ? '/api/employer/reset-password' : '/api/candidate/reset-password';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || t.resetFailed);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/auth'), 2500);
    } catch {
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] p-8 md:p-10"
      >
        {!token ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto border-4 border-amber-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-3">{t.invalidLink}</h2>
            <p className="text-sm font-bold text-slate-500 mb-8">
              {t.invalidLinkDesc}
            </p>
            <Link
              href="/wachtwoord-vergeten"
              className="inline-block w-full bg-blue-600 text-white py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {t.requestNewLink}
            </Link>
          </div>
        ) : done ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto border-4 border-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-3">{t.success}</h2>
            <p className="text-sm font-bold text-slate-500">
              {t.successDesc}
            </p>
          </motion.div>
        ) : (
          <>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2">{t.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
              {t.subtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField placeholder={t.newPasswordPlaceholder} value={password} onChange={setPassword} />
              <PasswordField placeholder={t.confirmPasswordPlaceholder} value={confirm} onChange={setConfirm} />

              {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-blue-600 text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    {t.savePassword}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

function PasswordField({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative group">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white transition-all"
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
