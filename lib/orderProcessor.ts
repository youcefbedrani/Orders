// Order processor - ported from utils.py

export interface CustomerData {
    name: string;
    fullname: string;
    phone: string;
    city: string;
    commune: string;
    country?: string;
    qty?: number;
    price?: number;
    date?: string;
}

export async function simulateCheckoutOrder(
    checkoutUrl: string,
    customerData: CustomerData
): Promise<boolean> {
    const isLandingPage = checkoutUrl.includes('/pages/');

    if (isLandingPage) {
        return await submitToLandingPage(checkoutUrl, customerData);
    } else {
        return await submitToCheckout(checkoutUrl, customerData);
    }
}

async function submitToLandingPage(
    url: string,
    data: CustomerData
): Promise<boolean> {
    try {
        // 1. Visit landing page to get CSRF token
        const pageResponse = await fetch(url);
        const html = await pageResponse.text();

        // Extract CSRF token
        const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
        if (!tokenMatch) {
            console.error('Could not find CSRF token on landing page');
            return false;
        }
        const token = tokenMatch[1];

        // 2. Prepare form data
        const formData = new URLSearchParams();
        formData.append('_token', token);
        formData.append('first_name', data.name || 'Customer');
        formData.append('last_name', data.fullname || 'Order');
        formData.append('phone', data.phone);
        formData.append('country', data.country || 'الجزائر');
        formData.append('region', data.city || 'أدرار');
        formData.append('city', data.commune || 'أدرار');

        // Add quantity if form has it
        if (html.includes('name="quantity"')) {
            formData.append('quantity', String(data.qty || 1));
        }

        // Detect custom fields (like date)
        const customMatch = html.match(/name="(extra_fields\[custom_field_[^\]]+\])"/);
        if (customMatch) {
            formData.append(customMatch[1], data.date || '01/01/2000');
        }

        // 3. Submit to landing page
        const submitResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: formData.toString(),
            redirect: 'follow',
        });

        // 4. Check for success
        const finalUrl = submitResponse.url.toLowerCase();
        const isSuccess = finalUrl.includes('thank') ||
            finalUrl.includes('success') ||
            finalUrl.includes('merci');

        if (isSuccess) {
            console.log(`Success: Landing page order completed for ${data.fullname}`);
            return true;
        } else {
            console.warn(`Failed: Landing page submission for ${data.fullname}. URL: ${submitResponse.url}`);
            return false;
        }
    } catch (error) {
        console.error(`Error in landing page submission: ${error}`);
        return false;
    }
}

async function submitToCheckout(
    checkoutUrl: string,
    data: CustomerData
): Promise<boolean> {
    // Regular checkout flow (not implemented yet - can add if needed)
    console.log('Regular checkout not implemented yet');
    return false;
}

// Helper to add delay between orders
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay between 2-4 seconds
export function randomDelay(): Promise<void> {
    const ms = Math.random() * 2000 + 2000; // 2000-4000ms
    return delay(ms);
}
