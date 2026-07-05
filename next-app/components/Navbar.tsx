'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { User, LogOut, ChevronDown, Menu, X as CloseIcon, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { readJson } from '@/lib/storage';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';
import { useLang, useT, LANGS } from '@/lib/i18n/LanguageProvider';

const NAV_T = {
  nl: { vacatures: 'Vacatures', sectoren: 'Sectoren', cvUpload: 'CV Upload', mijnMatches: 'Mijn Matches', werkgevers: 'Werkgevers', overOns: 'Over Ons', mijnVacatures: 'Mijn Vacatures', inloggen: 'Inloggen', aanmelden: 'Aanmelden', uitloggen: 'Uitloggen', taal: 'Taal' },
  en: { vacatures: 'Jobs', sectoren: 'Sectors', cvUpload: 'Upload CV', mijnMatches: 'My Matches', werkgevers: 'Employers', overOns: 'About', mijnVacatures: 'My Vacancies', inloggen: 'Log in', aanmelden: 'Sign up', uitloggen: 'Log out', taal: 'Language' },
  es: { vacatures: 'Vacantes', sectoren: 'Sectores', cvUpload: 'Subir CV', mijnMatches: 'Mis Coincidencias', werkgevers: 'Empleadores', overOns: 'Nosotros', mijnVacatures: 'Mis Vacantes', inloggen: 'Iniciar sesión', aanmelden: 'Registrarse', uitloggen: 'Cerrar sesión', taal: 'Idioma' },
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; onboarded?: boolean; role?: 'candidate' | 'employer' } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const { lang, setLang } = useLang();
  const t = useT(NAV_T);

  useEffect(() => {
    const checkUser = () => {
      setUser(readJson('suri_user', null));
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);
  useDismissibleLayer(showDropdown, dropdownRef, () => setShowDropdown(false));
  useDismissibleLayer(isMobileMenuOpen, mobileMenuRef, () => setIsMobileMenuOpen(false));
  useDismissibleLayer(showLangMenu, langMenuRef, () => setShowLangMenu(false));

  // Admin-console heeft een eigen header — verberg de publieke navigatie daar.
  if (pathname?.startsWith('/admin')) return null;

  const handleLogout = () => {
    localStorage.removeItem('suri_candidate_token');
    localStorage.removeItem('suri_employer_token');
    localStorage.removeItem('suri_user');
    setUser(null);
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const isEmployer = user?.role === 'employer';

  const links = isEmployer ? [
    { name: t.mijnVacatures, href: '/dashboard/company' },
    { name: t.vacatures, href: '/vacatures' },
    { name: t.sectoren, href: '/sectoren' },
    { name: t.overOns, href: '/over-ons' },
  ] : [
    { name: t.vacatures, href: '/vacatures' },
    { name: t.sectoren, href: '/sectoren' },
    { name: t.cvUpload, href: '/cv-upload' },
    { name: t.mijnMatches, href: '/mijn-matches' },
    { name: t.werkgevers, href: '/voor-werkgevers' },
    { name: t.overOns, href: '/over-ons' },
  ];

  const LangSwitcher = (
    <div ref={langMenuRef} className="relative">
      <button
        onClick={() => setShowLangMenu(v => !v)}
        aria-expanded={showLangMenu}
        aria-haspopup="menu"
        aria-label={t.taal}
        className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-transparent hover:border-black transition-all"
      >
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="hidden xs:inline">{lang.toUpperCase()}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', showLangMenu && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {showLangMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-44 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-2 z-[60]"
            role="menu"
          >
            {LANGS.map(l => (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={lang === l.code}
                onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest w-full text-left transition-colors',
                  lang === l.code ? 'bg-black text-white' : 'hover:bg-slate-50',
                )}
              >
                <span className="text-base leading-none">{l.flag}</span> {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">
                Jobparsing<span className="text-blue-600">+</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "hover:text-black transition-colors relative py-1",
                    pathname === link.href && "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600",
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {LangSwitcher}
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                  aria-haspopup="menu"
                  aria-label="Open gebruikersmenu"
                  className="flex items-center gap-3 bg-black text-white px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="hidden xs:inline max-w-[80px] sm:max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showDropdown && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-2 z-[60]"
                    >
                      <Link
                        href={isEmployer ? '/dashboard/company' : '/mijn-matches'}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors w-full text-left"
                      >
                        {isEmployer ? 'Mijn Vacatures' : 'Mijn Matches'}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-600 transition-colors w-full text-left border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4" /> {t.uitloggen}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="hidden sm:inline-block border-2 border-black text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95"
                >
                  {t.inloggen}
                </Link>
                <Link
                  href="/auth?signup=1"
                  className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {t.aanmelden}
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Open mobiel menu"
              className="lg:hidden p-2 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-xs font-black uppercase tracking-[0.2em] py-2",
                    pathname === link.href ? "text-blue-600" : "text-slate-500",
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-black uppercase tracking-[0.2em] py-2 text-slate-700 border-t border-slate-100 pt-4"
                >
                  {t.inloggen}
                </Link>
              )}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{t.taal}</p>
                <div className="flex gap-2">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setIsMobileMenuOpen(false); }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-colors',
                        lang === l.code ? 'bg-black text-white border-black' : 'border-slate-200 text-slate-500',
                      )}
                    >
                      <span className="text-sm leading-none">{l.flag}</span> {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
