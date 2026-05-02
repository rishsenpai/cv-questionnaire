import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import { connectDB } from '@/lib/db';
import BackupContact from '@/models/BackupContact';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fullName, email, phone } = body || {};

        if (!fullName || !email) {
            return NextResponse.json(
                { success: false, message: 'Name and email are required' },
                { status: 400 },
            );
        }

        if (!validator.isEmail(String(email))) {
            return NextResponse.json(
                { success: false, message: 'Invalid email format' },
                { status: 400 },
            );
        }

        await connectDB();
        const normalizedEmail = String(email).toLowerCase().trim();
        const trimmedName = String(fullName).trim();
        const trimmedPhone = phone ? String(phone).trim() : '';

        let backupContact = await BackupContact.findOne({ email: normalizedEmail });
        if (backupContact) {
            backupContact.fullName = trimmedName;
            backupContact.phone = trimmedPhone;
            backupContact.status = 'pending';
            await backupContact.save();
        } else {
            backupContact = await BackupContact.create({
                fullName: trimmedName,
                email: normalizedEmail,
                phone: trimmedPhone,
                status: 'pending',
            });
        }

        console.log(`Backup contact saved: ${trimmedName} (${normalizedEmail})`);
        return NextResponse.json({
            success: true,
            message: 'Contact details saved',
            id: String(backupContact._id),
        });
    } catch (err) {
        console.error('Error saving backup contact:', err);
        return NextResponse.json(
            { success: false, message: 'Error saving contact details' },
            { status: 500 },
        );
    }
}
