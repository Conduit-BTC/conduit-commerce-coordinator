import { NOSTR_RELAY_LISTENER_MODULE } from "@/modules/nostr-relay-listener"
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
    data: any
}

const emitStep = createStep(
    "is-order-event-stored",
    async function ({ data }: WorkflowInput, { container }) {
        console.log("Container is: ", container.registrations)
        const eventEmitterService: NostrEventsModuleService = container.resolve(NOSTR_RELAY_LISTENER_MODULE);
        return new StepResponse();
    }
)

const emitNewOrderEventWorkflow = createWorkflow(
    "emit-order-event",
    function (input: WorkflowInput) {
        emitStep(input);
    }
)

export default emitNewOrderEventWorkflow;
