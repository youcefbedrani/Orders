#!/usr/bin/env node

const puppeteer = require('puppeteer');

const SHOPIFY_URL = 'https://w4tc42-9i.myshopify.com/products/usb-%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%B4%D8%A9-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84';

async function testShopify() {
    console.log('🛍️  Testing Shopify Product Page\n');
    console.log(`URL: ${SHOPIFY_URL}\n`);
    console.log('='.repeat(80));

    let browser;

    try {
        console.log('\n1️⃣  Launching browser...');
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('2️⃣  Navigating to Shopify product page...');
        await page.goto(SHOPIFY_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('3️⃣  Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('4️⃣  Taking screenshot...');
        await page.screenshot({ path: 'shopify-product.png', fullPage: true });
        console.log('   📸 Screenshot saved: shopify-product.png');

        console.log('\n5️⃣  Analyzing page...');

        // Check for forms
        const forms = await page.$$('form');
        console.log(`   ✓ Found ${forms.length} form(s)`);

        // Check for "Add to Cart" button
        const addToCartButtons = await page.$$('button[name="add"], button:has-text("Add to cart"), button:has-text("أضف إلى السلة")');
        console.log(`   ✓ Found ${addToCartButtons.length} "Add to Cart" button(s)`);

        // Check for input fields
        const inputs = await page.$$('input');
        console.log(`   ✓ Found ${inputs.length} input field(s)`);

        console.log('\n6️⃣  Input fields:');
        for (const input of inputs) {
            const name = await input.evaluate(el => el.getAttribute('name'));
            const type = await input.evaluate(el => el.getAttribute('type'));
            const id = await input.evaluate(el => el.getAttribute('id'));
            console.log(`   - name="${name}" type="${type}" id="${id}"`);
        }

        // Try to add to cart
        if (addToCartButtons.length > 0) {
            console.log('\n7️⃣  Clicking "Add to Cart"...');
            await addToCartButtons[0].click();

            console.log('8️⃣  Waiting for cart update...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const currentUrl = page.url();
            console.log(`   Current URL: ${currentUrl}`);

            // Check if redirected to cart
            if (currentUrl.includes('/cart')) {
                console.log('   ✅ Redirected to cart!');
            }
        }

        console.log('\n9️⃣  Keeping browser open for 20 seconds...');
        await new Promise(resolve => setTimeout(resolve, 20000));

        console.log('\n✅ Test complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testShopify();
