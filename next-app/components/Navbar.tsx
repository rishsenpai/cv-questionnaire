'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { User, LogOut, ChevronDown, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { readJson } from '@/lib/storage';
import { useDismissibleLayer } from '@/hooks/use-dismissible-layer';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = () => {
      setUser(readJson('suri_user', null));
    };

    checkUser();
    // Listen for storage changes (for cross-tab or same-window updates)
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);
  useDismissibleLayer(showDropdown, dropdownRef, () => setShowDropdown(false));
  useDismissibleLayer(isMobileMenuOpen, mobileMenuRef, () => setIsMobileMenuOpen(false));

  const handleLogout = () => {
    localStorage.removeItem('suri_user');
    setUser(null);
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const links = [
    { name: 'Vacatures', href: '/vacatures' },
    { name: 'Bedrijven', href: '/bedrijven' },
    { name: 'Salariswijzer', href: '/salariswijzer' },
    { name: 'Kandidaten', href: '/kandidaten' },
    { name: 'Over Ons', href: '/over-ons' },
  ];

  const dashboardLink = user?.onboarded 
    ? (user?.role === 'employer' ? '/dashboard/company' : '/dashboard/candidate')
    : '/onboarding';

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">
                SuriJobs<span className="text-blue-600">+</span>
              </span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {links.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={cn(
                    "hover:text-black transition-colors relative py-1",
                    pathname === link.href && "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/talent" 
              className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-colors border-r border-slate-200 pr-4 mr-2"
            >
              Talent Pool
            </Link>
            <Link 
              href="/dashboard/company" 
              className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
            >
              Werkgevers
            </Link>
            
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
                  {!user.onboarded && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
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
                        href={dashboardLink} 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors w-full text-left"
                      >
                        Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-600 transition-colors w-full text-left border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4" /> Uitloggen
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                href="/auth"
                className="bg-black text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
              >
                Inloggen
              </Link>
            )}

            {/* Mobile Menu Toggle */}
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

      {/* Mobile Menu */}
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
                    pathname === link.href ? "text-blue-600" : "text-slate-500"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                <Link 
                  href="/talent"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Talent Pool
                </Link>
                <Link 
                  href="/dashboard/company"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Werkgevers
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
