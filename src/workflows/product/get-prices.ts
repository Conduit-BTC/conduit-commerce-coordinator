import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
    createStep,
    StepResponse,
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

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

        const { data: priceSets } = await query.graph({
            entity: "price_set",
            fields: ["*"],
            filters: {
                id: productVariantPriceSets.map((priceSet) => priceSet.price_set_id)
            }
        })

        const { data: prices } = await query.graph({
            entity: "price",
            fields: ["*"],
            filters: {
                price_set_id: priceSets.map((priceSet) => priceSet.id)
            }
        })

        return new StepResponse(prices)
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
