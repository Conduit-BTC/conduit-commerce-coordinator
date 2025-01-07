import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events"
import NostrEventsModuleService from "@/modules/nostr-events/service"
import { logger } from "@medusajs/framework"
import {
    createStep,
    createWorkflow,
    StepResponse,
    WorkflowResponse,
    when,
} from "@medusajs/framework/workflows-sdk"
import { NDKEvent } from "@nostr-dev-kit/ndk"

type WorkflowInput = {
    orderEvent: NDKEvent
}

const storeOrderEvent = createStep(
    "store-order-event",
    async function ({ orderEvent }: WorkflowInput, { container }) {
        try {
            logger.info("[new-order-event.ts]: Storing order event...");
            const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
            const eventData = {
                id: orderEvent.id,
                pubkey: orderEvent.pubkey,
                created_at: orderEvent.created_at,
                kind: orderEvent.kind,
                content: orderEvent.content,
                tags: orderEvent.tags,
                sig: orderEvent.sig,
            };
            const storedEvent = await nostrEventsModuleService.createOrderNostrEvents(eventData);
            logger.info(`[new-order-event.ts]: New order event stored: ${storedEvent.id}`);
            return new StepResponse();
        } catch (error) {
            logger.error(`[new-order-event.ts]: Failed to store order event: ${error}`);
            throw error;
        }
    }
)

const newOrderEventWorkflow = createWorkflow(
    "new-order-event",
    function (input: WorkflowInput) {
        try {
            storeOrderEvent(input);
            return new WorkflowResponse({
                success: true,
                message: "Order is stored in the database",
            });
        } catch (error) {
            logger.error("Product sync workflow failed:", error);
            throw error;
        }
    }
)

export default newOrderEventWorkflow;
