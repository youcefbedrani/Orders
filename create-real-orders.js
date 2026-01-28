#!/usr/bin/env node

/**
 * Shopify Real Order Generator
 * Creates actual orders in Shopify by going through checkout
 * 
 * REQUIREMENTS:
 * 1. Enable "Bogus Gateway" in Shopify Payments settings
 * 2. Use test credit card: 1 for success, 2 for failure
 */

const puppeteer = require('puppeteer');

// Configuration
const PRODUCT_URL = 'https://w4tc42-9i.myshopify.com/products/usb-%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%B4%D8%A9-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84';
const NUMBER_OF_ORDERS = 3; // Start with 3 to test

// Random data
const FIRST_NAMES = ['Ahmed', 'Mohamed', 'Fatima', 'Amina', 'Youssef', 'Sara', 'Ali', 'Leila'];
const LAST_NAMES = ['Benali', 'Mansouri', 'Khalil', 'Saidi', 'Amari', 'Bouazza'];
const CITIES = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida'];
const ADDRESSES = ['Rue de la Liberté', 'Avenue Mohamed V', 'Boulevard Zirout Youcef', 'Rue Didouche Mourad'];

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomPhone() {
    return `0${Math.floor(500000000 + Math.random() * 299999999)}`;
}

function randomEmail() {
    return `test${Math.floor(Math.random() * 10000)}@example.com`;
}

async function createRealOrder() {
    console.log('🛍️  Shopify Real Order Generator\n');
    console.log('⚠️  WARNING: This creates REAL orders in your Shopify store!');
    console.log('   Make sure you have Bogus Gateway enabled for testing.\n');
    console.log('='.repeat(80));

    let browser;
    let successCount = 0;
    let failCount = 0;

    try {
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show browser so you can see what's happening
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (let i = 0; i < NUMBER_OF_ORDERS; i++) {
            const page = await browser.newPage();

            const customer = {
                firstName: randomItem(FIRST_NAMES),
                lastName: randomItem(LAST_NAMES),
                email: randomEmail(),
                phone: randomPhone(),
                address: `${Math.floor(Math.random() * 100)} ${randomItem(ADDRESSES)}`,
                city: randomItem(CITIES),
                postalCode: `${16000 + Math.floor(Math.random() * 32000)}`
            };

            console.log(`\n[${i + 1}/${NUMBER_OF_ORDERS}] 📦 Creating order for: ${customer.firstName} ${customer.lastName}`);
            console.log(`   📧 Email: ${customer.email}`);
            console.log(`   📞 Phone: ${customer.phone}`);
            console.log(`   📍 City: ${customer.city}`);

            try {
                await page.setViewport({ width: 1920, height: 1080 });

                // Step 1: Go to product page
                console.log('   1️⃣  Loading product page...');
                await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(2000);

                // Step 2: Add to cart
                console.log('   2️⃣  Adding to cart...');
                const addToCartButton = await page.$('button[name="add"], form[action*="/cart/add"] button[type="submit"]');
                if (!addToCartButton) {
                    throw new Error('Add to cart button not found');
                }
                await addToCartButton.click();
                await page.waitForTimeout(3000);

                // Step 3: Go to checkout
                console.log('   3️⃣  Going to checkout...');
                await page.goto('https://w4tc42-9i.myshopify.com/checkout', { waitUntil: 'networkidle2' });
                await page.waitForTimeout(3000);

                // Step 4: Fill customer information
                console.log('   4️⃣  Filling customer info...');

                // Email
                const emailField = await page.$('input[name="email"], input[type="email"]');
                if (emailField) {
                    await emailField.type(customer.email);
                }

                // First name
                const firstNameField = await page.$('input[name="firstName"], input[autocomplete="given-name"]');
                if (firstNameField) {
                    await firstNameField.type(customer.firstName);
                }

                // Last name
                const lastNameField = await page.$('input[name="lastName"], input[autocomplete="family-name"]');
                if (lastNameField) {
                    await lastNameField.type(customer.lastName);
                }

                // Address
                const addressField = await page.$('input[name="address1"], input[autocomplete="address-line1"]');
                if (addressField) {
                    await addressField.type(customer.address);
                }

                // City
                const cityField = await page.$('input[name="city"], input[autocomplete="address-level2"]');
                if (cityField) {
                    await cityField.type(customer.city);
                }

                // Postal code
                const postalField = await page.$('input[name="postalCode"], input[autocomplete="postal-code"]');
                if (postalField) {
                    await postalField.type(customer.postalCode);
                }

                // Phone
                const phoneField = await page.$('input[name="phone"], input[type="tel"]');
                if (phoneField) {
                    await phoneField.type(customer.phone);
                }

                await page.waitForTimeout(2000);

                // Step 5: Continue to payment
                console.log('   5️⃣  Continuing to payment...');
                const continueButton = await page.$('button[type="submit"]');
                if (continueButton) {
                    await continueButton.click();
                    await page.waitForTimeout(5000);
                }

                // Step 6: Fill payment (if Bogus Gateway is enabled)
                console.log('   6️⃣  Processing payment...');

                // Check if we're on payment page
                const currentUrl = page.url();
                if (currentUrl.includes('checkout')) {
                    // Try to find and fill credit card fields
                    const cardNumberField = await page.$('input[name="number"], iframe[name*="card-fields"]');

                    if (cardNumberField) {
                        // If Bogus Gateway is enabled, use test card
                        await cardNumberField.type('1'); // Bogus Gateway: 1 = success

                        const expiryField = await page.$('input[name="expiry"]');
                        if (expiryField) await expiryField.type('12/25');

                        const cvvField = await page.$('input[name="verification_value"]');
                        if (cvvField) await cvvField.type('123');

                        await page.waitForTimeout(2000);

                        // Submit payment
                        const payButton = await page.$('button[type="submit"]');
                        if (payButton) {
                            await payButton.click();
                            await page.waitForTimeout(5000);
                        }
                    }
                }

                // Step 7: Check if order was created
                const finalUrl = page.url();
                if (finalUrl.includes('thank') || finalUrl.includes('orders')) {
                    console.log('   ✅ Order created successfully!');
                    successCount++;
                } else {
                    console.log('   ⚠️  Order might not have completed. Final URL:', finalUrl);
                    failCount++;
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                failCount++;
            } finally {
                await page.close();
            }

            // Delay between orders
            if (i < NUMBER_OF_ORDERS - 1) {
                console.log('   ⏳ Waiting 5 seconds before next order...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Order Generation Complete!\n');
        console.log('📊 Results:');
        console.log(`   Total attempts: ${NUMBER_OF_ORDERS}`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Failed: ${failCount}`);
        console.log('\n💡 Check your Shopify Orders page to verify!\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
    } finally {
        if (browser) {
            console.log('\n⏳ Keeping browser open for 10 seconds...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            await browser.close();
        }
    }
}

// Run
createRealOrder();
