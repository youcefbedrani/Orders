import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
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
                message: 'Email already verified. You can now login!'
            });
        }

        // Check attempts limit
        if (user.codeAttempts >= 5) {
            return NextResponse.json({
                error: 'Too many failed attempts. Please request a new verification code.',
                tooManyAttempts: true
            }, { status: 429 });
        }

        // Check if code expired
        if (user.codeExpiresAt && new Date() > user.codeExpiresAt) {
            return NextResponse.json({
                error: 'Verification code has expired. Please request a new code.',
                expired: true
            }, { status: 400 });
        }

        // Verify code
        if (user.verificationCode !== code) {
            // Increment failed attempts
            await prisma.user.update({
                where: { id: user.id },
                data: { codeAttempts: user.codeAttempts + 1 }
            });

            const attemptsLeft = 5 - (user.codeAttempts + 1);
            return NextResponse.json({
                error: 'Invalid verification code',
                attemptsLeft
            }, { status: 400 });
        }

        // Code is valid - verify user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationCode: null,
                codeExpiresAt: null,
                codeAttempts: 0
            }
        });

        return NextResponse.json({
            message: 'Email verified successfully! You can now login.',
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: true
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
