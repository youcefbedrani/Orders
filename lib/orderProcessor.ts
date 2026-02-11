// Order processor - Enhanced with retry mechanism and better error handling

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

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Helper to add delay between orders
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay between 2-4 seconds
export function randomDelay(): Promise<void> {
    const ms = Math.random() * 2000 + 2000; // 2000-4000ms
    return delay(ms);
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Retry wrapper with exponential backoff
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    context: string = 'operation'
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${context}] Attempt ${attempt}/${maxRetries}`);
            const result = await operation();
            if (attempt > 1) {
                console.log(`[${context}] ✅ Success on attempt ${attempt}`);
            }
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`[${context}] ⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

            if (attempt < maxRetries) {
                const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`[${context}] Retrying in ${delayMs}ms...`);
                await delay(delayMs);
            }
        }
    }

    console.error(`[${context}] ❌ All ${maxRetries} attempts failed`);
    throw lastError;
}

export async function simulateCheckoutOrder(
    checkoutUrl: string,
    customerData: CustomerData
): Promise<boolean> {
    const isLandingPage = checkoutUrl.includes('/pages/');

    if (isLandingPage) {
        return await submitToLandingPageWithRetry(checkoutUrl, customerData);
    } else {
        return await submitToCheckoutWithRetry(checkoutUrl, customerData);
    }
}

// Wrapper with retry for landing page submission
async function submitToLandingPageWithRetry(
    url: string,
    data: CustomerData
): Promise<boolean> {
    try {
        return await retryOperation(
            () => submitToLandingPage(url, data),
            MAX_RETRIES,
            `Landing Page: ${data.fullname}`
        );
    } catch (error) {
        console.error(`Failed to submit landing page order for ${data.fullname} after ${MAX_RETRIES} attempts`);
        return false;
    }
}

async function submitToLandingPage(
    url: string,
    data: CustomerData
): Promise<boolean> {
    // 1. Visit landing page to get CSRF token
    const pageResponse = await fetchWithTimeout(url);
    const html = await pageResponse.text();

    // Extract CSRF token - try multiple patterns
    const tokenPatterns = [
        /name="_token"\s+value="([^"]+)"/,
        /name='_token'\s+value='([^']+)'/,
        /<input[^>]*name="_token"[^>]*value="([^"]+)"/,
        /<input[^>]*value="([^"]+)"[^>]*name="_token"/,
        /csrf[_-]?token["']?\s*[:=]\s*["']([^"']+)["']/i
    ];

    let token: string | null = null;
    for (const pattern of tokenPatterns) {
        const match = html.match(pattern);
        if (match) {
            token = match[1];
            console.log(`✓ CSRF token found using pattern: ${pattern.source.substring(0, 30)}...`);
            break;
        }
    }

    if (!token) {
        console.error('Could not find CSRF token on landing page with any pattern');
        console.error('Page URL:', url);
        console.error('HTML preview:', html.substring(0, 500));
        throw new Error('CSRF token not found');
    }

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
    const submitResponse = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': url,
            'Origin': new URL(url).origin
        },
        body: formData.toString(),
        redirect: 'follow',
    });

    // 4. Check for success - both URL and content
    const finalUrl = submitResponse.url.toLowerCase();
    const responseText = await submitResponse.text();

    const urlSuccess = finalUrl.includes('thank') ||
        finalUrl.includes('success') ||
        finalUrl.includes('merci') ||
        finalUrl.includes('confirmation');

    const contentSuccess = responseText.toLowerCase().includes('thank') ||
        responseText.toLowerCase().includes('success') ||
        responseText.toLowerCase().includes('merci') ||
        responseText.includes('شكرا') ||
        responseText.toLowerCase().includes('confirmation');

    const isSuccess = urlSuccess || contentSuccess;

    if (isSuccess) {
        console.log(`✅ Success: Landing page order completed for ${data.fullname}`);
        console.log(`   Final URL: ${submitResponse.url}`);
        console.log(`   Detection: ${urlSuccess ? 'URL' : 'Content'}`);
        return true;
    } else {
        console.warn(`❌ Failed: Landing page submission for ${data.fullname}`);
        console.warn(`   Final URL: ${submitResponse.url}`);
        console.warn(`   Status: ${submitResponse.status}`);
        console.warn(`   Response preview: ${responseText.substring(0, 200)}`);
        throw new Error('Order submission failed - no success indicators found');
    }
}

// Wrapper with retry for checkout submission
async function submitToCheckoutWithRetry(
    checkoutUrl: string,
    data: CustomerData
): Promise<boolean> {
    try {
        return await retryOperation(
            () => submitToCheckout(checkoutUrl, data),
            MAX_RETRIES,
            `Checkout: ${data.fullname}`
        );
    } catch (error) {
        console.error(`Failed to submit checkout order for ${data.fullname} after ${MAX_RETRIES} attempts`);
        return false;
    }
}

async function submitToCheckout(
    checkoutUrl: string,
    data: CustomerData
): Promise<boolean> {
    // Regular checkout flow (not implemented yet - can add if needed)
    console.log('Regular checkout not implemented yet');
    throw new Error('Regular checkout not implemented');
}
