import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import { connectDB } from '@/lib/db';
import Employer from '@/models/Employer';
import EmployerToken from '@/models/EmployerToken';
import { ADMIN_TOKEN_EXPIRY_MS, generateToken, getClientIP } from '@/lib/server/auth';
import { isValidPhone } from '@/lib/validation';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { username, password, companyName, contactEmail, phone, kkfNumber } = body || {};

        if (!username || !password || !companyName || !contactEmail || !phone) {
            return NextResponse.json(
                { success: false, message: 'Gebruikersnaam, wachtwoord, bedrijfsnaam, e-mail en telefoonnummer zijn verplicht' },
                { status: 400 },
            );
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Wachtwoord moet minimaal 8 tekens zijn met minstens één letter en één cijfer' },
                { status: 400 },
            );
        }

        if (!validator.isEmail(String(contactEmail))) {
            return NextResponse.json(
                { success: false, message: 'Ongeldig contact-e-mailadres' },
                { status: 400 },
            );
        }

        if (!isValidPhone(phone)) {
            return NextResponse.json(
                { success: false, message: 'Ongeldig telefoonnummer' },
                { status: 400 },
            );
        }

        // KKF-nummer is optioneel. Als opgegeven: cijfers, optioneel letter-suffix
        // (bv. "12345" of "12345A"). Geen live API-lookup beschikbaar bij KKF.sr.
        const trimmedKkf = kkfNumber ? String(kkfNumber).trim() : '';
        if (trimmedKkf && !/^\d{4,8}[A-Za-z]?$/.test(trimmedKkf)) {
            return NextResponse.json(
                { success: false, message: 'Ongeldig KKF-nummer (4-8 cijfers, optioneel met letter-suffix)' },
                { status: 400 },
            );
        }

        const normalizedUsername = String(username).toLowerCase().trim();
        const existing = await Employer.findOne({ username: normalizedUsername });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Deze gebruikersnaam is al in gebruik' },
                { status: 409 },
            );
        }

        const employer = await Employer.create({
            username: normalizedUsername,
            password,
            companyName: String(companyName).trim(),
            contactEmail: String(contactEmail).toLowerCase().trim(),
            phone: String(phone).trim(),
            kkfNumber: trimmedKkf || undefined,
            plan: 'basic',
            isActive: true,
        });

        const token = generateToken();
        await EmployerToken.create({
            token,
            employerId: employer._id,
            expires: new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MS),
        });

        console.log(`[SECURITY] Employer self-registered: ${employer.username} (${employer.companyName}) from IP: ${getClientIP(req)}`);

        return NextResponse.json({
            success: true,
            token,
            employer: {
                companyName: employer.companyName,
                plan: employer.plan,
            },
        });
    } catch (err) {
        const e = err as { code?: number; message?: string };
        console.error('Employer register error:', err);
        return NextResponse.json(
            {
                success: false,
                message: e.code === 11000 ? 'Deze gebruikersnaam is al in gebruik' : 'Registratie mislukt',
            },
            { status: 500 },
        );
    }
}
