import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateVerificationCode, sendVerificationEmail, getCodeExpiryTime } from '@/lib/emailService';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, termsAccepted } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (!termsAccepted) {
            return NextResponse.json({ error: 'You must accept the Terms & Conditions' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const codeExpiresAt = getCodeExpiryTime();

        // Create user (unverified)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: email === 'admin@admin.com' ? 'ADMIN' : 'USER',
                termsAccepted: true,
                termsAcceptedAt: new Date(),
                emailVerified: email === 'admin@admin.com', // Auto-verify admin
                verificationCode: email === 'admin@admin.com' ? null : verificationCode,
                codeExpiresAt: email === 'admin@admin.com' ? null : codeExpiresAt,
                codeAttempts: 0
            }
        });

        // Send verification email (skip for admin)
        if (email !== 'admin@admin.com') {
            await sendVerificationEmail(email, verificationCode);
        }

        // Return success message and user info
        return NextResponse.json({
            message: email === 'admin@admin.com'
                ? 'Admin account created successfully!'
                : 'Signup successful! Please check your email for the verification code.',
            email: user.email,
            requiresVerification: email !== 'admin@admin.com',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
