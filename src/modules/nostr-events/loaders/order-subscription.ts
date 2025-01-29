import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"
import { NostrEventQueue, QueueEvent } from "@/utils/NostrEventQueue"
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { getNdk } from "@/utils/NdkService"
import checkOrderEventExistsWorkflow from "@/workflows/order/check-order-event-exists"
import newOrderEventWorkflow from "@/workflows/order/process-nostr-order-event"

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
                queue.confirmProcessed(queueEvent.id); // We've determined this is not a valid order event, so we can clear it from the queue
                return;
            }

            const processOrderEventResult = await newOrderEventWorkflow(container).run({ input: { validatedOrderEvent: order.data, orderNdkEvent: serializeNDKEvent(event) as NDKEvent } })

            if (!processOrderEventResult.success) {
                logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${processOrderEventResult.message}`)
                queue.requeueEvent(queueEvent.id)
                return;
            }
            else {
                logger.info(`[orderSubscriptionLoader]: Order processed: ${event.id}`)
                queue.confirmProcessed(queueEvent.id)
                return;
            }
        } catch (error) {
            logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${error.message}`)
            queue.requeueEvent(queueEvent.id)
            return;
        }
    })
}
