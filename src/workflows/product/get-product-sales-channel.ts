import {
    createStep,
    StepResponse,
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

const getProductSalesChannelsStep = createStep(
    "get-product-sales-channel-step",
    async ({ productId }: { productId: string }, { container }): Promise<any> => {
        const query = container.resolve("query")

        const { data: productSalesChannels } = await query.graph({
            entity: "product_sales_channel",
            fields: ["*"],
            filters: {
                product_id: productId
            }
        })

        return new StepResponse(productSalesChannels)
    }
)

const getProductSalesChannelsSWorkflow = createWorkflow(
    "get-product-sales-channel-workflow",
    function ({ productId }: { productId: string }) {
        try {
            const productSalesChannels = getProductSalesChannelsStep({
                productId
            })

            return new WorkflowResponse({
                productSalesChannels
            })
        } catch (error) {
            console.error("Get variant prices workflow failed:", error)
            throw error
        }
    }
)

export default getProductSalesChannelsSWorkflow
