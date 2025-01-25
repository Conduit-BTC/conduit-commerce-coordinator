import {
    createStep,
    StepResponse,
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const getPricesStep = createStep(
    "get-variant-prices-step",
    async ({ variantId }: { variantId: string }, { container }): Promise<any> => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        const { data: productVariantPriceSets } = await query.graph({
            entity: "product_variant_price_set",
            fields: ["*"],
            filters: {
                variant_id: variantId
            }
        })

        return new StepResponse(productVariantPriceSets)
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
