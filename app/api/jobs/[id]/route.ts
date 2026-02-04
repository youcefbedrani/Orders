import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jobQueue } from '@/lib/jobQueue';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const jobId = params.id;

        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Calculate elapsed time if job is running
        let elapsedSeconds = 0;
        if (job.status === 'RUNNING' && job.startedAt) {
            elapsedSeconds = Math.floor((Date.now() - job.startedAt.getTime()) / 1000);
        } else if (job.duration) {
            elapsedSeconds = job.duration;
        }

        // Get queue position if pending
        const queuePosition = job.status === 'PENDING'
            ? jobQueue.getJobPosition(jobId)
            : -1;

        return NextResponse.json({
            ...job,
            results: job.results ? JSON.parse(job.results) : null,
            customerData: null, // Don't send customer data
            elapsedSeconds,
            queuePosition: queuePosition > 0 ? queuePosition : undefined
        });

    } catch (error) {
        console.error('Get job status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job status' },
            { status: 500 }
        );
    }
}

// Cancel a job
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const jobId = params.id;

        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Can only cancel pending jobs
        if (job.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Can only cancel pending jobs' },
                { status: 400 }
            );
        }

        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({
            success: true,
            message: 'Job cancelled'
        });

    } catch (error) {
        console.error('Cancel job error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel job' },
            { status: 500 }
        );
    }
}
