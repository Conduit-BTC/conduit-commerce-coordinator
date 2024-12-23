import medusaToNostrProduct from "@/utils/medusaToNostrProduct";
import { getNdk } from "@/utils/NdkService"
import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdminProduct } from "@medusajs/framework/types";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { NDKRelay } from "@nostr-dev-kit/ndk";

type WorkflowInput = {
    product: AdminProduct
}

const step1 = createStep(
    "post-product-to-relay",
    async (product: AdminProduct) => {
        const ndk = await getNdk();
        const nostrProduct = medusaToNostrProduct(product, "coffee-by-conduit-btc");
        // console.log(JSON.stringify(nostrProduct, null, 2));

        const ndkEvent = new NDKEvent(ndk);
        ndkEvent.kind = 30018;
        ndkEvent.content = JSON.stringify(nostrProduct.content);
        ndkEvent.tags = nostrProduct.tags;

        console.log('NDK connection status:', ndk.pool.stats());

        await ndkEvent.sign();

        try {
            const publishPromise = ndkEvent.publish();
            const relays = await Promise.race([
                publishPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Publish timeout')), 5000)
                )
            ]);

            return new StepResponse(relays)
        } catch (error) {
            console.error('Failed to publish:', error);
            // Log relay pool status for debugging
            console.log('Relay pool status:', ndk.pool.stats());
            throw error;
        }
    }
)

const syncProduct = createWorkflow(
    "sync-product",
    function ({ product }: WorkflowInput) {
        const relays = step1(product)

        console.log('Published to relays:', Array.from(relays).map(r => r.url));

        return new WorkflowResponse({
            message: `Product synced successfully`
        })
    }
)

export default syncProduct
