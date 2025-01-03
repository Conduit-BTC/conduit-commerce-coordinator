import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events";
import type NostrEventsModuleService from "@/modules/nostr-events/service";
import { broadcastProductEventStep, createProductEventStep, type StoreProductEventStepInput, type WorkflowInput } from "./utils";

const storeProductEventStep = createStep(
    "store-product-event",
    async ({ nostrEvent, medusaProductId }: StoreProductEventStepInput, { container }): Promise<any> => {
        console.log("Storing product event...");
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
        const eventData = {
            id: nostrEvent.id,
            medusaProductId,
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

        const storedEvent = await nostrEventsModuleService.createProductNostrEvents(eventData)

        console.log("Product event stored");
        return new StepResponse(storedEvent)
    },
    async (nostrEvent: any, { container }) => {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
        await nostrEventsModuleService.deleteProductNostrEvents(nostrEvent.id);
    }
)

const syncProductCreate = createWorkflow(
    "sync-product-create",
    function ({ product }: WorkflowInput) {
        try {
            const nostrEvent = createProductEventStep({ product })

            storeProductEventStep({
                nostrEvent,
                medusaProductId: product.id
            })
            broadcastProductEventStep(nostrEvent)

            return new WorkflowResponse({
                message: "Product synced to relays successfully"
            })
        } catch (error) {
            console.error("Product sync workflow failed:", error)
            throw error
        }
    }
)

export default syncProductCreate;
