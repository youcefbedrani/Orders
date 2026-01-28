#!/usr/bin/env node

/**
 * Test script to verify order submission to YouCan landing page
 * This tests the actual API endpoint without using the web interface
 */

const testOrders = [
    {
        name: 'Ahmed',
        fullname: 'Ahmed Ali',
        phone: '0555123456',
        qty: 1,
        city: 'Alger',
        commune: 'Bab El Oued',
        country: 'الجزائر'
    },
    {
        name: 'Fatima',
        fullname: 'Fatima Benali',
        phone: '0666789012',
        qty: 2,
        city: 'Oran',
        commune: 'Bir El Djir',
        country: 'الجزائر'
    },
    {
        name: 'Mohamed',
        fullname: 'Mohamed Said',
        phone: '0777456789',
        qty: 1,
        city: 'Constantine',
        commune: 'Constantine',
        country: 'الجزائر'
    }
];

const LANDING_PAGE_URL = 'https://seller-area.youcan.shop/pages/nnnnnnn';
const API_URL = 'http://localhost:3000/api/submit-order';

async function testOrderSubmission() {
    console.log('🚀 Starting Order Submission Test\n');
    console.log(`Landing Page: ${LANDING_PAGE_URL}`);
    console.log(`Test Orders: ${testOrders.length}\n`);
    console.log('='.repeat(80));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < testOrders.length; i++) {
        const order = testOrders[i];
        console.log(`\n[${i + 1}/${testOrders.length}] Testing order for: ${order.fullname} (${order.phone})`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: LANDING_PAGE_URL,
                    data: order
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ SUCCESS - Order submitted for ${order.fullname}`);
                successCount++;
            } else {
                console.log(`❌ FAILED - Order NOT submitted for ${order.fullname}`);
                failCount++;
            }

            // Wait 3 seconds between orders
            if (i < testOrders.length - 1) {
                console.log('   Waiting 3 seconds before next order...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error) {
            console.log(`❌ ERROR - ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Test Results:');
    console.log(`   Total Orders: ${testOrders.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📈 Success Rate: ${((successCount / testOrders.length) * 100).toFixed(1)}%`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Check the server logs above for detailed submission info');
    console.log('   2. Go to your YouCan store dashboard');
    console.log('   3. Check if the orders appear in your orders list');
    console.log('   4. If orders show as "success" but don\'t appear in YouCan:');
    console.log('      - The landing page URL might be incorrect');
    console.log('      - The form fields might not match');
    console.log('      - Check server logs for "Submit response status" and "Redirect location"');
    console.log('\n');
}

// Run the test
testOrderSubmission().catch(console.error);
