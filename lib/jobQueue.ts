// In-memory job queue for processing pixel warming jobs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QueuedJob {
    id: string;
    userId: string;
    url: string;
    mode: string;
    orderCount: number;
    customPrice?: number;
    fileName?: string;
    fileUrl?: string;
    customerData?: any[];
}

class JobQueue {
    private queue: QueuedJob[] = [];
    private processing: boolean = false;
    private currentJobId: string | null = null;

    // Add job to queue
    async addJob(job: QueuedJob) {
        this.queue.push(job);
        console.log(`📥 Job ${job.id} added to queue. Queue length: ${this.queue.length}`);

        // Start processing if not already processing
        if (!this.processing) {
            this.processNext();
        }
    }

    // Process next job in queue
    private async processNext() {
        if (this.queue.length === 0) {
            this.processing = false;
            console.log('✅ Queue empty, waiting for jobs...');
            return;
        }

        this.processing = true;
        const job = this.queue.shift()!;
        this.currentJobId = job.id;

        console.log(`🔄 Processing job ${job.id}...`);

        try {
            // Import background worker
            const { processJob } = await import('./backgroundWorker');

            // Process the job
            await processJob(job);

            console.log(`✅ Job ${job.id} completed successfully`);
        } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error);

            // Mark job as failed
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date()
                }
            });
        } finally {
            this.currentJobId = null;
            // Process next job
            setTimeout(() => this.processNext(), 1000);
        }
    }

    // Get queue status
    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            currentJobId: this.currentJobId
        };
    }

    // Get position of job in queue
    getJobPosition(jobId: string): number {
        const index = this.queue.findIndex(j => j.id === jobId);
        return index === -1 ? -1 : index + 1;
    }
}

// Singleton instance
export const jobQueue = new JobQueue();
