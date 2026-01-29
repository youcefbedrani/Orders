// Automatic column detection for Excel uploads

interface ColumnMapping {
    name?: string;
    phone?: string;
    city?: string;
    price?: string;
}

interface DetectionResult {
    mapping: ColumnMapping;
    confidence: {
        name: number;
        phone: number;
        city: number;
        price: number;
    };
    headers: string[];
}

// Pattern definitions for each field
const PATTERNS = {
    name: [
        'name', 'nom', 'client', 'customer', 'firstname', 'first name',
        'prenom', 'prénom', 'fullname', 'full name', 'nom complet',
        'first_name', 'cliente', 'nom client'
    ],
    phone: [
        'phone', 'telephone', 'tel', 'mobile', 'contact', 'numero',
        'numéro', 'phone number', 'tel number', 'gsm', 'cellphone',
        'cell', 'portable', 'tél', 'téléphone'
    ],
    city: [
        'city', 'ville', 'location', 'address', 'adresse', 'town',
        'locality', 'commune', 'wilaya', 'region', 'région'
    ],
    price: [
        'price', 'prix', 'amount', 'montant', 'value', 'valeur',
        'total', 'cost', 'coût', 'cout', 'tarif', 'rate'
    ]
};

/**
 * Normalize a header string for comparison
 */
function normalizeHeader(header: string): string {
    return header
        .toLowerCase()
        .trim()
        .replace(/[_\s-]+/g, '') // Remove spaces, underscores, hyphens
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Calculate match score between header and pattern
 */
function getMatchScore(header: string, pattern: string): number {
    const normalizedHeader = normalizeHeader(header);
    const normalizedPattern = normalizeHeader(pattern);

    // Exact match
    if (normalizedHeader === normalizedPattern) {
        return 100;
    }

    // Contains pattern
    if (normalizedHeader.includes(normalizedPattern)) {
        return 90;
    }

    // Pattern contains header (e.g., "name" in "firstname")
    if (normalizedPattern.includes(normalizedHeader)) {
        return 85;
    }

    // Starts with pattern
    if (normalizedHeader.startsWith(normalizedPattern)) {
        return 80;
    }

    // Ends with pattern
    if (normalizedHeader.endsWith(normalizedPattern)) {
        return 75;
    }

    return 0;
}

/**
 * Find best matching column for a field
 */
function findBestMatch(headers: string[], patterns: string[]): { column: string | undefined; score: number } {
    let bestMatch = { column: undefined as string | undefined, score: 0 };

    for (const header of headers) {
        for (const pattern of patterns) {
            const score = getMatchScore(header, pattern);
            if (score > bestMatch.score) {
                bestMatch = { column: header, score };
            }
        }
    }

    return bestMatch;
}

/**
 * Detect columns automatically from Excel headers
 */
export function detectColumns(headers: string[]): DetectionResult {
    const mapping: ColumnMapping = {};
    const confidence = {
        name: 0,
        phone: 0,
        city: 0,
        price: 0
    };

    // Find best match for each field
    const nameMatch = findBestMatch(headers, PATTERNS.name);
    if (nameMatch.column) {
        mapping.name = nameMatch.column;
        confidence.name = nameMatch.score;
    }

    const phoneMatch = findBestMatch(headers, PATTERNS.phone);
    if (phoneMatch.column) {
        mapping.phone = phoneMatch.column;
        confidence.phone = phoneMatch.score;
    }

    const cityMatch = findBestMatch(headers, PATTERNS.city);
    if (cityMatch.column) {
        mapping.city = cityMatch.column;
        confidence.city = cityMatch.score;
    }

    const priceMatch = findBestMatch(headers, PATTERNS.price);
    if (priceMatch.column) {
        mapping.price = priceMatch.column;
        confidence.price = priceMatch.score;
    }

    return {
        mapping,
        confidence,
        headers
    };
}

/**
 * Check if detection is confident enough to auto-apply
 */
export function isConfidentDetection(result: DetectionResult): boolean {
    const { confidence, mapping } = result;

    // All required fields must be detected
    if (!mapping.name || !mapping.phone || !mapping.city) {
        return false;
    }

    // All required fields must have high confidence (>= 75%)
    if (confidence.name < 75 || confidence.phone < 75 || confidence.city < 75) {
        return false;
    }

    return true;
}

/**
 * Get confidence level as text
 */
export function getConfidenceLabel(score: number): string {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Very Good';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Low';
}

/**
 * Get confidence color for UI
 */
export function getConfidenceColor(score: number): string {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
}
