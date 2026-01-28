#!/usr/bin/env node

/**
 * SIMPLE ORDER CREATOR
 * Just provide a landing page URL and number of orders
 * No setup, no payment gateways, no complexity
 */

const puppeteer = require('puppeteer');

// ============================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================

const LANDING_PAGE_URL = 'https://w4tc42-9i.myshopify.com/products/usb-%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%B4%D8%A9-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84';
const NUMBER_OF_ORDERS = 10;

// ============================================

// Random data
const NAMES = ['Ahmed', 'Mohamed', 'Fatima', 'Amina', 'Youssef', 'Sara', 'Ali', 'Leila', 'Omar', 'Nadia'];
const LASTNAMES = ['Benali', 'Mansouri', 'Khalil', 'Saidi', 'Amari', 'Bouazza', 'Hamdi', 'Rami'];
const CITIES = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen'];

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPhone() { return `0${Math.floor(500000000 + Math.random() * 299999999)}`; }

async function createOrders() {
    console.log('🚀 Simple Order Creator\n');
    console.log(`📍 Landing Page: ${LANDING_PAGE_URL}`);
    console.log(`📦 Orders to create: ${NUMBER_OF_ORDERS}\n`);
    console.log('='.repeat(80));

    if (LANDING_PAGE_URL === 'YOUR_LANDING_PAGE_URL_HERE') {
        console.log('\n❌ ERROR: Please edit this file and set LANDING_PAGE_URL');
        console.log('\nExample:');
        console.log('const LANDING_PAGE_URL = "https://your-store.youcan.shop/p/product-name";');
        return;
    }

    let browser;
    let success = 0;

    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (let i = 0; i < NUMBER_OF_ORDERS; i++) {
            const page = await browser.newPage();
            const customer = {
                name: random(NAMES),
                fullname: `${random(NAMES)} ${random(LASTNAMES)}`,
                phone: randomPhone(),
                city: random(CITIES)
            };

            console.log(`\n[${i + 1}/${NUMBER_OF_ORDERS}] ${customer.fullname} - ${customer.phone} - ${customer.city}`);

            try {
                await page.goto(LANDING_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Find and fill ALL input fields
                const inputs = await page.$$('input[type="text"], input[type="tel"], input[type="date"], input:not([type="hidden"]):not([type="submit"])');

                for (const input of inputs) {
                    const name = await input.evaluate(el => el.name || el.id || '');
                    const type = await input.evaluate(el => el.type);

                    try {
                        if (type === 'date') {
                            await input.type('2023-01-23');
                        } else if (name.includes('phone') || name.includes('tel') || type === 'tel') {
                            await input.type(customer.phone);
                        } else if (name.includes('name') || name.includes('nom')) {
                            await input.type(customer.fullname);
                        } else if (name.includes('city') || name.includes('ville') || name.includes('wilaya')) {
                            await input.type(customer.city);
                        } else {
                            await input.type(customer.name);
                        }
                    } catch (e) { }
                }

                // Find and click submit button
                const buttons = await page.$$('button[type="submit"], input[type="submit"], button');
                if (buttons.length > 0) {
                    await buttons[0].click();
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    const finalUrl = page.url();
                    if (finalUrl.includes('thank') || finalUrl.includes('success') || finalUrl.includes('merci')) {
                        console.log('   ✅ SUCCESS');
                        success++;
                    } else {
                        console.log('   ⚠️  UNKNOWN (check manually)');
                    }
                }
            } catch (error) {
                console.log(`   ❌ FAILED: ${error.message}`);
            } finally {
                await page.close();
            }

            await new Promise(r => setTimeout(r, 3000));
        }

        console.log('\n' + '='.repeat(80));
        console.log(`\n✅ Done! Success: ${success}/${NUMBER_OF_ORDERS}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (browser) await browser.close();
    }
}

createOrders();
