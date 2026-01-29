import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { url, numberOfOrders, mode, customerData } = await request.json();

        console.log(`🔥 Warming pixel for: ${url}`);
        console.log(`📊 Mode: ${mode}`);
        console.log(`📊 Number of orders: ${numberOfOrders}`);

        const results = await warmPixel(url, numberOfOrders, mode, customerData);

        // Calculate duration
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000); // in seconds

        // Save campaign to database
        try {
            await prisma.campaign.create({
                data: {
                    url,
                    orderCount: results.total,
                    successCount: results.successful,
                    failedCount: results.failed,
                    successRate: parseFloat(results.successRate),
                    duration,
                    mode: mode || 'random'
                }
            });
        } catch (dbError) {
            console.error('Error saving campaign:', dbError);
            // Don't fail the request if saving fails
        }

        return NextResponse.json({
            ...results,
            duration,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString()
        });
    } catch (error) {
        console.error('Pixel warming error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
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

function randomPrice() {
    return (Math.random() * 5000 + 1000).toFixed(2);
}

function generateRandomCustomer() {
    return {
        firstName: randomItem(NAMES),
        lastName: randomItem(LASTNAMES),
        phone: randomPhone(),
        city: randomItem(CITIES),
        price: randomPrice()
    };
}

async function warmPixel(url: string, numberOfOrders: number, mode: string, excelData?: any[]) {
    let browser;
    let successCount = 0;
    let failCount = 0;
    const orders = [];

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
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--safebrowsing-disable-auto-update',
                '--disable-blink-features=AutomationControlled'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        for (let i = 0; i < numberOfOrders; i++) {
            const page = await browser.newPage();

            // Get customer data based on mode
            let customer;
            if (mode === 'excel' && excelData && excelData[i]) {
                const row = excelData[i];
                customer = {
                    firstName: row.name || row.firstName || randomItem(NAMES),
                    lastName: row.lastname || row.lastName || randomItem(LASTNAMES),
                    phone: row.phone || row.telephone || randomPhone(),
                    city: row.city || row.ville || randomItem(CITIES),
                    price: row.price || row.value || randomPrice()
                };
            } else {
                customer = generateRandomCustomer();
            }

            const fullName = `${customer.firstName} ${customer.lastName}`;

            console.log(`[${i + 1}/${numberOfOrders}] Generating purchase for: ${fullName}`);

            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                await page.setViewport({ width: 1920, height: 1080 });

                // Visit page
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Fire purchase events
                await page.evaluate((customerData) => {
                    // Facebook Pixel
                    if (typeof (window as any).fbq !== 'undefined') {
                        (window as any).fbq('track', 'Purchase', {
                            value: parseFloat(customerData.price),
                            currency: 'DZD',
                            content_name: 'Product',
                            content_type: 'product'
                        });
                    }

                    // TikTok Pixel
                    if (typeof (window as any).ttq !== 'undefined') {
                        (window as any).ttq.track('CompletePayment', {
                            value: parseFloat(customerData.price),
                            currency: 'DZD'
                        });
                    }

                    // Google Analytics
                    if (typeof (window as any).gtag !== 'undefined') {
                        (window as any).gtag('event', 'purchase', {
                            transaction_id: 'T' + Date.now(),
                            value: parseFloat(customerData.price),
                            currency: 'DZD'
                        });
                    }
                }, customer);

                console.log(`  ✅ Success: ${fullName} - ${customer.price} DZD`);
                successCount++;

                orders.push({
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    value: customer.price,
                    status: 'success'
                });

            } catch (error) {
                console.log(`  ❌ Failed: ${fullName}`);
                failCount++;

                orders.push({
                    name: fullName,
                    phone: customer.phone,
                    city: customer.city,
                    value: customer.price,
                    status: 'failed'
                });
            } finally {
                await page.close();
            }

            // Delay between orders
            if (i < numberOfOrders - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return {
            success: true,
            total: numberOfOrders,
            successful: successCount,
            failed: failCount,
            successRate: ((successCount / numberOfOrders) * 100).toFixed(1),
            orders
        };

    } catch (error) {
        console.error('Error in warmPixel:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            total: numberOfOrders,
            successful: successCount,
            failed: failCount,
            orders
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
