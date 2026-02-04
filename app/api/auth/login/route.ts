import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Auto-create admin if it's the specific credentials
        if (email === 'admin@admin.com' && password === 'admin123') {
            let admin = await prisma.user.findUnique({ where: { email } });

            if (!admin) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                admin = await prisma.user.create({
                    data: {
                        name: 'System Admin',
                        email: 'admin@admin.com',
                        password: hashedPassword,
                        role: 'ADMIN',
                        emailVerified: true,
                        termsAccepted: true,
                        termsAcceptedAt: new Date()
                    }
                });
            } else {
                // If exists but wrong password (e.g. was changed manually), we verify below
                // But for "admin123" password specifically, we might want to respect the hash check
                // For simplicity: continue standard check
            }
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check email verification
        if (!user.emailVerified) {
            return NextResponse.json({
                error: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email
            }, { status: 403 });
        }

        // Return user info
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
