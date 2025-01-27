import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events"
import NostrEventsModuleService from "@/modules/nostr-events/service"
import { logger } from "@medusajs/framework"
import {
    createStep,
    createWorkflow,
    StepResponse,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { NDKEvent } from "@nostr-dev-kit/ndk"

type WorkflowInput = {
    orderEvent: NDKEvent
}

const isOrderEventStored = createStep(
    "is-order-event-stored",
    async function ({ orderEvent }: WorkflowInput, { container }) {
        const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
        const order = await nostrEventsModuleService.listOrderNostrEvents({ id: [orderEvent.id] });
        return new StepResponse({ exists: order.length > 0 });
    }
)

const checkOrderEventExistsWorkflow = createWorkflow(
    "check-order-event-exists",
    function (input: WorkflowInput) {
        try {
            const checkResult = isOrderEventStored(input);
            return new WorkflowResponse(
                checkResult
            );
        } catch (error) {
            logger.error("Product sync workflow failed:", error);
            throw error;
        }
    }
)

export default checkOrderEventExistsWorkflow;
