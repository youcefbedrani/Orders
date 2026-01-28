#!/usr/bin/env node

/**
 * Store & Pixel Warmer
 * Generates fake traffic to warm up your store and fire pixel events
 */

const puppeteer = require('puppeteer');

// Configuration
const STORE_URLS = [
    'https://w4tc42-9i.myshopify.com/products/usb-%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%B4%D8%A9-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84',
    // Add more product URLs here
];

const NUMBER_OF_VISITS = 10; // How many times to visit
const DELAY_BETWEEN_VISITS = 3000; // 3 seconds between visits

async function warmPixel() {
    console.log('🔥 Store & Pixel Warmer Started\n');
    console.log(`📊 Configuration:`);
    console.log(`   - URLs to visit: ${STORE_URLS.length}`);
    console.log(`   - Visits per URL: ${NUMBER_OF_VISITS}`);
    console.log(`   - Total visits: ${STORE_URLS.length * NUMBER_OF_VISITS}`);
    console.log(`   - Delay: ${DELAY_BETWEEN_VISITS}ms\n`);
    console.log('='.repeat(80));

    let browser;
    let totalVisits = 0;
    let totalPixelEvents = 0;

    try {
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (let i = 0; i < NUMBER_OF_VISITS; i++) {
            console.log(`\n📍 Round ${i + 1}/${NUMBER_OF_VISITS}`);

            for (const url of STORE_URLS) {
                const page = await browser.newPage();

                // Set realistic user agent
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                await page.setViewport({
                    width: 1920,
                    height: 1080
                });

                try {
                    console.log(`   🌐 Visiting: ${url.substring(0, 60)}...`);

                    // Navigate to page
                    await page.goto(url, {
                        waitUntil: 'networkidle2',
                        timeout: 30000
                    });

                    totalVisits++;

                    // Wait for page to fully load
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Scroll down the page (simulates real user behavior)
                    await page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight / 2);
                    });

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Check for pixel events
                    const pixelFired = await page.evaluate(() => {
                        return typeof fbq !== 'undefined' ||
                            typeof ttq !== 'undefined' ||
                            typeof gtag !== 'undefined';
                    });

                    if (pixelFired) {
                        console.log(`      ✅ Pixel event fired!`);
                        totalPixelEvents++;
                    } else {
                        console.log(`      ℹ️  Page loaded (no pixel detected)`);
                    }

                    // Try to click "Add to Cart" to fire AddToCart event
                    try {
                        const addToCartButton = await page.$('button[name="add"], form[action*="cart/add"] button[type="submit"]');
                        if (addToCartButton) {
                            await addToCartButton.click();
                            console.log(`      🛒 Clicked "Add to Cart" - AddToCart event fired!`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            totalPixelEvents++;
                        }
                    } catch (e) {
                        // Ignore if button not found
                    }

                } catch (error) {
                    console.log(`      ❌ Error: ${error.message}`);
                } finally {
                    await page.close();
                }

                // Delay between visits
                if (totalVisits < STORE_URLS.length * NUMBER_OF_VISITS) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VISITS));
                }
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Pixel Warming Complete!\n');
        console.log('📊 Results:');
        console.log(`   Total page visits: ${totalVisits}`);
        console.log(`   Pixel events fired: ${totalPixelEvents}`);
        console.log(`   Success rate: ${((totalPixelEvents / totalVisits) * 100).toFixed(1)}%`);
        console.log('\n💡 Your store and pixel should now be warmed up!');
        console.log('   Check your Facebook/TikTok Events Manager to verify.\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the warmer
warmPixel();
