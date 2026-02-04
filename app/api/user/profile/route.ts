import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/user/profile - Fetch user profile
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch user first to ensure they exist and get their basic info
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate campaign statistics using database aggregation (O(1) instead of O(N))
        const stats = await prisma.campaign.aggregate({
            where: { userId: user.id },
            _sum: {
                orderCount: true,
                successCount: true,
                failedCount: true
            },
            _count: true
        });

        const totalCampaigns = stats._count;
        const totalOrders = stats._sum.orderCount || 0;
        const totalSuccess = stats._sum.successCount || 0;
        const totalFailed = stats._sum.failedCount || 0;
        const successRate = totalOrders > 0 ? ((totalSuccess / totalOrders) * 100).toFixed(1) : '0';

        // Return user profile (exclude password)
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            stats: {
                totalCampaigns,
                totalOrders,
                totalSuccess,
                totalFailed,
                successRate
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const { userId, name, email, currentPassword, newPassword } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch current user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password if provided
        if (currentPassword) {
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
            }
        } else if (newPassword || email !== user.email) {
            // Require current password for sensitive changes
            return NextResponse.json({ error: 'Current password is required for this change' }, { status: 400 });
        }

        // Check email uniqueness if changing email
        if (email && email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        // Hash new password if provided
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Return updated user (exclude password)
        return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
