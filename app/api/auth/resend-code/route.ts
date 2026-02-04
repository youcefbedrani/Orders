import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateVerificationCode, sendVerificationEmail, getCodeExpiryTime } from '@/lib/emailService';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json({
                error: 'Email already verified'
            }, { status: 400 });
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const codeExpiresAt = getCodeExpiryTime();

        // Update user with new code and reset attempts
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCode,
                codeExpiresAt,
                codeAttempts: 0
            }
        });

        // Send new verification email
        await sendVerificationEmail(email, verificationCode);

        return NextResponse.json({
            message: 'New verification code sent! Please check your email.',
            success: true
        });

    } catch (error) {
        console.error('Resend code error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
