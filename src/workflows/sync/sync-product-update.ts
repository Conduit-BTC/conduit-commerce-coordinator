import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { broadcastDeletionRequestStep, broadcastProductEventStep, createProductEventStep, deleteProductEventStep, storeProductEventStep } from "./utils";
import type { WorkflowInput } from "./utils";

const syncProductUpdate = createWorkflow(
    "sync-product-update",
    function ({ product }: WorkflowInput) {
        try {
            broadcastDeletionRequestStep(product.id)
            deleteProductEventStep(product.id)

            const nostrEvent = createProductEventStep({ product })
            storeProductEventStep({
                nostrEvent,
                medusaProductId: product.id
            })

            broadcastProductEventStep(nostrEvent)

            return new WorkflowResponse({
                message: "Product synced to relays successfully"
            })
        } catch (error) {
            console.error("Product sync workflow failed:", error)
            throw error
        }
    }
)

export default syncProductUpdate;
