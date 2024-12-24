import medusaToNostrProduct from "@/utils/medusaProductToNostrProduct";
import { getNdk } from "@/utils/NdkService"
import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Product } from ".medusa/types/remote-query-entry-points";
import { NDKEvent } from "@nostr-dev-kit/ndk";

type WorkflowInput = {
    product: Product
}

const step1 = createStep(
    "post-product-to-relay",
    async (product: Product) => {
        const ndk = await getNdk();
        const nostrProduct = medusaToNostrProduct(product, "coffee-by-conduit-btc");

        const ndkEvent = new NDKEvent(ndk);
        ndkEvent.kind = 30018;
        ndkEvent.content = JSON.stringify(nostrProduct.content);
        ndkEvent.tags = nostrProduct.tags;

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
            console.log('Relay pool status:', ndk.pool.stats());
            throw error;
        }
    }
)

const syncProduct = createWorkflow(
    "sync-product",
    function ({ product }: WorkflowInput) {
        const relays = step1(product)

        return new WorkflowResponse({
            message: `Product synced successfully`
        })
    }
)

export default syncProduct
