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

        for (let i = 0; i < job.orderCount; i++) {
            const page = await browser.newPage();

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
                await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Inject purchase event
                const pixelResult = await page.evaluate((customerData) => {
                    const pixelsFired = [];
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

                successCount++;
                orderDetails.push({
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    price: customer.price,
                    status: 'SUCCESS',
                    pixels: pixelResult,
                    timestamp: new Date().toISOString()
                });
                console.log(`✅ [Job ${job.id}] Success: ${fullName}`);
            } catch (error) {
                failCount++;
                orderDetails.push({
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    price: customer.price,
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ [Job ${job.id}] Failed: ${fullName}`, error);
            } finally {
                await page.close();
            }

            // Update progress in database
            const processedCount = i + 1;
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    processedCount,
                    successCount,
                    failedCount: failCount
                }
            });

            // Small delay between orders
            await new Promise(resolve => setTimeout(resolve, 1000));
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
