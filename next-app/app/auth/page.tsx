'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  Phone,
  FileCheck,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/LanguageProvider';

type Role = 'candidate' | 'employer';

const AUTH_T = {
  nl: {
    backHome: 'Terug naar Home',
    tagline: 'Toegang tot de meest geavanceerde talent hub van Suriname.',
    feat1: 'Geverifieerde Profielen & Vacatures',
    feat2: 'AI-Powered Match Scoring',
    feat3: 'Veilig & Transparant Proces',
    privacy: 'PRIVACY', terms: 'TERMS',
    success: 'Succesvol!',
    redirecting: 'Je wordt nu doorverwezen',
    toMatches: ' naar je matches...', toDashboard: ' naar je dashboard...',
    loginTitle: 'Inloggen', signupTitle: 'Registreren',
    loginSub: 'Welkom terug bij Jobparsing+', signupSub: 'Creëer je account in minder dan 2 minuten',
    createAccount: 'Account aanmaken', haveAccount: 'Heb je al een account?',
    candidate: 'Kandidaat', employer: 'Werkgever',
    phFullName: 'VOLLEDIGE NAAM', phCompany: 'BEDRIJFSNAAM', phUsername: 'GEBRUIKERSNAAM',
    phContactEmail: 'CONTACT E-MAIL', phPhone: 'TELEFOONNUMMER', phKkf: 'KKF-NUMMER (OPTIONEEL)',
    phEmail: 'E-MAILADRES', phPassword: 'WACHTWOORD', phConfirm: 'BEVESTIG WACHTWOORD',
    forgotPassword: 'Wachtwoord vergeten?',
    processing: 'Verwerken...', submitLogin: 'Inloggen', submitSignup: 'Account Creëren',
    employerNote: 'Als werkgever krijg je toegang tot een dashboard waar je vacatures kan plaatsen die direct zichtbaar worden voor kandidaten.',
    consent1: 'Door een account te creëren ga je akkoord met de ',
    consentTerms: 'algemene voorwaarden',
    consent2: ' en de ',
    consentPrivacy: 'privacyverklaring',
    consent3: '.',
    errEmail: 'Voer een geldig e-mailadres in.',
    errFullName: 'Voer je volledige naam in.',
    errPassword8: 'Gebruik minimaal 8 tekens.',
    errConfirm: 'Wachtwoorden komen niet overeen.',
    errUsername: 'Voer een gebruikersnaam in.',
    errCompany: 'Voer een bedrijfsnaam in.',
    errPhone: 'Voer een geldig telefoonnummer in.',
    errKkf: 'Formaat: 4-8 cijfers, optioneel met letter-suffix.',
    errPasswordComplex: 'Min. 8 tekens, met letter én cijfer.',
  },
  en: {
    backHome: 'Back to Home',
    tagline: 'Access to the most advanced talent hub in Suriname.',
    feat1: 'Verified Profiles & Vacancies',
    feat2: 'AI-Powered Match Scoring',
    feat3: 'Safe & Transparent Process',
    privacy: 'PRIVACY', terms: 'TERMS',
    success: 'Success!',
    redirecting: "You're being redirected",
    toMatches: ' to your matches...', toDashboard: ' to your dashboard...',
    loginTitle: 'Log In', signupTitle: 'Sign Up',
    loginSub: 'Welcome back to Jobparsing+', signupSub: 'Create your account in less than 2 minutes',
    createAccount: 'Create account', haveAccount: 'Already have an account?',
    candidate: 'Candidate', employer: 'Employer',
    phFullName: 'FULL NAME', phCompany: 'COMPANY NAME', phUsername: 'USERNAME',
    phContactEmail: 'CONTACT EMAIL', phPhone: 'PHONE NUMBER', phKkf: 'KKF NUMBER (OPTIONAL)',
    phEmail: 'EMAIL ADDRESS', phPassword: 'PASSWORD', phConfirm: 'CONFIRM PASSWORD',
    forgotPassword: 'Forgot password?',
    processing: 'Processing...', submitLogin: 'Log In', submitSignup: 'Create Account',
    employerNote: 'As an employer you get access to a dashboard where you can post vacancies that become instantly visible to candidates.',
    consent1: 'By creating an account you agree to the ',
    consentTerms: 'terms & conditions',
    consent2: ' and the ',
    consentPrivacy: 'privacy statement',
    consent3: '.',
    errEmail: 'Enter a valid email address.',
    errFullName: 'Enter your full name.',
    errPassword8: 'Use at least 8 characters.',
    errConfirm: 'Passwords do not match.',
    errUsername: 'Enter a username.',
    errCompany: 'Enter a company name.',
    errPhone: 'Enter a valid phone number.',
    errKkf: 'Format: 4-8 digits, optionally with a letter suffix.',
    errPasswordComplex: 'Min. 8 characters, with a letter and a digit.',
  },
  es: {
    backHome: 'Volver al inicio',
    tagline: 'Acceso al centro de talento más avanzado de Surinam.',
    feat1: 'Perfiles y Vacantes Verificados',
    feat2: 'Puntuación de Coincidencias con IA',
    feat3: 'Proceso Seguro y Transparente',
    privacy: 'PRIVACIDAD', terms: 'TÉRMINOS',
    success: '¡Éxito!',
    redirecting: 'Se te está redirigiendo',
    toMatches: ' a tus coincidencias...', toDashboard: ' a tu panel...',
    loginTitle: 'Iniciar sesión', signupTitle: 'Registrarse',
    loginSub: 'Bienvenido de nuevo a Jobparsing+', signupSub: 'Crea tu cuenta en menos de 2 minutos',
    createAccount: 'Crear cuenta', haveAccount: '¿Ya tienes una cuenta?',
    candidate: 'Candidato', employer: 'Empleador',
    phFullName: 'NOMBRE COMPLETO', phCompany: 'NOMBRE DE LA EMPRESA', phUsername: 'NOMBRE DE USUARIO',
    phContactEmail: 'CORREO DE CONTACTO', phPhone: 'NÚMERO DE TELÉFONO', phKkf: 'NÚMERO KKF (OPCIONAL)',
    phEmail: 'CORREO ELECTRÓNICO', phPassword: 'CONTRASEÑA', phConfirm: 'CONFIRMAR CONTRASEÑA',
    forgotPassword: '¿Olvidaste tu contraseña?',
    processing: 'Procesando...', submitLogin: 'Iniciar sesión', submitSignup: 'Crear cuenta',
    employerNote: 'Como empleador obtienes acceso a un panel donde puedes publicar vacantes que se vuelven visibles de inmediato para los candidatos.',
    consent1: 'Al crear una cuenta aceptas los ',
    consentTerms: 'términos y condiciones',
    consent2: ' y la ',
    consentPrivacy: 'declaración de privacidad',
    consent3: '.',
    errEmail: 'Introduce una dirección de correo válida.',
    errFullName: 'Introduce tu nombre completo.',
    errPassword8: 'Usa al menos 8 caracteres.',
    errConfirm: 'Las contraseñas no coinciden.',
    errUsername: 'Introduce un nombre de usuario.',
    errCompany: 'Introduce un nombre de empresa.',
    errPhone: 'Introduce un número de teléfono válido.',
    errKkf: 'Formato: 4-8 dígitos, opcionalmente con un sufijo de letra.',
    errPasswordComplex: 'Mín. 8 caracteres, con una letra y un dígito.',
  },
};

