import {
    createStep,
    createWorkflow,
    StepResponse,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { RELAY_POOL_MODULE } from "@/modules/relay-pool"
import RelayPoolModuleService from "@/modules/relay-pool/service"

type CreateRelayWorkflowInput = {
    url: string
}

const createRelayStep = createStep(
    "create-relay",
    async ({ url }: CreateRelayWorkflowInput, { container }) => {
        const relayPoolModuleService: RelayPoolModuleService = container.resolve(RELAY_POOL_MODULE)

        const relay = await relayPoolModuleService.createRelays({ url })

        return new StepResponse(relay, relay)
    },
    async (relay, { container }) => {
        const relayPoolModuleService: RelayPoolModuleService = container.resolve(RELAY_POOL_MODULE)

        await relayPoolModuleService.deleteRelays(relay.id)
    }
)

export const createRelayWorkflow = createWorkflow(
    "create-relay",
    (relayInput: CreateRelayWorkflowInput) => {
        const relay = createRelayStep(relayInput)

        return new WorkflowResponse(relay)
    }
)
