'use client';

import React, { Suspense, useState } from 'react';
import { motion } from 'motion/react';
import { User, Building2, Mail, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';

const WWVERGETEN_T = {
  nl: {
    backToLogin: 'Terug naar inloggen',
    checkInbox: 'Check je inbox',
    toLogin: 'Naar inloggen',
    title: 'Wachtwoord vergeten',
    subtitle: 'We sturen je een herstellink per e-mail',
    candidate: 'Kandidaat',
    employer: 'Werkgever',
    emailPlaceholder: 'E-MAILADRES',
    identifierPlaceholder: 'GEBRUIKERSNAAM OF E-MAIL',
    sending: 'Verzenden...',
    sendLink: 'Herstellink sturen',
    errorEmailRequired: 'Voer je e-mailadres in.',
    errorIdentifierRequired: 'Voer je gebruikersnaam of e-mailadres in.',
    defaultMessage: 'Als dit account bij ons bekend is, ontvang je een e-mail met een herstellink.',
    genericError: 'Er ging iets mis. Probeer het later opnieuw.',
  },
  en: {
    backToLogin: 'Back to login',
    checkInbox: 'Check your inbox',
    toLogin: 'Go to login',
    title: 'Forgot password',
    subtitle: 'We will send you a reset link by email',
    candidate: 'Candidate',
    employer: 'Employer',
    emailPlaceholder: 'EMAIL ADDRESS',
    identifierPlaceholder: 'USERNAME OR EMAIL',
    sending: 'Sending...',
    sendLink: 'Send reset link',
    errorEmailRequired: 'Enter your email address.',
    errorIdentifierRequired: 'Enter your username or email address.',
    defaultMessage: 'If this account is known to us, you will receive an email with a reset link.',
    genericError: 'Something went wrong. Please try again later.',
  },
  es: {
    backToLogin: 'Volver a iniciar sesión',
    checkInbox: 'Revisa tu bandeja de entrada',
    toLogin: 'Ir a iniciar sesión',
    title: 'Olvidé mi contraseña',
    subtitle: 'Te enviaremos un enlace de restablecimiento por correo electrónico',
    candidate: 'Candidato',
    employer: 'Empleador',
    emailPlaceholder: 'CORREO ELECTRÓNICO',
    identifierPlaceholder: 'NOMBRE DE USUARIO O CORREO',
    sending: 'Enviando...',
    sendLink: 'Enviar enlace de restablecimiento',
    errorEmailRequired: 'Introduce tu correo electrónico.',
    errorIdentifierRequired: 'Introduce tu nombre de usuario o correo electrónico.',
    defaultMessage: 'Si esta cuenta está registrada, recibirás un correo electrónico con un enlace de restablecimiento.',
    genericError: 'Algo salió mal. Inténtalo de nuevo más tarde.',
  },
};

type Role = 'candidate' | 'employer';

function ForgotInner() {
  const t = useT(WWVERGETEN_T);
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [role, setRole] = useState<Role>(roleParam === 'employer' ? 'employer' : 'candidate');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!value.trim()) {
      setError(role === 'candidate' ? t.errorEmailRequired : t.errorIdentifierRequired);
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = role === 'candidate' ? '/api/candidate/forgot-password' : '/api/employer/forgot-password';
      const payload = role === 'candidate' ? { email: value.trim() } : { identifier: value.trim() };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessage(data.message || t.defaultMessage);
      setDone(true);
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
        <Link href="/auth" className="inline-flex items-center gap-2 mb-8 text-slate-400 hover:text-blue-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">{t.backToLogin}</span>
        </Link>

        {done ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto border-4 border-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-3">{t.checkInbox}</h2>
            <p className="text-sm font-bold text-slate-500 mb-8">{message}</p>
            <Link
              href="/auth"
              className="inline-block w-full bg-blue-600 text-white py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {t.toLogin}
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2">{t.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
              {t.subtitle}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setRole('candidate'); setError(''); }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 border-2 transition-all group',
                  role === 'candidate' ? 'border-black bg-black text-white' : 'border-slate-100 hover:border-black text-slate-400',
                )}
              >
                <User className={cn('w-5 h-5', role === 'candidate' ? 'text-blue-400' : 'group-hover:text-black')} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.candidate}</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('employer'); setError(''); }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 border-2 transition-all group',
                  role === 'employer' ? 'border-black bg-black text-white' : 'border-slate-100 hover:border-black text-slate-400',
                )}
              >
                <Building2 className={cn('w-5 h-5', role === 'employer' ? 'text-blue-400' : 'group-hover:text-black')} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.employer}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type={role === 'candidate' ? 'email' : 'text'}
                    placeholder={role === 'candidate' ? t.emailPlaceholder : t.identifierPlaceholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
                {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-1">{error}</p>}
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-blue-600 text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    {t.sendLink}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
