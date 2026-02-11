// Background worker for processing pixel warming jobs
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

interface JobData {
    id: string;
    userId: string;
    url: string;
    mode: string;
    orderCount: number;
    customPrice?: number;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    customerData?: any[];
}

// Random data generators
const NAMES = ['Ahmed', 'Mohamed', 'Fatima', 'Amina', 'Youssef', 'Sara', 'Ali', 'Leila', 'Omar', 'Nadia'];
const LASTNAMES = ['Benali', 'Mansouri', 'Khalil', 'Saidi', 'Amari', 'Bouazza', 'Hamdi', 'Rami'];
const CITIES = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen'];

function randomItem(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
    return `0${Math.floor(500000000 + Math.random() * 299999999)}`;
}

function parsePrice(value: any, defaultPrice: number): string {
    if (!value) return defaultPrice.toFixed(2);
    const cleaned = String(value).trim().replace(/[^\\d.,]/g, '');
    if (!cleaned) return defaultPrice.toFixed(2);
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed <= 0) return defaultPrice.toFixed(2);
    return parsed.toFixed(2);
}

function generateRandomCustomer(defaultPrice: number) {
    return {
        firstName: randomItem(NAMES),
        lastName: randomItem(LASTNAMES),
        phone: randomPhone(),
        city: randomItem(CITIES),
        price: defaultPrice.toFixed(2)
    };
}

