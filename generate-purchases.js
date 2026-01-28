#!/usr/bin/env node

/**
 * Fake Purchase Event Generator
 * Fires Purchase pixel events to warm up your pixel
 */

const puppeteer = require('puppeteer');

// Configuration
const PRODUCT_URL = 'https://w4tc42-9i.myshopify.com/products/usb-%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%B4%D8%A9-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84';
const NUMBER_OF_PURCHASES = 10;

// Random customer data
const FIRST_NAMES = ['Ahmed', 'Mohamed', 'Fatima', 'Amina', 'Youssef', 'Sara', 'Ali', 'Leila', 'Omar', 'Nadia'];
const LAST_NAMES = ['Benali', 'Mansouri', 'Khalil', 'Saidi', 'Amari', 'Bouazza', 'Hamdi', 'Rami', 'Slimani', 'Toumi'];
const CITIES = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen', 'Béjaïa', 'Biskra'];

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomPhone() {
    const prefixes = ['0555', '0666', '0777', '0550', '0660', '0770'];
    const number = Math.floor(100000 + Math.random() * 900000);
    return `${randomItem(prefixes)}${number}`;
}

function randomPrice() {
    return (Math.random() * 5000 + 1000).toFixed(2); // Between 1000-6000 DZD
}

async function generatePurchaseEvents() {
    console.log('🛒 Fake Purchase Event Generator\n');
    console.log(`📊 Configuration:`);
    console.log(`   - Product URL: ${PRODUCT_URL}`);
    console.log(`   - Number of purchases: ${NUMBER_OF_PURCHASES}\n`);
    console.log('='.repeat(80));

    let browser;
    let successCount = 0;

    try {
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (let i = 0; i < NUMBER_OF_PURCHASES; i++) {
            const page = await browser.newPage();

            // Random customer data
            const customer = {
                firstName: randomItem(FIRST_NAMES),
                lastName: randomItem(LAST_NAMES),
                phone: randomPhone(),
                city: randomItem(CITIES),
                price: randomPrice()
            };

            console.log(`\n[${i + 1}/${NUMBER_OF_PURCHASES}] 🛍️  Generating purchase for: ${customer.firstName} ${customer.lastName}`);
            console.log(`   📞 Phone: ${customer.phone}`);
            console.log(`   📍 City: ${customer.city}`);
            console.log(`   💰 Value: ${customer.price} DZD`);

            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                await page.setViewport({ width: 1920, height: 1080 });

                // Visit product page
                await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Fire custom Purchase event via JavaScript
                await page.evaluate((customerData) => {
                    // Fire Facebook Pixel Purchase event
                    if (typeof fbq !== 'undefined') {
                        fbq('track', 'Purchase', {
                            value: parseFloat(customerData.price),
                            currency: 'DZD',
                            content_name: 'USB Educational Flash',
                            content_type: 'product',
                            contents: [{ id: 'usb-flash', quantity: 1 }]
                        });
                        console.log('✅ Facebook Pixel Purchase event fired');
                    }

                    // Fire TikTok Pixel Purchase event
                    if (typeof ttq !== 'undefined') {
                        ttq.track('CompletePayment', {
                            value: parseFloat(customerData.price),
                            currency: 'DZD',
                            content_name: 'USB Educational Flash',
                            content_type: 'product'
                        });
                        console.log('✅ TikTok Pixel Purchase event fired');
                    }

                    // Fire Google Analytics Purchase event
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'purchase', {
                            transaction_id: 'T' + Date.now(),
                            value: parseFloat(customerData.price),
                            currency: 'DZD',
                            items: [{
                                item_id: 'usb-flash',
                                item_name: 'USB Educational Flash',
                                price: parseFloat(customerData.price),
                                quantity: 1
                            }]
                        });
                        console.log('✅ Google Analytics Purchase event fired');
                    }
                }, customer);

                console.log(`   ✅ Purchase event fired successfully!`);
                successCount++;

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            } finally {
                await page.close();
            }

            // Delay between purchases (3-5 seconds)
            if (i < NUMBER_OF_PURCHASES - 1) {
                const delay = 3000 + Math.random() * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Purchase Event Generation Complete!\n');
        console.log('📊 Results:');
        console.log(`   Total purchases: ${NUMBER_OF_PURCHASES}`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Failed: ${NUMBER_OF_PURCHASES - successCount}`);
        console.log(`   Success rate: ${((successCount / NUMBER_OF_PURCHASES) * 100).toFixed(1)}%`);
        console.log('\n💡 Check your Events Manager:');
        console.log('   - Facebook Events Manager: https://business.facebook.com/events_manager');
        console.log('   - TikTok Events Manager: https://ads.tiktok.com/i18n/events_manager');
        console.log('\n🔥 Your pixel should now show purchase events!\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the generator
generatePurchaseEvents();
