import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const userId = searchParams.get('userId');

        // Build where clause
        const where = userId ? { userId } : {};

        // Fetch campaigns ordered by most recent
        const campaigns = await prisma.campaign.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        // Calculate statistics
        const stats = await prisma.campaign.aggregate({
            where,
            _sum: {
                orderCount: true,
                successCount: true,
                failedCount: true
            },
            _count: true
        });

        // Group by URL
        const campaignsByUrl = campaigns.reduce((acc: any, campaign: any) => {
            if (!acc[campaign.url]) {
                acc[campaign.url] = {
                    url: campaign.url,
                    totalCampaigns: 0,
                    totalOrders: 0,
                    totalSuccess: 0,
                    lastRun: campaign.createdAt
                };
            }
            acc[campaign.url].totalCampaigns++;
            acc[campaign.url].totalOrders += campaign.orderCount;
            acc[campaign.url].totalSuccess += campaign.successCount;
            if (new Date(campaign.createdAt) > new Date(acc[campaign.url].lastRun)) {
                acc[campaign.url].lastRun = campaign.createdAt;
            }
            return acc;
        }, {});

        return NextResponse.json({
            campaigns,
            stats: {
                totalCampaigns: stats._count,
                totalOrders: stats._sum.orderCount || 0,
                totalSuccess: stats._sum.successCount || 0,
                totalFailed: stats._sum.failedCount || 0
            },
            byUrl: Object.values(campaignsByUrl)
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({
            error: 'Failed to fetch campaigns'
        }, { status: 500 });
    }
}
