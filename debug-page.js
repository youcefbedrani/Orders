#!/usr/bin/env node

const puppeteer = require('puppeteer');

const LANDING_PAGE_URL = 'https://seller-area.youcan.shop/pages/e5408afe-242d-42cc-b581-359b477316f6/preview';

async function debugLandingPage() {
    console.log('🔍 Debugging Landing Page\n');
    console.log(`URL: ${LANDING_PAGE_URL}\n`);
    console.log('='.repeat(80));

    let browser;

    try {
        console.log('\n1️⃣  Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('2️⃣  Navigating to landing page...');
        await page.goto(LANDING_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('3️⃣  Page loaded! Taking screenshot...');
        await page.screenshot({ path: 'landing-page-preview.png', fullPage: true });
        console.log('   📸 Screenshot saved: landing-page-preview.png');

        console.log('\n4️⃣  Analyzing page content...');

        // Check for forms
        const forms = await page.$$('form');
        console.log(`   ✓ Found ${forms.length} form(s)`);

        // Check for input fields
        const inputs = await page.$$('input');
        console.log(`   ✓ Found ${inputs.length} input field(s)`);

        // List all input fields
        console.log('\n5️⃣  Input fields found:');
        for (const input of inputs) {
            const name = await input.evaluate(el => el.getAttribute('name'));
            const type = await input.evaluate(el => el.getAttribute('type'));
            const placeholder = await input.evaluate(el => el.getAttribute('placeholder'));
            console.log(`   - name="${name}" type="${type}" placeholder="${placeholder}"`);
        }

        // Check for buttons
        const buttons = await page.$$('button, input[type="submit"]');
        console.log(`\n6️⃣  Found ${buttons.length} button(s)`);
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent || el.value);
            console.log(`   - "${text.trim()}"`);
        }

        // Get form action
        if (forms.length > 0) {
            const formAction = await forms[0].evaluate(el => el.getAttribute('action'));
            console.log(`\n7️⃣  Form action: ${formAction}`);
        }

        console.log('\n✅ Debug complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugLandingPage();
