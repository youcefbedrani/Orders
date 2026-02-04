import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jobQueue } from '@/lib/jobQueue';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            userId,
            url,
            mode,
            orderCount,
            customPrice,
            fileName,
            fileUrl,
            fileSize,
            customerData
        } = body;

        // Validate required fields
        if (!userId || !url || !mode || !orderCount) {
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    details: { userId: !!userId, url: !!url, mode: !!mode, orderCount: !!orderCount }
                },
                { status: 400 }
            );
        }

        // Create job in database
        const job = await prisma.job.create({
            data: {
                userId,
                url,
                mode,
                orderCount,
                customPrice: customPrice || null,
                fileName: fileName || null,
                fileUrl: fileUrl || null,
                fileSize: fileSize || null,
                customerData: customerData ? (typeof customerData === 'string' ? customerData : JSON.stringify(customerData)) : null,
                status: 'PENDING'
            }
        });

        // Add to job queue
        await jobQueue.addJob({
            id: job.id,
            userId: job.userId,
            url: job.url,
            mode: job.mode,
            orderCount: job.orderCount,
            customPrice: job.customPrice || undefined,
            fileName: job.fileName || undefined,
            fileUrl: job.fileUrl || undefined,
            customerData: customerData || undefined
        });

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: 'Job created and queued successfully'
        });

    } catch (error) {
        console.error('Create job error:', error);
        return NextResponse.json(
            { error: 'Failed to create job' },
            { status: 500 }
        );
    }
}

// GET all jobs for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const jobs = await prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 jobs
        });

        // Parse results JSON for each job
        const jobsWithParsedResults = jobs.map(job => ({
            ...job,
            results: job.results ? JSON.parse(job.results) : null,
            customerData: null // Don't send customer data in list view
        }));

        return NextResponse.json({ jobs: jobsWithParsedResults });

    } catch (error) {
        console.error('Get jobs error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}
