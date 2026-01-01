import crypto from 'crypto';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Define the return type for decryptObject
interface DecryptResult<T> {
    success: boolean;
    result?: T;
    error?: string;
}

// Use environment variable for secret key
// SECRET_KEY must be set - no fallback for security
const SECRET_KEY = process.env.ORDER_ENCRYPTION_KEY;

// Encrypt a large object into a UUID and store in cookie
export async function encryptObject<T>(obj: T): Promise<string> {
    const cookieStore = await cookies();
    try {
        // Validate input
        if (obj === null || obj === undefined || typeof obj !== 'object') {
            throw new Error('Input must be a valid object');
        }
        if (!SECRET_KEY) {
            throw new Error('Environment variable ORDER_ENCRYPTION_KEY is not set');
        }

        // Convert object to JSON string
        const jsonString = JSON.stringify(obj);
        console.log('JSON String Length:', jsonString.length);

        // Derive a 32-byte key for AES-256-CBC using SHA-256
        const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

        // Generate a random IV (16 bytes for AES-CBC)
        const iv = crypto.randomBytes(16);

        // Encrypt the JSON string
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(jsonString, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        console.log('Encrypted Length:', encrypted.length);

        // Create HMAC signature for integrity
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(iv);
        hmac.update(encrypted);
        const signature = hmac.digest('base64');

        // Combine IV, encrypted data, and signature into a single string
        const encryptedString = `${iv.toString('base64')}:${encrypted}:${signature}`;
        console.log('Final Encrypted String Length:', encryptedString.length);

        // Generate UUID and store encrypted string in cookie
        const uuid = uuidv4();
        cookieStore.set(`order:${uuid}`, encryptedString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600, // 1 hour
        });

        return uuid;
    } catch (err) {
        throw new Error(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// Decrypt a string from cookie using UUID
export async function decryptObject<T>(uuid: string): Promise<DecryptResult<T>> {
    const cookieStore = await cookies();
    try {
        // Validate input
        if (!uuid || typeof uuid !== 'string') {
            return { success: false, error: 'No UUID provided' };
        }
        if (!SECRET_KEY) {
            return { success: false, error: 'Environment variable ORDER_ENCRYPTION_KEY is not set' };
        }

        // Retrieve encrypted string from cookie
        const encryptedString = cookieStore.get(`order:${uuid}`)?.value;
        if (!encryptedString) {
            return { success: false, error: `No encrypted order found for UUID: ${uuid}` };
        }

        // Split the encrypted string into IV, encrypted data, and signature
        const parts = encryptedString.split(':');
        if (parts.length !== 3) {
            return { success: false, error: `Invalid string format: expected 3 parts, got ${parts.length}` };
        }

        const [ivBase64, encryptedBase64, signatureBase64] = parts;

        // Decode IV and encrypted data
        let iv: Buffer, encrypted: Buffer;
        try {
            iv = Buffer.from(ivBase64!, 'base64');
            encrypted = Buffer.from(encryptedBase64!, 'base64');
            console.log('IV Length:', iv.length, 'Encrypted Length:', encrypted.length);
        } catch (err) {
            return { success: false, error: `Invalid string: failed to decode Base64 components - ${err instanceof Error ? err.message : String(err)}` };
        }

        // Verify IV length (16 bytes for AES-CBC)
        if (iv.length !== 16) {
            return { success: false, error: `Invalid string: incorrect IV length, expected 16, got ${iv.length}` };
        }

        // Derive the key
        const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

        // Verify HMAC signature
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(iv);
        hmac.update(encryptedBase64!);
        const computedSignature = hmac.digest('base64');
        if (computedSignature !== signatureBase64) {
            return { success: false, error: `Invalid signature: string not signed with the provided secret key` };
        }

        // Decrypt the data
        let decrypted: string;
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            // @ts-ignore
            decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            console.log('Decrypted Length:', decrypted.length);
        } catch (err) {
            return { success: false, error: `Decryption failed: ${err instanceof Error ? err.message : String(err)}` };
        }

        // Parse JSON back to object
        try {
            const obj: T = JSON.parse(decrypted);
            return { success: true, result: obj };
        } catch (err) {
            return { success: false, error: `JSON parsing failed: ${err instanceof Error ? err.message : String(err)}` };
        }
    } catch (err) {
        return { success: false, error: `Decryption process failed: ${err instanceof Error ? err.message : String(err)}` };
    }
}

