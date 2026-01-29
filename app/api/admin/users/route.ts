import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // In robust implementation, verify admin token/session here

        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { campaigns: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Remove passwords
        const safeUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            campaignCount: user._count.campaigns
        }));

        return NextResponse.json(safeUsers);

    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
