import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils";
import { IProductModuleService, ProductDTO } from "@medusajs/framework/types";

const getProductStep = createStep(
    "get-product-step",
    async ({ productId }: { productId: string }, { container }): Promise<any> => {
        const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
        let product: ProductDTO | null = null;

        try {
            product = await productModuleService.retrieveProduct(productId);
        } catch {
            return new StepResponse(product);
        }
        return new StepResponse(product);
    },
)

const getProductWorkflow = createWorkflow(
    "get-product-workflow",
    function ({ productId }: { productId: string }) {
        try {
            const product = getProductStep({
                productId
            })

            return new WorkflowResponse({
                product
            })
        } catch (error) {
            console.error("Get Product workflow failed:", error)
            throw error
        }
    }
)

export default getProductWorkflow;
