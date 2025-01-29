import { Order } from ".medusa/types/query-entry-points"
import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events"
import NostrEventsModuleService from "@/modules/nostr-events/service"
import { OrderEvent } from "@/utils/zod/nostrOrderSchema"
import { logger } from "@medusajs/framework"
import {
    createStep,
    createWorkflow,
    StepResponse,
    when,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import getPricesWorkflow from "../product/get-prices"
import getProductVariantWorkflow from "../product/get-product-variant"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"

const storeOrderEventStep = createStep(
    "store-order-event",
    async function (orderNdkEvent: NDKEvent, { container }) {
        try {
            logger.info("[new-order-event.ts]: Storing order event...");
            const nostrEventsModuleService: NostrEventsModuleService = container.resolve(NOSTR_EVENTS_MODULE);
            const eventData = {
                id: orderNdkEvent.id,
                pubkey: orderNdkEvent.pubkey,
                created_at: orderNdkEvent.created_at,
                kind: orderNdkEvent.kind,
                content: orderNdkEvent.content,
                tags: orderNdkEvent.tags,
                sig: orderNdkEvent.sig,
            };
            const storedEvent = await nostrEventsModuleService.createOrderNostrEvents(eventData);
            logger.info(`[new-order-event.ts]: New order event stored: ${storedEvent.id}`);
            return new StepResponse();
        } catch (error) {
            logger.error(`[new-order-event.ts]: Failed to store order event: ${error}`);
            throw error;
        }
    }
)

const determineMessageTypeStep = createStep(
    "determine-message-type",
    async function (orderEvent: OrderEvent) {
        try {
            const subject = orderEvent.tags.find(tag => tag[0] === "subject")?.[1];

            return new StepResponse({
                messageType: subject,
            });
        } catch (error) {
            logger.error(`[new-order-event.ts]: Failed to determine message type: ${error}`);
            throw error;
        }
    }
)

const createCartStep = createStep(
    "create-cart",
    async function (orderEvent: OrderEvent, { container }) {
        try {
            const items = await Promise.all(orderEvent.tags
                .filter(tag => tag[0] === "item")
                .map(async tag => {
                    const productId = tag[1].split(":")[2].split("___")[0]
                    const variantId = tag[1].split(":")[2].split("___")[1]
                    const quantity = tag[2]

                    const prices = await getPricesWorkflow().run({ input: { variantId } })
                    console.log(">>>>>> Prices: ", prices)

                    return {
                        productId,
                        variantId,
                        quantity,
                        // prices
                    }
                })
            );

            let products: any[] = [];
            let missingProductIds: string[] = []; // If the product isn't found in the database, we'll need to fetch it from the relay pool
            for (let item of items) {
                const { result: productVariantResult } = await getProductVariantWorkflow().run({ input: { variantId: item.variantId } })
                const product = productVariantResult.variant;
                const { result: salesChannelsResult } = await getProductSalesChannelsWorkflow().run({ input: { productId: item.productId } })
                const salesChannels = salesChannelsResult.productSalesChannels;
                console.log(">>>>>>> Sales channels: ", salesChannels)

                // product["unit_price"] = item.prices[0] // TODO: Replace with real price
                product["unit_price"] = 123.45 // TODO: Replace with real price
                product["quantity"] = item.quantity

                if (product) products.push(product)
                else missingProductIds.push(item.productId)
            }
            if (missingProductIds.length > 0) {
                console.error(`[orderSubscriptionLoader]: Missing products: ${missingProductIds}`)
            }

            // TODO: If there are missing products, we need to fetch them from the relay pool
            // TODO: Include a special tag on the order that includes the item's complete event. If that info isn't present, do the lookup (for other clients)
            // TODO: Discuss with the RoundTable team : We should contain a full copy of the product event in the order event, so that we can process the order without needing to look up the product event from the relay pool.
            const addressString = orderEvent.tags.find(tag => tag[0] === "address")?.[1];
            let address: { address1: string, address2?: string, city: string, first_name: string, last_name: string, zip: string } | undefined;
            if (addressString) address = JSON.parse(addressString);

            const input: any = {
                currency_code: "sats",
                items: products
            };

            if (address) {
                input.shipping_address = {
                    address_1: address.address1,
                    address_2: address.address2,
                    city: address.city,
                    first_name: address.first_name,
                    last_name: address.last_name,
                    postal_code: address.zip,
                };
            }
            logger.info(`[orderSubscriptionLoader]: Creating cart for order...`)
            const cart = await createCartWorkflow(container).run({ input })

            logger.info(`[orderSubscriptionLoader]: Cart created: ${cart}`)

            return new StepResponse({
                cart,
            });
        } catch (error) {
            logger.error(`[new-order-event.ts]: Failed to create cart: ${error}`);
            throw error;
        }
    }
)

type WorkflowInput = {
    validatedOrderEvent: OrderEvent,
    orderNdkEvent: NDKEvent,
}

const newOrderEventWorkflow = createWorkflow(
    "new-order-event",
    function (input: WorkflowInput) {
        try {

            // TODO: RE-ENABLE THIS WHEN THE ORDER EVENT WORKFLOW IS READY
            // storeOrderEventStep(input.orderNdkEvent);

            const messageType = determineMessageTypeStep(input.validatedOrderEvent);

            const result = when(
                messageType,
                (messageType) => {
                    return messageType.messageType === "order-info"
                }
            ).then(() => {
                const createCartStepResult = createCartStep(input.validatedOrderEvent);
                return createCartStepResult
            })

            return new WorkflowResponse({
                success: true,
                message: "Order is stored in the database",
            });
        } catch (error) {
            logger.error("Product sync workflow failed:", error);
            throw error;
        }
    }
)

export default newOrderEventWorkflow;
function getProductSalesChannelsWorkflow() {
    throw new Error("Function not implemented.")
}
