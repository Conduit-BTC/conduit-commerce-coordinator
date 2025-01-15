import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"
import { NostrEventQueue, QueueEvent } from "@/utils/NostrEventQueue"
import { OrderEvent, validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { sanitizeDecryptedMessage } from "@/utils/sanitizeDecryptedMessage"
import { getNdk } from "@/utils/NdkService"
import checkOrderEventExistsWorkflow from "@/workflows/order/check-order-event-exists"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import newOrderEventWorkflow from "@/workflows/order/store-order-event"

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
            const content: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
            const contentJson: NDKEvent = JSON.parse(content)
            const sanitizedJson = sanitizeDecryptedMessage(contentJson.content)
            const order = validateOrderEvent(sanitizedJson)

            // TODO: Fix recent change to validateOrderEvent schema which includes additional cart item fields
            logger.info(`[orderSubscriptionLoader]: Validating order: ${JSON.stringify(order)}`)

            if (!order.success) {
                // We've determined this is not a valid order event, so we can clear it from the queue
                queue.confirmProcessed(queueEvent.id);
                return;
            }

            logger.info(`[orderSubscriptionLoader]: Processing order: ${event.id}`)

            // Store the Order event
            const { result: storeEventResult } = await newOrderEventWorkflow().run({ input: { orderEvent: serializeNDKEvent(event) as NDKEvent } })

            if (!storeEventResult.success) {
                logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${storeEventResult.message}`)
                queue.requeueEvent(queueEvent.id)
            }

            const { data }: { data: OrderEvent } = order

            if (data.type === 0) { // This is a CustomerOrder event
                logger.info(`[orderSubscriptionLoader]: Creating cart for order: ${JSON.stringify(data.items)}`)
                const cart = await createCartWorkflow.run({
                    input: {
                        currency_code: "sats",
                        shipping_address: {
                            address_1: data.address.address1,
                            address_2: data.address.address2,
                            city: data.address.city,
                            first_name: data.address.first_name,
                            last_name: data.address.last_name,
                            postal_code: data.address.zip,
                        },
                        items: data.items
                    }
                })

                logger.info(`[orderSubscriptionLoader]: Cart created: ${cart}`)

                // Create Order
            }
            logger.info(`[orderSubscriptionLoader]: Order processed: ${event.id}`)
            queue.confirmProcessed(queueEvent.id)

        } catch (error) {
            logger.error(`[orderSubscriptionLoader]: Something went wrong trying to process an order - ${error.message}`)
        }
    })
}
