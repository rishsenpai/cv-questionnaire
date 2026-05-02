import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'SuriJobs+ | Modern Vacaturebank Suriname',
  description: 'De slimste vacaturebank van Suriname met AI-matching en moderne filtering.',
};

import { Navbar } from '@/components/Navbar';
import { AICareerScout } from '@/components/AICareerScout';
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="nl" className={`${inter.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-slate-900 bg-slate-50">
        <AuthProvider>
          <Navbar />
          {children}
          <AICareerScout />
        </AuthProvider>
      </body>
    </html>
  );
}
