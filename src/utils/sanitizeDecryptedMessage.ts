export function sanitizeDecryptedMessage(decrypted: string): string {
    let sanitized = decrypted
        // Remove all whitespace between tokens while preserving necessary spaces
        .replace(/\s+/g, '')
        // Add back necessary spaces in address and messages
        .replace(/,([A-Za-z])/g, ', $1')
        // Handle any trailing commas
        .replace(/,}/g, '}')
        .replace(/,]/g, ']')
        .trim();

    // Remove trailing comma at the end if it exists
    if (sanitized.endsWith(',')) {
        sanitized = sanitized.slice(0, -1);
    }

    return sanitized;
}
