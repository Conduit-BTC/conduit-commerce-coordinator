import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils";
import { IProductModuleService } from "@medusajs/framework/types";

const getProductVariantStep = createStep(
    "get-product-variant-step",
    async ({ variantId }: { variantId: string }, { container }): Promise<any> => {
        const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
        let variant: any = null;

        const variants = await productModuleService.listProductVariants({ id: variantId });
        if (variants.length) { variant = variants[0] };
        return new StepResponse(variant);
    },
)

const getProductVariantWorkflow = createWorkflow(
    "get-product-variant-workflow",
    function ({ variantId }: { variantId: string }) {
        try {
            const variant = getProductVariantStep({
                variantId
            })

            return new WorkflowResponse({
                variant
            })
        } catch (error) {
            console.error("Get Product Variant workflow failed:", error)
            throw error
        }
    }
)

export default getProductVariantWorkflow;
