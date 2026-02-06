import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { simulateCheckoutOrder } from '@/lib/orderProcessor';

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
            // Fallback to Puppeteer
            success = await submitWithPuppeteer(url, data);
        }

        return NextResponse.json({ success });
    } catch (error) {
        console.error('Order submission error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
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
        const dateField = await page.$('input[type="date"], input[name*="date"], input[placeholder*="تاريخ"]');
        if (dateField) {
            const dateValue = data.date || new Date().toISOString().split('T')[0];
            await dateField.type(dateValue);
            console.log('  ✓ Date:', dateValue);
        }

        // Fill name fields
        const nameSelectors = [
            'input[name="first_name"]',
            'input[name="name"]',
            'input[placeholder*="اسم"]',
            'input[placeholder*="الاسم"]'
        ];

        for (const selector of nameSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.click({ clickCount: 3 }); // Select all
                await field.type(data.name || data.fullname?.split(' ')[0] || 'Customer');
                console.log('  ✓ Name:', data.name || data.fullname?.split(' ')[0]);
                break;
            }
        }

        // Fill last name (if separate field exists)
        const lastNameField = await page.$('input[name="last_name"]');
        if (lastNameField) {
            await lastNameField.type(data.fullname || data.name || 'Order');
            console.log('  ✓ Last Name:', data.fullname);
        }

        // Fill phone
        const phoneSelectors = [
            'input[name="phone"]',
            'input[name="telephone"]',
            'input[type="tel"]',
            'input[placeholder*="هاتف"]',
            'input[placeholder*="رقم"]'
        ];

        for (const selector of phoneSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.click({ clickCount: 3 });
                await field.type(data.phone || '');
                console.log('  ✓ Phone:', data.phone);
                break;
            }
        }

        // Fill city/region
        const citySelectors = [
            'input[name="region"]',
            'input[name="city"]',
            'input[name="wilaya"]',
            'select[name="region"]',
            'select[name="city"]',
            'select[name="wilaya"]',
            'input[placeholder*="ولاية"]',
            'input[placeholder*="المدينة"]'
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

        // Fill commune (if exists)
        const communeField = await page.$('input[name="commune"], select[name="commune"]');
        if (communeField) {
            const tagName = await communeField.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
                await communeField.select(data.commune || data.city || 'أدرار');
            } else {
                await communeField.type(data.commune || data.city || 'أدرار');
            }
            console.log('  ✓ Commune:', data.commune);
        }

        // Fill quantity (if exists)
        const qtyField = await page.$('input[name="quantity"], input[name="qty"]');
        if (qtyField) {
            await qtyField.click({ clickCount: 3 });
            await qtyField.type(String(data.qty || 1));
            console.log('  ✓ Quantity:', data.qty || 1);
        }

        console.log('📤 Submitting form...');

        // Submit form and wait for navigation
        const [response] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
            page.click('button[type="submit"], input[type="submit"], button:has-text("طلب"), button:has-text("تأكيد")')
        ]);

        const finalUrl = page.url().toLowerCase();
        console.log('🔗 Final URL:', finalUrl);

        // Check for success indicators
        const isSuccess = finalUrl.includes('thank') ||
            finalUrl.includes('success') ||
            finalUrl.includes('merci') ||
            finalUrl.includes('شكرا') ||
            finalUrl.includes('confirmation');

        if (!isSuccess) {
            // Check page content for success message
            const pageContent = await page.content();
            const contentSuccess = pageContent.includes('شكرا') ||
                pageContent.includes('thank') ||
                pageContent.includes('success') ||
                pageContent.toLowerCase().includes('merci');

            if (contentSuccess) {
                console.log('✅ SUCCESS (from content) for:', data.fullname);
                return true;
            }
        }

        if (isSuccess) {
            console.log('✅ SUCCESS for:', data.fullname);
        } else {
            console.log('❌ FAILED for:', data.fullname);
        }

        return isSuccess;

    } catch (error) {
        console.error('❌ Error submitting order for', data.fullname, ':', error);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