function AuthInner() {
  const searchParams = useSearchParams();
  const signupParam = searchParams.get('signup') === '1';
  const roleParam = searchParams.get('role');
  const emailParam = searchParams.get('email') || '';
  const nameParam = searchParams.get('name') || '';

  const [isLogin, setIsLogin] = useState(!signupParam);
  const [role, setRole] = useState<Role>(roleParam === 'employer' ? 'employer' : 'candidate');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState({
    email: emailParam, password: '', confirmPassword: '', fullName: nameParam, username: '', companyName: '', phone: '', kkfNumber: '',
  });

  useEffect(() => {
    if (emailParam || nameParam) {
      setFormValues(v => ({ ...v, email: emailParam || v.email, fullName: nameParam || v.fullName }));
    }
  }, [emailParam, nameParam]);
  const [formErrors, setFormErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string; fullName?: string;
    username?: string; companyName?: string; phone?: string; kkfNumber?: string; form?: string;
  }>({});
  const router = useRouter();
  const { loginCandidate, registerCandidate, loginEmployer, registerEmployer } = useAuth();
  const t = useT(AUTH_T);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof formErrors = {};
    const password = formValues.password;

    if (role === 'candidate') {
      const email = formValues.email.trim().toLowerCase();
      if (!isValidEmail(email)) nextErrors.email = t.errEmail;
      if (!isLogin && !formValues.fullName.trim()) nextErrors.fullName = t.errFullName;
      if (password.length < 8) nextErrors.password = t.errPassword8;
      if (!isLogin && password !== formValues.confirmPassword) {
        nextErrors.confirmPassword = t.errConfirm;
      }
    } else {
      // employer
      if (!formValues.username.trim()) nextErrors.username = t.errUsername;
      if (!isLogin) {
        if (!formValues.companyName.trim()) nextErrors.companyName = t.errCompany;
        if (!formValues.email.trim() || !isValidEmail(formValues.email.trim().toLowerCase())) {
          nextErrors.email = t.errEmail;
        }
        if (!isValidPhone(formValues.phone)) {
          nextErrors.phone = t.errPhone;
        }
        if (formValues.kkfNumber.trim() && !/^\d{4,8}[A-Za-z]?$/.test(formValues.kkfNumber.trim())) {
          nextErrors.kkfNumber = t.errKkf;
        }
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
          nextErrors.password = t.errPasswordComplex;
        }
        if (password !== formValues.confirmPassword) {
          nextErrors.confirmPassword = t.errConfirm;
        }
      } else if (password.length < 8) {
        nextErrors.password = t.errPassword8;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    let result: { ok: true } | { ok: false; message: string };
    if (role === 'candidate') {
      const email = formValues.email.trim().toLowerCase();
      result = isLogin
        ? await loginCandidate(email, password)
        : await registerCandidate({ email, password, fullName: formValues.fullName.trim() });
    } else {
      const username = formValues.username.trim().toLowerCase();
      result = isLogin
        ? await loginEmployer(username, password)
        : await registerEmployer({
            username,
            password,
            companyName: formValues.companyName.trim(),
            contactEmail: formValues.email.trim().toLowerCase(),
            phone: formValues.phone.trim(),
            kkfNumber: formValues.kkfNumber.trim() || undefined,
          });
    }

    setIsLoading(false);

    if (!result.ok) {
      setFormErrors({ form: result.message });
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      router.push(role === 'candidate' ? '/mijn-matches' : '/dashboard/company');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 bg-white border-4 border-black shadow-[32px_32px_0px_0px_rgba(59,130,246,1)] relative z-10"
      >
        <div className="bg-black text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden min-w-0">
          <div className="relative z-10 min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 mb-12 hover:text-blue-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.backHome}</span>
            </Link>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-8 break-words">
              Jobparsing<span className="text-blue-600 italic">+</span>
            </h1>
            <p className="text-xl font-bold text-slate-400 uppercase tracking-tight italic max-w-sm mb-12">
              {t.tagline}
            </p>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, text: t.feat1 },
                { icon: Zap, text: t.feat2 },
                { icon: Lock, text: t.feat3 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                  <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-20 pt-10 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span>© 2026 JOBPARSING+</span>
            <div className="flex gap-4">
              <Link href="/privacyverklaring" className="hover:text-white transition-colors">{t.privacy}</Link>
              <Link href="/algemene-voorwaarden" className="hover:text-white transition-colors">{t.terms}</Link>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="p-8 md:p-12">
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">{t.success}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {t.redirecting}{role === 'candidate' ? t.toMatches : t.toDashboard}
              </p>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2">
                    {isLogin ? t.loginTitle : t.signupTitle}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isLogin ? t.loginSub : t.signupSub}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormErrors({});
                  }}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                >
                  {isLogin ? t.createAccount : t.haveAccount}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => { setRole('candidate'); setFormErrors({}); }}
                  className={cn(
                    'flex flex-col items-center gap-3 p-5 border-2 transition-all group',
                    role === 'candidate' ? 'border-black bg-black text-white' : 'border-slate-100 hover:border-black text-slate-400',
                  )}
                >
                  <User className={cn('w-5 h-5', role === 'candidate' ? 'text-blue-400' : 'group-hover:text-black')} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.candidate}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('employer'); setFormErrors({}); }}
                  className={cn(
                    'flex flex-col items-center gap-3 p-5 border-2 transition-all group',
                    role === 'employer' ? 'border-black bg-black text-white' : 'border-slate-100 hover:border-black text-slate-400',
                  )}
                >
                  <Building2 className={cn('w-5 h-5', role === 'employer' ? 'text-blue-400' : 'group-hover:text-black')} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.employer}</span>
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 flex-1">
                {role === 'candidate' && !isLogin && (
                  <FormField icon={User} placeholder={t.phFullName} value={formValues.fullName} onChange={(v) => setFormValues((p) => ({ ...p, fullName: v }))} error={formErrors.fullName} />
                )}
                {role === 'employer' && !isLogin && (
                  <FormField icon={Building2} placeholder={t.phCompany} value={formValues.companyName} onChange={(v) => setFormValues((p) => ({ ...p, companyName: v }))} error={formErrors.companyName} />
                )}
                {role === 'employer' ? (
                  <>
                    <FormField icon={User} placeholder={t.phUsername} value={formValues.username} onChange={(v) => setFormValues((p) => ({ ...p, username: v }))} error={formErrors.username} />
                    {!isLogin && (
                      <>
                        <FormField icon={Mail} type="email" placeholder={t.phContactEmail} value={formValues.email} onChange={(v) => setFormValues((p) => ({ ...p, email: v }))} error={formErrors.email} />
                        <FormField icon={Phone} type="tel" placeholder={t.phPhone} value={formValues.phone} onChange={(v) => setFormValues((p) => ({ ...p, phone: v }))} error={formErrors.phone} />
                        <FormField icon={FileCheck} placeholder={t.phKkf} value={formValues.kkfNumber} onChange={(v) => setFormValues((p) => ({ ...p, kkfNumber: v }))} error={formErrors.kkfNumber} />
                      </>
                    )}
                  </>
                ) : (
                  <FormField icon={Mail} type="email" placeholder={t.phEmail} value={formValues.email} onChange={(v) => setFormValues((p) => ({ ...p, email: v }))} error={formErrors.email} />
                )}
                <FormField icon={Lock} type="password" placeholder={t.phPassword} value={formValues.password} onChange={(v) => setFormValues((p) => ({ ...p, password: v }))} error={formErrors.password} />
                {!isLogin && (
                  <FormField icon={Lock} type="password" placeholder={t.phConfirm} value={formValues.confirmPassword} onChange={(v) => setFormValues((p) => ({ ...p, confirmPassword: v }))} error={formErrors.confirmPassword} />
                )}

                {isLogin && (
                  <div className="text-right">
                    <Link
                      href={`/wachtwoord-vergeten?role=${role}`}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                    >
                      {t.forgotPassword}
                    </Link>
                  </div>
                )}

                {formErrors.form && <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{formErrors.form}</p>}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 mt-6 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      {isLogin ? t.submitLogin : t.submitSignup}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isLogin && (
                  <p className="text-[10px] font-bold text-slate-400 italic mt-4 text-center">
                    {t.consent1}
                    <Link href="/algemene-voorwaarden" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentTerms}</Link>
                    {t.consent2}
                    <Link href="/privacyverklaring" className="text-blue-600 underline underline-offset-2 hover:text-black">{t.consentPrivacy}</Link>
                    {t.consent3}
                  </p>
                )}

                {role === 'employer' && !isLogin && (
                  <p className="text-[10px] font-bold text-slate-400 italic mt-4 text-center">
                    {t.employerNote}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}

function FormField({
  icon: Icon, placeholder, value, onChange, error, type = 'text',
}: {
  icon: typeof User; placeholder: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string;
}) {
  return (
    <div>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className="w-full p-4 pl-12 border-2 border-slate-100 outline-none focus:border-black font-black uppercase tracking-widest text-[11px] bg-slate-50 focus:bg-white transition-all"
        />
      </div>
      {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-1">{error}</p>}
    </div>
  );
}
