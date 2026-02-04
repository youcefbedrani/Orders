import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const jobId = params.id;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                status: true,
                orderCount: true,
                processedCount: true,
                successCount: true,
                failedCount: true,
                error: true,
                results: true
            }
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json(job);

    } catch (error) {
        console.error('Fetch job progress error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
