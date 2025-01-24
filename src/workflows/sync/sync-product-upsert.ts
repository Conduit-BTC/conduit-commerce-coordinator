import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { broadcastProductEventsStep, createProductEventsStep, storeProductEventsStep, type WorkflowInput } from "./utils";

const syncProductCreate = createWorkflow(
    "sync-product-create",
    function ({ product }: WorkflowInput) {
        try {
            let nostrEvents = createProductEventsStep({ product });
            storeProductEventsStep(nostrEvents);
            broadcastProductEventsStep(nostrEvents);
            return new WorkflowResponse({
                message: "Products synced to relays successfully"
            })
        } catch (error) {
            console.error("Products sync workflow failed:", error)
            throw error
        }
    }
)

export default syncProductCreate;
