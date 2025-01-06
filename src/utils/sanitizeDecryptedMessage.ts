export function sanitizeDecryptedMessage(decrypted: string): object {
    try {
        // Parse the initial string
        const obj = JSON.parse(decrypted);

        // If address is a string, parse it into an object
        if (obj.address && typeof obj.address === 'string') {
            try {
                obj.address = JSON.parse(obj.address);
            } catch (e) {
                console.warn('Failed to parse address field:', e);
            }
        }

        return obj;
    } catch (e) {
        console.warn('Failed to parse JSON:', e);
        throw new Error('Failed to parse message');
    }
}
