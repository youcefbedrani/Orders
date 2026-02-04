import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/files - Fetch all campaigns with file information
export async function GET(request: NextRequest) {
    try {
        // Check if user is admin (you should implement proper auth check)
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin role
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Fetch all campaigns with user information
        const campaigns = await prisma.campaign.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format response
        const filesData = campaigns.map(campaign => ({
            id: campaign.id,
            url: campaign.url,
            fileName: campaign.fileName,
            fileUrl: campaign.fileUrl,
            fileSize: campaign.fileSize,
            mode: campaign.mode,
            orderCount: campaign.orderCount,
            successCount: campaign.successCount,
            failedCount: campaign.failedCount,
            successRate: campaign.successRate,
            duration: campaign.duration,
            createdAt: campaign.createdAt,
            user: campaign.user ? {
                id: campaign.user.id,
                name: campaign.user.name,
                email: campaign.user.email
            } : null
        }));

        return NextResponse.json({
            files: filesData,
            total: filesData.length
        });

    } catch (error) {
        console.error('Get files error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
