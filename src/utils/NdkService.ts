import NDK, { NDKPrivateKeySigner, NDKRelay } from "@nostr-dev-kit/ndk";
import "websocket-polyfill";

export class NDKService {
    private static instance: NDKService | null = null;
    private ndk: NDK | null = null;

    private constructor() {
        // Private constructor to prevent direct construction calls with 'new'
    }

    public static getInstance(): NDKService {
        if (!NDKService.instance) NDKService.instance = new NDKService();
        return NDKService.instance;
    }

    public initialize(): Promise<NDK> {
        if (this.ndk) return Promise.resolve(this.ndk);
        const privkey = process.env.PRIVKEY;
        if (!privkey) throw new Error("PRIVKEY not found in .env");
        const signer = new NDKPrivateKeySigner(privkey);

        this.ndk = new NDK({
            explicitRelayUrls: ["ws://localhost:7777"],
            signer,
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);

            const checkConnection = () => {
                const stats = this.ndk!.pool.stats();
                if (stats.connected > 0) {
                    clearTimeout(timeout);
                    resolve(this.ndk!);
                } else if (stats.disconnected === stats.total) {
                    clearTimeout(timeout);
                    reject(new Error('All relays disconnected'));
                }
            };

            this.ndk!.pool.on('connect', () => {
                console.log(`[NDK] Connected to relay`);
                checkConnection();
            });

            this.ndk!.pool.on('relay:disconnect', (relay) => {
                console.log(`[NDK] Disconnected from relay: ${relay.url}`);
            });

            this.ndk!.connect().catch(reject);
        });
    }

    public getNDK(): NDK {
        if (!this.ndk) {
            throw new Error("NDK not initialized. Call initialize() first.");
        }
        return this.ndk;
    }

    // Method to reset the instance (mainly for testing purposes)
    public static reset(): void {
        NDKService.instance = null;
    }
}

// Usage example:
export async function getNdk(): Promise<NDK> {
    const service = NDKService.getInstance();
    return await service.initialize();
}
