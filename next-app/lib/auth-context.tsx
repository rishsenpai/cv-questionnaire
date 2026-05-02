'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

const CANDIDATE_TOKEN_KEY = 'suri_candidate_token';
const EMPLOYER_TOKEN_KEY = 'suri_employer_token';
const ADMIN_TOKEN_KEY = 'suri_admin_token';

// Backwards-compat shim: oude pagina's (Navbar, dashboards) lezen
// `suri_user` uit localStorage. Tot die migreren naar useAuth() houden
// we deze key bij. Zodra alle pages over zijn — verwijderen.
interface LegacyUserShim {
    role: 'candidate' | 'employer';
    name: string;
    email?: string;
    isLoggedIn: true;
    onboarded: true;
}

function writeLegacyUser(user: LegacyUserShim) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('suri_user', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
}

function clearLegacyUser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('suri_user');
    window.dispatchEvent(new Event('storage'));
}

export interface CandidateUser {
    email: string;
    fullName: string;
    id?: string;
    phone?: string;
    location?: string;
    linkedCvIds?: string[];
}

export interface EmployerUser {
    companyName: string;
    plan: 'basic' | 'advanced' | 'premium';
}

interface AuthContextValue {
    candidate: CandidateUser | null;
    candidateToken: string | null;
    employer: EmployerUser | null;
    employerToken: string | null;
    adminToken: string | null;
    isLoading: boolean;

    loginCandidate: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
    registerCandidate: (data: { email: string; password: string; fullName: string; phone?: string; location?: string }) => Promise<{ ok: true } | { ok: false; message: string }>;
    logoutCandidate: () => void;

    loginEmployer: (username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
    logoutEmployer: () => void;

    loginAdmin: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
    logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [candidate, setCandidate] = useState<CandidateUser | null>(null);
    const [candidateToken, setCandidateToken] = useState<string | null>(null);
    const [employer, setEmployer] = useState<EmployerUser | null>(null);
    const [employerToken, setEmployerToken] = useState<string | null>(null);
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cToken = localStorage.getItem(CANDIDATE_TOKEN_KEY);
        const eToken = localStorage.getItem(EMPLOYER_TOKEN_KEY);
        const aToken = localStorage.getItem(ADMIN_TOKEN_KEY);

        const verifyTasks: Promise<void>[] = [];
        if (cToken) {
            verifyTasks.push(fetch('/api/candidate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: cToken }),
            }).then(async r => {
                if (!r.ok) {
                    localStorage.removeItem(CANDIDATE_TOKEN_KEY);
                    return;
                }
                const data = await r.json();
                if (data.success && data.candidate) {
                    setCandidate({ email: data.candidate.email, fullName: data.candidate.fullName });
                    setCandidateToken(cToken);
                    writeLegacyUser({ role: 'candidate', name: data.candidate.fullName, email: data.candidate.email, isLoggedIn: true, onboarded: true });
                }
            }).catch(() => localStorage.removeItem(CANDIDATE_TOKEN_KEY)));
        }
        if (eToken) {
            verifyTasks.push(fetch('/api/employer/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: eToken }),
            }).then(async r => {
                if (!r.ok) {
                    localStorage.removeItem(EMPLOYER_TOKEN_KEY);
                    return;
                }
                const data = await r.json();
                if (data.success) {
                    setEmployer({ companyName: data.companyName, plan: data.plan });
                    setEmployerToken(eToken);
                    writeLegacyUser({ role: 'employer', name: data.companyName, isLoggedIn: true, onboarded: true });
                }
            }).catch(() => localStorage.removeItem(EMPLOYER_TOKEN_KEY)));
        }
        if (aToken) {
            verifyTasks.push(fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: aToken }),
            }).then(async r => {
                if (r.ok) {
                    setAdminToken(aToken);
                } else {
                    localStorage.removeItem(ADMIN_TOKEN_KEY);
                }
            }).catch(() => localStorage.removeItem(ADMIN_TOKEN_KEY)));
        }

        Promise.all(verifyTasks).finally(() => setIsLoading(false));
    }, []);

    const loginCandidate = useCallback<AuthContextValue['loginCandidate']>(async (email, password) => {
        const res = await fetch('/api/candidate/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            return { ok: false, message: data.message || 'Login failed' };
        }
        localStorage.setItem(CANDIDATE_TOKEN_KEY, data.token);
        setCandidateToken(data.token);
        setCandidate({ email: data.candidate.email, fullName: data.candidate.fullName });
        writeLegacyUser({ role: 'candidate', name: data.candidate.fullName, email: data.candidate.email, isLoggedIn: true, onboarded: true });
        return { ok: true };
    }, []);

    const registerCandidate = useCallback<AuthContextValue['registerCandidate']>(async (data) => {
        const res = await fetch('/api/candidate/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            return { ok: false, message: result.message || 'Registration failed' };
        }
        localStorage.setItem(CANDIDATE_TOKEN_KEY, result.token);
        setCandidateToken(result.token);
        setCandidate({ email: result.candidate.email, fullName: result.candidate.fullName });
        writeLegacyUser({ role: 'candidate', name: result.candidate.fullName, email: result.candidate.email, isLoggedIn: true, onboarded: true });
        return { ok: true };
    }, []);

    const logoutCandidate = useCallback(() => {
        localStorage.removeItem(CANDIDATE_TOKEN_KEY);
        setCandidateToken(null);
        setCandidate(null);
        clearLegacyUser();
    }, []);

    const loginEmployer = useCallback<AuthContextValue['loginEmployer']>(async (username, password) => {
        const res = await fetch('/api/employer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            return { ok: false, message: data.message || 'Login failed' };
        }
        localStorage.setItem(EMPLOYER_TOKEN_KEY, data.token);
        setEmployerToken(data.token);
        setEmployer({ companyName: data.employer.companyName, plan: data.employer.plan });
        writeLegacyUser({ role: 'employer', name: data.employer.companyName, isLoggedIn: true, onboarded: true });
        return { ok: true };
    }, []);

    const logoutEmployer = useCallback(() => {
        localStorage.removeItem(EMPLOYER_TOKEN_KEY);
        setEmployerToken(null);
        setEmployer(null);
        clearLegacyUser();
    }, []);

    const loginAdmin = useCallback<AuthContextValue['loginAdmin']>(async (password) => {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            return { ok: false, message: data.message || 'Login failed' };
        }
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setAdminToken(data.token);
        return { ok: true };
    }, []);

    const logoutAdmin = useCallback(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdminToken(null);
    }, []);

    const value: AuthContextValue = {
        candidate, candidateToken,
        employer, employerToken,
        adminToken,
        isLoading,
        loginCandidate, registerCandidate, logoutCandidate,
        loginEmployer, logoutEmployer,
        loginAdmin, logoutAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
