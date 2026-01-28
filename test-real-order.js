#!/usr/bin/env node

const puppeteer = require('puppeteer');

const LANDING_PAGE_URL = 'https://seller-area.youcan.shop/pages/e5408afe-242d-42cc-b581-359b477316f6/preview';

async function testRealOrder() {
    console.log('🚀 Testing Real Order Submission\n');
    console.log(`URL: ${LANDING_PAGE_URL}\n`);
    console.log('='.repeat(80));

    let browser;

    try {
        console.log('\n1️⃣  Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show browser so we can see what happens
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            slowMo: 100 // Slow down actions so we can see them
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('2️⃣  Navigating to landing page...');
        await page.goto(LANDING_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('3️⃣  Waiting for page to fully load (10 seconds)...');
        await page.waitForTimeout(10000);

        console.log('4️⃣  Taking screenshot...');
        await page.screenshot({ path: 'page-loaded.png', fullPage: true });

        // Check for forms again after waiting
        const forms = await page.$$('form');
        console.log(`   ✓ Found ${forms.length} form(s) after waiting`);

        const inputs = await page.$$('input');
        console.log(`   ✓ Found ${inputs.length} input field(s) after waiting`);

        if (inputs.length > 0) {
            console.log('\n5️⃣  Filling form...');

            // Fill each input field
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const name = await input.evaluate(el => el.getAttribute('name'));
                const type = await input.evaluate(el => el.getAttribute('type'));
                const placeholder = await input.evaluate(el => el.getAttribute('placeholder'));

                console.log(`   Field ${i + 1}: name="${name}" type="${type}" placeholder="${placeholder}"`);

                // Fill based on field type/name
                if (type === 'date' || name?.includes('date')) {
                    await input.type('2023-01-23');
                    console.log('     → Filled with: 2023-01-23');
                } else if (name?.includes('phone') || type === 'tel' || placeholder?.includes('هاتف')) {
                    await input.type('0555123456');
                    console.log('     → Filled with: 0555123456');
                } else if (name?.includes('name') || placeholder?.includes('اسم')) {
                    await input.type('Ahmed Test');
                    console.log('     → Filled with: Ahmed Test');
                } else if (type === 'text') {
                    await input.type('Test Value');
                    console.log('     → Filled with: Test Value');
                }

                await page.waitForTimeout(500);
            }

            console.log('\n6️⃣  Looking for submit button...');
            const buttons = await page.$$('button, input[type="submit"]');
            console.log(`   Found ${buttons.length} button(s)`);

            if (buttons.length > 0) {
                console.log('7️⃣  Clicking submit button...');
                await buttons[0].click();

                console.log('8️⃣  Waiting for navigation...');
                await page.waitForTimeout(5000);

                const finalUrl = page.url();
                console.log(`\n✅ Final URL: ${finalUrl}`);

                if (finalUrl.includes('thank') || finalUrl.includes('success') || finalUrl.includes('merci')) {
                    console.log('🎉 SUCCESS! Order submitted!');
                } else {
                    console.log('⚠️  Unknown result. Check the browser window.');
                }
            }
        } else {
            console.log('\n❌ No input fields found. The form might be in an iframe or loaded differently.');
        }

        console.log('\n9️⃣  Keeping browser open for 30 seconds so you can see the result...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testRealOrder();
