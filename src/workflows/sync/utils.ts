import {
    createStep, StepResponse
} from "@medusajs/framework/workflows-sdk"
import { getNdk } from "@/utils/NdkService"
import { NDKEvent, NDKRelay, NDKTag } from "@nostr-dev-kit/ndk";
import { NostrProduct } from "@/utils/medusaToNostrProducts";
import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events";
import medusaToNostrProducts from "@/utils/medusaToNostrProducts";
import { Product } from ".medusa/types/remote-query-entry-points";
import type NostrEventsModuleService from "@/modules/nostr-events/service";
import { logger } from "@medusajs/framework/logger";

export type WorkflowInput = {
    product: Product
}

export const createProductEventsStep = createStep(
    "create-product-event",
    async ({ product }: WorkflowInput) => {
        const ndk = await getNdk();
        const ndkEvent = new NDKEvent(ndk);
        const user = await ndk.signer?.user();
        if (!user) throw new Error("[utils.ts > createProductEventStep]: No user found, cannot extract pubkey");
        const pubkey = user.pubkey
        const nostrProducts: NostrProduct[] = medusaToNostrProducts(product, pubkey); // Plural because of variants...

        let signedEvents: {
            id: string,
            pubkey: string,
            created_at?: number,
            kind: number,
            content: string,
            tags: NDKTag[],
            sig?: string
        }[] = [];

        for (const nostrProduct of nostrProducts) {
            ndkEvent.pubkey = pubkey;
            ndkEvent.kind = nostrProduct.kind;
            ndkEvent.content = JSON.stringify(nostrProduct.content);
            ndkEvent.tags = nostrProduct.tags as NDKTag[];
            await ndkEvent.sign();

            signedEvents.push({
                id: ndkEvent.id,
                pubkey: ndkEvent.pubkey,
                created_at: ndkEvent.created_at,
                kind: ndkEvent.kind,
                content: ndkEvent.content,
                tags: ndkEvent.tags,
                sig: ndkEvent.sig
            });
        }

        return new StepResponse(signedEvents)
    }
)

export const storeProductEventsStep = createStep(
    "store-product-events",
    async (nostrEvents: any[], { container }): Promise<any> => {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);

        let storedEvents: any[] = [];

        for (const nostrEvent of nostrEvents) {
            const dTag = nostrEvent.tags.find(tag => tag[0] === "d")
            const [medusaProductId, medusaVariantId] = dTag[1].split("___");
            const eventData = {
                id: nostrEvent.id,
                medusaProductId,
                medusaVariantId,
                pubkey: nostrEvent.pubkey,
                created_at: nostrEvent.created_at,
                kind: nostrEvent.kind,
                content: nostrEvent.content,
                tags: nostrEvent.tags,
                sig: nostrEvent.sig,
                nostrEvent: {
                    ...nostrEvent
                }
            };

            let storedEvent = await nostrEventsModuleService.listProductNostrEvents({ medusaVariantId });
            if (storedEvent.length) storedEvent = await nostrEventsModuleService.updateProductNostrEvents(eventData)
            else storedEvent = await nostrEventsModuleService.createProductNostrEvents(eventData)
            storedEvents.push(storedEvent);
        }

        return new StepResponse(storedEvents)
    }
)

export const broadcastProductEventsStep = createStep(
    "broadcast-product-events-to-relay",
    async (nostrEvents: any[]) => {
        try {
            const ndk = await getNdk();

            for (const nostrEvent of nostrEvents) {
                const event = new NDKEvent(ndk, nostrEvent)
                const publishPromise = event.publish();
                const relays = await Promise.race([
                    publishPromise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Publish timeout')), 5000)
                    )
                ]) as Set<NDKRelay>;
                logger.info(`[sync-product-create] Product event with ID ${nostrEvent.id} successfully broadcast to the following relays: `);
                relays.forEach(relay => logger.info(`[sync-product-create] ${relay.url}`));
                // TODO: Add retry logic + fail handling
            }

            return new StepResponse()
        } catch (error) {
            console.error('Failed to publish:', error);
            throw error;
        }
    }
)

export const deleteProductEventStep = createStep(
    "delete-event-from-database",
    async (productId: string, { container }) => {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);

        try {
            await nostrEventsModuleService.deleteProductNostrEvents(productId);
        } catch (e) {
            console.error("Failed to delete Product event from database", e);
        }

        return new StepResponse();
    }
)
