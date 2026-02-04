import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { url, numberOfOrders, mode, customerData, userId, fileName, customPrice, fileUrl, fileSize } = await request.json();

        console.log(`🔥 Warming pixel for: ${url}`);
        console.log(`📊 Mode: ${mode}`);
        console.log(`📊 Number of orders: ${numberOfOrders}`);
        console.log(`💰 Custom price: ${customPrice || 6000} DZD`);
        console.log(`👤 User: ${userId}`);
        if (fileName) console.log(`📄 File: ${fileName}`);

        const results = await warmPixel(url, numberOfOrders, mode, customerData, customPrice);

        // Calculate duration
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000); // in seconds

        // Save campaign to database
        try {
            const campaignData: any = {
                url,
                orderCount: results.total,
                successCount: results.successful,
                failedCount: results.failed,
                successRate: parseFloat(results.successRate || '0'),
                duration,
                mode: mode || 'random',
                fileName: fileName || undefined,
                userId: userId || undefined,
                results: JSON.stringify(results.orders || []) // Save detailed history
            };

            // If Excel mode, store file reference
            if (mode === 'excel' && fileUrl) {
                campaignData.fileUrl = fileUrl;
                campaignData.fileSize = fileSize || 0;
            }

            await prisma.campaign.create({
                data: campaignData
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
    // Fixed price: 6000 DZD for all purchases
    return "6000.00";
}

/**
 * Clean and parse price value from Excel
 * Removes currency symbols, commas, whitespace
 * Returns a valid number or uses custom default price
 */
function parsePrice(value: any, defaultPrice: number): string {
    if (!value) return defaultPrice.toFixed(2);

    // Convert to string and clean
    const cleaned = String(value)
        .trim()
        .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, commas
        .replace(/,/g, ''); // Remove commas (e.g., "2,500" -> "2500")

    const parsed = parseFloat(cleaned);

    // Validate: must be a valid number and greater than 0
    if (isNaN(parsed) || parsed <= 0) {
        console.warn(`Invalid price value: "${value}", using custom price ${defaultPrice} DZD`);
        return defaultPrice.toFixed(2);
    }

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

async function warmPixel(url: string, numberOfOrders: number, mode: string, excelData?: any[], customPrice?: number) {
    let browser;
    let successCount = 0;
    let failCount = 0;
    const orders = [];

    // Use custom price or default to 6000
    const defaultPrice = customPrice || 6000;

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
                let firstName = row.firstName || randomItem(NAMES);
                let lastName = row.lastName || randomItem(LASTNAMES);

                // Handle full name if provided
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
                    price: parsePrice(row.price || row.value || row.total || row.montant || row.amount, defaultPrice)
                };
            } else {
                customer = generateRandomCustomer(defaultPrice);
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
                const priceValue = Number(customer.price); // Convert to number

                await page.evaluate((priceNum) => {
                    // Facebook Pixel
                    if (typeof (window as any).fbq !== 'undefined') {
                        (window as any).fbq('track', 'Purchase', {
                            value: priceNum,
                            currency: 'DZD',
                            content_name: 'Product',
                            content_type: 'product'
                        });
                        console.log('✅ Facebook Pixel fired: Purchase', priceNum, 'DZD');
                    }

                    // TikTok Pixel
                    if (typeof (window as any).ttq !== 'undefined') {
                        (window as any).ttq.track('CompletePayment', {
                            value: priceNum,
                            currency: 'DZD'
                        });
                        console.log('✅ TikTok Pixel fired: CompletePayment', priceNum, 'DZD');
                    }

                    // Google Analytics
                    if (typeof (window as any).gtag !== 'undefined') {
                        (window as any).gtag('event', 'purchase', {
                            transaction_id: 'T' + Date.now(),
                            value: priceNum,
                            currency: 'DZD'
                        });
                        console.log('✅ Google Analytics fired: purchase', priceNum, 'DZD');
                    }
                }, priceValue);

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
