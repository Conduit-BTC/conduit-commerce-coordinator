import {
    createStep,
    StepResponse,
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

const getPricesStep = createStep(
    "get-variant-prices-step",
    async ({ variantId }: { variantId: string }, { container }): Promise<any> => {

        return new StepResponse([])
    }
)

const getPricesWorkflow = createWorkflow(
    "get-variant-prices-workflow",
    function ({ variantId }: { variantId: string }) {
        try {
            const prices = getPricesStep({
                variantId
            })

            return new WorkflowResponse({
                prices
            })
        } catch (error) {
            console.error("Get variant prices workflow failed:", error)
            throw error
        }
    }
)

export default getPricesWorkflow