export async function processJob(job: JobData) {
    console.log(`🚀 Starting job ${job.id}`);
    console.log(`   Mode: ${job.mode}, Orders: ${job.orderCount}`);
    console.log(`   CustomerData type: ${typeof job.customerData}, isArray: ${Array.isArray(job.customerData)}`);
    if (Array.isArray(job.customerData)) {
        console.log(`   CustomerData length: ${job.customerData.length}`);
    }

    // Update job status to RUNNING
    await prisma.job.update({
        where: { id: job.id },
        data: {
            status: 'RUNNING',
            startedAt: new Date()
        }
    });

    let browser;
    let successCount = 0;
    let failCount = 0;
    const orderDetails: any[] = [];
    const startTime = Date.now();
    const defaultPrice = job.customPrice || 6000;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        // Parallel processing configuration
        const CONCURRENT_LIMIT = 10;

        // Process orders in parallel batches with retry
        const processOrder = async (i: number) => {
            const MAX_ORDER_RETRIES = 2;
            let lastError: any;

            // Retry logic for individual order
            for (let attempt = 1; attempt <= MAX_ORDER_RETRIES; attempt++) {
                try {
                    const result = await processOrderAttempt(i, attempt, MAX_ORDER_RETRIES);
                    if (result.status === 'SUCCESS' || attempt === MAX_ORDER_RETRIES) {
                        return result;
                    }
                } catch (error) {
                    lastError = error;
                    if (attempt < MAX_ORDER_RETRIES) {
                        console.log(`[Job ${job.id}] Retrying order ${i + 1} in 2s...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            // Return failed result after all retries
            const customer = job.mode === 'excel' && job.customerData && job.customerData[i]
                ? job.customerData[i]
                : generateRandomCustomer(defaultPrice);
            const fullName = `${customer.firstName || 'Unknown'} ${customer.lastName || 'Customer'}`;

            return {
                name: fullName,
                phone: customer.phone || 'N/A',
                city: customer.city || 'N/A',
                price: customer.price || defaultPrice.toFixed(2),
                status: 'FAILED',
                error: lastError instanceof Error ? lastError.message : 'All retry attempts failed',
                timestamp: new Date().toISOString()
            };
        };

        // Actual order processing logic
        const processOrderAttempt = async (i: number, attempt: number, maxAttempts: number) => {
            const page = await browser!.newPage();

            // Get customer data
            let customer;
            if (job.mode === 'excel' && job.customerData && job.customerData[i]) {
                const row = job.customerData[i];
                let firstName = row.firstName || randomItem(NAMES);
                let lastName = row.lastName || randomItem(LASTNAMES);

                if (row.name) {
                    const nameParts = row.name.toString().trim().split(' ');
                    if (nameParts.length > 0) {
                        firstName = nameParts[0];
                        if (nameParts.length > 1) {
                            lastName = nameParts.slice(1).join(' ');
                        }
                    }
                }

                customer = {
                    firstName,
                    lastName,
                    phone: row.phone || row.telephone || randomPhone(),
                    city: row.city || row.ville || randomItem(CITIES),
                    price: parsePrice(row.price || row.value || row.total, defaultPrice)
                };
            } else {
                customer = generateRandomCustomer(defaultPrice);
            }

            const fullName = `${customer.firstName} ${customer.lastName}`;
            console.log(`[Job ${job.id}] [${i + 1}/${job.orderCount}] Processing: ${fullName}`);

            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                await page.setViewport({ width: 1920, height: 1080 });

                // Faster page load
                await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Reduced wait time
                await new Promise(resolve => setTimeout(resolve, 500));

                // Inject purchase event
                const pixelResult = await page.evaluate((customerData: any) => {
                    const pixelsFired: string[] = [];
                    const win = window as any;

                    // Helper to safely track
                    const safeTrack = () => {
                        try {
                            if (typeof win.fbq === 'function') {
                                win.fbq('track', 'Purchase', {
                                    value: parseFloat(customerData.price),
                                    currency: 'DZD',
                                    content_name: `${customerData.firstName} ${customerData.lastName}`,
                                    content_category: 'Order'
                                });
                                pixelsFired.push('Facebook');
                            }
                            if (typeof win.ttq === 'function') {
                                win.ttq.track('CompletePayment', {
                                    value: parseFloat(customerData.price),
                                    currency: 'DZD',
                                    content_name: `${customerData.firstName} ${customerData.lastName}`
                                });
                                pixelsFired.push('TikTok');
                            }
                            if (typeof win.gtag === 'function') {
                                win.gtag('event', 'purchase', {
                                    value: parseFloat(customerData.price),
                                    currency: 'DZD',
                                    items: [{
                                        item_name: `${customerData.firstName} ${customerData.lastName}`,
                                        price: parseFloat(customerData.price)
                                    }]
                                });
                                pixelsFired.push('Google');
                            }
                        } catch (err) {
                            console.error('Pixel tracking error in browser context:', err);
                        }
                    };

                    // Try immediately
                    safeTrack();

                    return pixelsFired;
                }, customer);

                console.log(`✅ [Job ${job.id}] Success: ${fullName}`);

                return {
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    price: customer.price,
                    status: 'SUCCESS',
                    pixels: pixelResult,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                console.error(`❌ [Job ${job.id}] Failed: ${fullName} (Attempt ${attempt}/${maxAttempts})`);
                console.error(`   Error:`, error instanceof Error ? error.message : error);
                console.error(`   Stack:`, error instanceof Error ? error.stack : 'N/A');

                return {
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    price: customer.price,
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    attempt: attempt,
                    timestamp: new Date().toISOString()
                };
            } finally {
                await page.close();
            }
        };

        // Process in parallel batches
        for (let i = 0; i < job.orderCount; i += CONCURRENT_LIMIT) {
            const batchSize = Math.min(CONCURRENT_LIMIT, job.orderCount - i);
            const batchPromises = [];

            for (let j = 0; j < batchSize; j++) {
                batchPromises.push(processOrder(i + j));
            }

            // Wait for current batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Collect results
            for (const result of batchResults) {
                orderDetails.push(result);
                if (result.status === 'SUCCESS') {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Update progress in database after each batch
            const processedCount = i + batchSize;
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    processedCount,
                    successCount,
                    failedCount: failCount
                }
            });

            console.log(`📊 [Job ${job.id}] Batch complete: ${processedCount}/${job.orderCount} (Success: ${successCount}, Failed: ${failCount})`);

            // Small delay between batches to avoid overwhelming the server
            if (processedCount < job.orderCount) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Job completed successfully
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);
        const resultsJson = JSON.stringify({
            total: job.orderCount,
            successful: successCount,
            failed: failCount,
            successRate: ((successCount / job.orderCount) * 100).toFixed(2) + '%',
            orders: orderDetails
        });

        // 1. Update Job status
        await prisma.job.update({
            where: { id: job.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                duration,
                results: resultsJson
            }
        });

        // 2. Create permanent Campaign record for History
        await prisma.campaign.create({
            data: {
                url: job.url,
                orderCount: job.orderCount,
                successCount: successCount,
                failedCount: failCount,
                successRate: parseFloat(((successCount / job.orderCount) * 100).toFixed(2)),
                duration,
                mode: job.mode,
                fileName: job.fileName,
                fileUrl: job.fileUrl,
                fileSize: job.fileSize,
                results: resultsJson,
                userId: job.userId
            }
        });

        console.log(`✅ Job ${job.id} completed: ${successCount}/${job.orderCount} successful`);

    } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        await prisma.job.update({
            where: { id: job.id },
            data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date(),
                results: JSON.stringify({
                    total: job.orderCount,
                    successful: successCount,
                    failed: failCount,
                    orders: orderDetails
                })
            }
        });

        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
