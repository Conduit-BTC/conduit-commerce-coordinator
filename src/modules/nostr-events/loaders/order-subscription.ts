import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"
import { NostrEventQueue, QueueEvent } from "@/utils/NostrEventQueue"
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { sanitizeDecryptedMessage } from "@/utils/sanitizeDecryptedMessage"
import { getNdk } from "@/utils/NdkService"
import newOrderEventWorkflow from "@/workflows/order/store-order-event"
import NostrEventsModuleService from "@/modules/nostr-events/service"
import { NOSTR_EVENTS_MODULE } from "@/modules/nostr-events"
import checkOrderEventExistsWorkflow from "@/workflows/order/check-order-event-exists"

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

            logger.info(`[orderSubscriptionLoader]: Order processed: ${event.id}`)
            queue.confirmProcessed(queueEvent.id)

        } catch (error) {
            logger.error(`[orderSubscriptionLoader]: Something went wrong trying to process an order - ${error.message}`)
        }
    })
}
