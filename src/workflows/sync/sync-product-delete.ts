import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { broadcastDeletionRequestStep, deleteProductEventStep } from "./utils";

const syncProductDelete = createWorkflow(
    "desync-product",
    function ({ productId }: { productId: string }) {
        broadcastDeletionRequestStep(productId)
        deleteProductEventStep(productId)

        return new WorkflowResponse({
            message: `Product deletion request sent to relays, and Product event deleted from database.`,
        })
    }
)

export default syncProductDelete;