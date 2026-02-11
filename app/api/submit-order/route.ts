import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { simulateCheckoutOrder } from '@/lib/orderProcessor';

// Retry configuration for Puppeteer
const PUPPETEER_MAX_RETRIES = 2;
const PUPPETEER_RETRY_DELAY = 2000;

export async function POST(request: NextRequest) {
    try {
        const { url, data } = await request.json();

        console.log('Processing order for:', data.fullname, data.phone);

        // Try fast submission first (HTTP Request)
        console.log('⚡ Attempting fast submission for:', data.fullname);
        let success = await simulateCheckoutOrder(url, data);

        if (success) {
            console.log('✅ Fast submission successful');
        } else {
            console.warn('⚠️ Fast submission failed, falling back to Puppeteer...');
            // Fallback to Puppeteer with retry
            success = await submitWithPuppeteerRetry(url, data);
        }

        return NextResponse.json({ success });
    } catch (error) {
        console.error('Order submission error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

// Wrapper with retry for Puppeteer submission
async function submitWithPuppeteerRetry(url: string, data: any): Promise<boolean> {
    let lastError: any;

    for (let attempt = 1; attempt <= PUPPETEER_MAX_RETRIES; attempt++) {
        try {
            console.log(`[Puppeteer: ${data.fullname}] Attempt ${attempt}/${PUPPETEER_MAX_RETRIES}`);
            const result = await submitWithPuppeteer(url, data);

            if (result) {
                if (attempt > 1) {
                    console.log(`[Puppeteer: ${data.fullname}] ✅ Success on attempt ${attempt}`);
                }
                return true;
            }
        } catch (error) {
            lastError = error;
            console.warn(`[Puppeteer: ${data.fullname}] ⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

            if (attempt < PUPPETEER_MAX_RETRIES) {
                console.log(`[Puppeteer: ${data.fullname}] Retrying in ${PUPPETEER_RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, PUPPETEER_RETRY_DELAY));
            }
        }
    }

    console.error(`[Puppeteer: ${data.fullname}] ❌ All ${PUPPETEER_MAX_RETRIES} attempts failed`);
    return false;
}

async function submitWithPuppeteer(url: string, data: any): Promise<boolean> {
    let browser;

    try {
        console.log('🚀 Launching browser for:', data.fullname);

        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });

        const page = await browser.newPage();

        // Set realistic viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('📄 Navigating to landing page:', url);

        // Navigate to landing page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('✅ Page loaded successfully');

        // Wait for form to be visible
        await page.waitForSelector('form', { timeout: 10000 });

        // Fill form fields
        console.log('📝 Filling form fields...');

        // Try to fill date field (if exists)
        const dateSelectors = [
            'input[type="date"]',
            'input[name*="date"]',
            'input[name*="Date"]',
            'input[placeholder*="تاريخ"]',
            'input[placeholder*="Date"]',
            'input[id*="date"]'
        ];

        for (const selector of dateSelectors) {
            const dateField = await page.$(selector);
            if (dateField) {
                const dateValue = data.date || new Date().toISOString().split('T')[0];
                await dateField.type(dateValue);
                console.log('  ✓ Date:', dateValue);
                break;
            }
        }

        // Fill name fields - expanded selectors
        const nameSelectors = [
            'input[name="first_name"]',
            'input[name="firstName"]',
            'input[name="name"]',
            'input[name="prenom"]',
            'input[placeholder*="اسم"]',
            'input[placeholder*="الاسم"]',
            'input[placeholder*="First"]',
            'input[placeholder*="Name"]',
            'input[id*="first"]',
            'input[id*="name"]'
        ];

        let nameFieldFound = false;
        for (const selector of nameSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.click({ clickCount: 3 }); // Select all
                await field.type(data.name || data.fullname?.split(' ')[0] || 'Customer');
                console.log('  ✓ Name:', data.name || data.fullname?.split(' ')[0]);
                nameFieldFound = true;
                break;
            }
        }

        if (!nameFieldFound) {
            console.warn('  ⚠️ Name field not found');
        }

        // Fill last name (if separate field exists) - expanded selectors
        const lastNameSelectors = [
            'input[name="last_name"]',
            'input[name="lastName"]',
            'input[name="nom"]',
            'input[placeholder*="Last"]',
            'input[placeholder*="العائلة"]',
            'input[id*="last"]'
        ];

        for (const selector of lastNameSelectors) {
            const lastNameField = await page.$(selector);
            if (lastNameField) {
                await lastNameField.type(data.fullname || data.name || 'Order');
                console.log('  ✓ Last Name:', data.fullname);
                break;
            }
        }

        // Fill phone - expanded selectors
        const phoneSelectors = [
            'input[name="phone"]',
            'input[name="telephone"]',
            'input[name="tel"]',
            'input[type="tel"]',
            'input[placeholder*="هاتف"]',
            'input[placeholder*="رقم"]',
            'input[placeholder*="Phone"]',
            'input[placeholder*="Tel"]',
            'input[id*="phone"]',
            'input[id*="tel"]'
        ];

        let phoneFieldFound = false;
        for (const selector of phoneSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.click({ clickCount: 3 });
                await field.type(data.phone || '');
                console.log('  ✓ Phone:', data.phone);
                phoneFieldFound = true;
                break;
            }
        }

        if (!phoneFieldFound) {
            console.warn('  ⚠️ Phone field not found - this may cause submission to fail');
        }

        // Fill city/region - expanded selectors
        const citySelectors = [
            'select[name="region"]',
            'select[name="city"]',
            'select[name="wilaya"]',
            'select[name="ville"]',
            'input[name="region"]',
            'input[name="city"]',
            'input[name="wilaya"]',
            'input[placeholder*="ولاية"]',
            'input[placeholder*="المدينة"]',
            'input[placeholder*="City"]',
            'select[id*="region"]',
            'select[id*="city"]'
        ];

        for (const selector of citySelectors) {
            const field = await page.$(selector);
            if (field) {
                const tagName = await field.evaluate(el => el.tagName.toLowerCase());
                if (tagName === 'select') {
                    await field.select(data.city || 'أدرار');
                } else {
                    await field.click({ clickCount: 3 });
                    await field.type(data.city || 'أدرار');
                }
                console.log('  ✓ City:', data.city);
                break;
            }
        }

        // Fill commune (if exists) - expanded selectors
        const communeSelectors = [
            'select[name="commune"]',
            'select[name="city"]',
            'input[name="commune"]',
            'input[name="address"]',
            'select[id*="commune"]'
        ];

        for (const selector of communeSelectors) {
            const communeField = await page.$(selector);
            if (communeField) {
                const tagName = await communeField.evaluate(el => el.tagName.toLowerCase());
                if (tagName === 'select') {
                    await communeField.select(data.commune || data.city || 'أدرار');
                } else {
                    await communeField.type(data.commune || data.city || 'أدرار');
                }
                console.log('  ✓ Commune:', data.commune);
                break;
            }
        }

        // Fill quantity (if exists)
        const qtySelectors = [
            'input[name="quantity"]',
            'input[name="qty"]',
            'input[type="number"]',
            'select[name="quantity"]'
        ];

        for (const selector of qtySelectors) {
            const qtyField = await page.$(selector);
            if (qtyField) {
                const tagName = await qtyField.evaluate(el => el.tagName.toLowerCase());
                if (tagName === 'select') {
                    await qtyField.select(String(data.qty || 1));
                } else {
                    await qtyField.click({ clickCount: 3 });
                    await qtyField.type(String(data.qty || 1));
                }
                console.log('  ✓ Quantity:', data.qty || 1);
                break;
            }
        }

        console.log('📤 Submitting form...');

        // Find and click submit button - expanded selectors
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("طلب")',
            'button:has-text("تأكيد")',
            'button:has-text("Order")',
            'button:has-text("Submit")',
            'button:has-text("Confirm")',
            'button.submit',
            'button.order',
            'input.submit'
        ];

        let submitClicked = false;
        for (const selector of submitSelectors) {
            try {
                const submitBtn = await page.$(selector);
                if (submitBtn) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
                        submitBtn.click()
                    ]);
                    submitClicked = true;
                    break;
                }
            } catch (error) {
                // Try next selector
                continue;
            }
        }

        if (!submitClicked) {
            console.error('❌ Could not find or click submit button');
            // Take screenshot for debugging
            await page.screenshot({ path: `/tmp/submit-failed-${Date.now()}.png` });
            throw new Error('Submit button not found');
        }

        const finalUrl = page.url().toLowerCase();
        console.log('🔗 Final URL:', finalUrl);

        // Check for success indicators - expanded
        const urlSuccess = finalUrl.includes('thank') ||
            finalUrl.includes('success') ||
            finalUrl.includes('merci') ||
            finalUrl.includes('شكرا') ||
            finalUrl.includes('confirmation') ||
            finalUrl.includes('complete');

        let contentSuccess = false;
        if (!urlSuccess) {
            // Check page content for success message
            const pageContent = await page.content();
            contentSuccess = pageContent.includes('شكرا') ||
                pageContent.toLowerCase().includes('thank') ||
                pageContent.toLowerCase().includes('success') ||
                pageContent.toLowerCase().includes('merci') ||
                pageContent.toLowerCase().includes('confirmation') ||
                pageContent.toLowerCase().includes('order placed') ||
                pageContent.toLowerCase().includes('order received');
        }

        const isSuccess = urlSuccess || contentSuccess;

        if (isSuccess) {
            console.log('✅ SUCCESS for:', data.fullname);
            console.log('   Detection:', urlSuccess ? 'URL' : 'Content');
        } else {
            console.log('❌ FAILED for:', data.fullname);
            console.log('   Final URL:', page.url());
            // Take screenshot for debugging
            await page.screenshot({ path: `/tmp/order-failed-${Date.now()}.png` });
        }

        return isSuccess;

    } catch (error) {
        console.error('❌ Error submitting order for', data.fullname, ':', error);
        console.error('   Error details:', error instanceof Error ? error.stack : error);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
