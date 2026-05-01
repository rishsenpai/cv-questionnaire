import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import AdminToken from '@/models/AdminToken';
import EmployerToken from '@/models/EmployerToken';
import Employer from '@/models/Employer';
import CandidateToken from '@/models/CandidateToken';
import Candidate from '@/models/Candidate';

export const ADMIN_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function validateAdminToken(token: string | null | undefined): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;
    try {
        await connectDB();
        const doc = await AdminToken.findOne({ token });
        if (!doc) return false;
        if (doc.expires.getTime() <= Date.now()) {
            await AdminToken.deleteOne({ _id: doc._id }).catch(() => {});
            return false;
        }
        return true;
    } catch (err) {
        console.error('validateAdminToken error:', err instanceof Error ? err.message : err);
        return false;
    }
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
    const token = req.headers.get('x-admin-token');
    if (!(await validateAdminToken(token))) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

export interface EmployerAuth {
    employerId: Types.ObjectId;
    plan: string;
}

export async function requireEmployer(req: NextRequest): Promise<EmployerAuth | NextResponse> {
    try {
        await connectDB();
        const token = req.headers.get('x-employer-token');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const tokenData = await EmployerToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const employer = await Employer.findById(tokenData.employerId);
        if (!employer || !employer.isActive) {
            await EmployerToken.deleteOne({ token });
            return NextResponse.json({ success: false, message: 'Account inactive' }, { status: 401 });
        }
        return {
            employerId: tokenData.employerId,
            plan: employer.plan || 'basic',
        };
    } catch (err) {
        console.error('requireEmployer error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
    }
}

export interface CandidateAuth {
    candidateId: Types.ObjectId;
    email: string;
}

export async function requireCandidate(req: NextRequest): Promise<CandidateAuth | NextResponse> {
    try {
        await connectDB();
        const token = req.headers.get('x-candidate-token');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const tokenData = await CandidateToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const candidate = await Candidate.findById(tokenData.candidateId);
        if (!candidate || !candidate.isActive) {
            await CandidateToken.deleteOne({ token });
            return NextResponse.json({ success: false, message: 'Account inactive' }, { status: 401 });
        }
        return {
            candidateId: tokenData.candidateId,
            email: candidate.email,
        };
    } catch (err) {
        console.error('requireCandidate error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
    }
}
