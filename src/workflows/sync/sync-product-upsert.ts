import medusaToNostrProduct from "@/utils/medusaProductToNostrProduct";
import { getNdk } from "@/utils/NdkService"
import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Product } from ".medusa/types/remote-query-entry-points";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events";
import type NostrEventsModuleService from "@/modules/nostr-events/service";

type WorkflowInput = {
    product: Product
}

const createProductEventStep = createStep(
    "create-product-event",
    async (product: Product) => {
        const nostrProduct = medusaToNostrProduct(product, "coffee-by-conduit-btc");
        const ndk = await getNdk();
        const ndkEvent = new NDKEvent(ndk);
        ndkEvent.kind = 30018;
        ndkEvent.content = JSON.stringify(nostrProduct.content);
        ndkEvent.tags = nostrProduct.tags;

        await ndkEvent.sign();

        return new StepResponse(ndkEvent)
    }
)

const storeProductEventStep = createStep(
    "store-product-event",
    async (nostrEvent: any, { container }): Promise<any> => {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
        const eventData = {
            id: nostrEvent.id,
            pubkey: nostrEvent.pubkey || nostrEvent.nostrEvent?.pubkey,
            created_at: nostrEvent.created_at,
            kind: nostrEvent.kind,
            content: nostrEvent.content,
            tags: nostrEvent.tags,
            sig: nostrEvent.sig,
            nostrEvent: {
                id: nostrEvent.id,
                pubkey: nostrEvent.pubkey,
                created_at: nostrEvent.created_at,
                kind: nostrEvent.kind,
                content: nostrEvent.content,
                tags: nostrEvent.tags,
                sig: nostrEvent.sig
            }
        };
        const storedEvent = await nostrEventsModuleService.createProductNostrEvents(eventData);
        return new StepResponse(storedEvent)
    },
    async (nostrEvent: any, { container }) => {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
        await nostrEventsModuleService.deleteProductNostrEvents(nostrEvent.id);
    }
)

const broadcastProductEventStep = createStep(
    "broadcast-product-event-to-relay",
    async (nostrEvent: any) => {
        console.log("Broadcasting product event to relay");
        try {
            const ndk = await getNdk();
            const event = new NDKEvent(ndk, nostrEvent)
            const publishPromise = event.publish();
            const relays = await Promise.race([
                publishPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Publish timeout')), 5000)
                )
            ]);

            return new StepResponse(relays)
        } catch (error) {
            console.error('Failed to publish:', error);
            throw error;
        }
    }
)

const syncProductUpsert = createWorkflow(
    "sync-product",
    function ({ product }: WorkflowInput) {
        const nostrProduct = createProductEventStep(product)

        storeProductEventStep(nostrProduct)
        broadcastProductEventStep(nostrProduct)

        return new WorkflowResponse({
            message: `Product synced to relays successfully`
        })
    }
)

export default syncProductUpsert
