import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"
import { NostrEventQueue, QueueEvent } from "@/utils/NostrEventQueue"
import { OrderEvent, validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { getNdk } from "@/utils/NdkService"
import checkOrderEventExistsWorkflow from "@/workflows/order/check-order-event-exists"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import getProductVariantWorkflow from "@/workflows/product/get-product-variant"
import getPricesWorkflow from "@/workflows/product/get-prices"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import getProductSalesChannelsWorkflow from "@/workflows/product/get-product-sales-channel"

function serializeNDKEvent(event: NDKEvent) {
    return {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind,
        content: event.content,
        tags: event.tags,
        sig: event.sig
    };
}

export default async function orderSubscriptionLoader({
    container,
}: LoaderOptions) {
    if (process.env.DISABLE_ORDER_FETCHING === 'true') return;

    const logger: Logger = container.resolve("logger")
    const query = container.resolve(ContainerRegistrationKeys.QUERY) // << This fails

    const queue = new NostrEventQueue(logger)

    const relayUrl = 'ws://localhost:7777'
    const pubkey = process.env.PUBKEY
    const privkey = process.env.PRIVKEY

    if (!pubkey || !privkey) {
        logger.error(`[orderSubscriptionLoader]: PUBKEY or PRIVKEY not found in .env`)
        return
    }

    const ndk = await getNdk();

    logger.info(`[orderSubscriptionLoader]: Listening to ${relayUrl} for NIP-17 DMs addressed to ${pubkey}`)

    // Set up subscription filter for NIP-17 DMs
    const filter: NDKFilter = {
        kinds: [1059 as NDKKind],
        '#p': [pubkey]
    }

    // Subscribe to events
    const subscription = ndk.subscribe(filter, { closeOnEose: false })
    const signer = new NDKPrivateKeySigner(privkey);

    subscription.on('event', async (event: NDKEvent) => {
        // TODO: Add a table of non-Order NIP-17 events to ignore early; currently only Order events are stored, meaning a whole load of repeated validation takes place for non-Order events
        const { result } = await checkOrderEventExistsWorkflow().run({ input: { orderEvent: serializeNDKEvent(event) as NDKEvent } })
        if (result.exists === true) return; // If event already exists in the database, skip processing
        const serializedEvent = serializeNDKEvent(event);
        queue.push(serializedEvent);
    })

    queue.on('processEvent', async (queueEvent: QueueEvent) => {
        const event = queueEvent.data;

        try {
            const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
            const sealJson = JSON.parse(seal)
            const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
            const rumorJson: NDKEvent = JSON.parse(rumor)
            const order = validateOrderEvent(rumorJson)

            // console.log(">>>>>> Received order event: ", rumorJson)

            if (!order.success) {
                // We've determined this is not a valid order event, so we can clear it from the queue
                queue.confirmProcessed(queueEvent.id);
                return;
            }

            logger.info(`[orderSubscriptionLoader]: Processing order: ${event.id}`)

            // Store the Order event
            // TODO: RE-ENABLE THIS WHEN THE ORDER EVENT WORKFLOW IS READY
            // const { result: storeEventResult } =
            //     await newOrderEventWorkflow(container).run({ input: { orderEvent: serializeNDKEvent(event) as NDKEvent } })

            // if (!storeEventResult.success) {
            //     logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${storeEventResult.message}`)
            //     queue.requeueEvent(queueEvent.id)
            // }

            const { data }: { data: OrderEvent } = order
            const subject = data.tags.find(tag => tag[0] === "subject")?.[1];

            if (subject === "order-info") { // This is a CustomerOrder event
                const items = await Promise.all(data.tags
                    .filter(tag => tag[0] === "item")
                    .map(async tag => {
                        const productId = tag[1].split(":")[2].split("___")[0]
                        const variantId = tag[1].split(":")[2].split("___")[1]
                        const quantity = tag[2]

                        const prices = await getPricesWorkflow(container).run({ input: { variantId } })
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
                    const { result: productVariantResult } = await getProductVariantWorkflow(container).run({ input: { variantId: item.variantId } })
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
                const addressString = data.tags.find(tag => tag[0] === "address")?.[1];
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

                // Create Order
            }
            logger.info(`[orderSubscriptionLoader]: Order processed: ${event.id}`)
            queue.confirmProcessed(queueEvent.id)

        } catch (error) {
            logger.error(`[orderSubscriptionLoader]: Something went wrong trying to process an order - ${error.message}`)
            console.error(error)
        }
    })
}
