import { NostrEvent } from "@/types/nostr"
import { NostrEventQueue, QueueEvent } from "@/utils/NostrEventQueue"
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import newOrderEventWorkflow from "@/workflows/order/process-nostr-order-event"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { NDKEvent, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"

export default async function processNostrOrderEventHandler({
    event: { data },
    container,
}: SubscriberArgs<{ queue: NostrEventQueue, signer: NDKPrivateKeySigner, nostrEvent: NostrEvent }>) {
    const logger = container.resolve("logger")
    const { signer, nostrEvent: event } = data

    console.log(">>>>>> Received order event: ", event)

    try {
        const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
        const sealJson = JSON.parse(seal)
        const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
        const rumorJson: NDKEvent = JSON.parse(rumor)
        const order = validateOrderEvent(rumorJson)

        console.log(">>>>>> Received order event: ", rumorJson)

        if (!order.success) return;

        const processOrderEventResult = await newOrderEventWorkflow(container).run({ input: { validatedOrderEvent: order.data, orderNdkEvent: serializeNDKEvent(event) as NDKEvent } })

        if (!processOrderEventResult.result.success) {
            logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${processOrderEventResult.result.message}`)
            return;
        }
        else {
            logger.info(`[orderSubscriptionLoader]: Order processed: ${event.id}`)
            return;
        }
    } catch (error) {
        logger.error(`[orderSubscriptionLoader]: Failed to process order event: ${error.message}`)
        return;
    }
}

export const config: SubscriberConfig = {
    event: `nostr.order.received`,
}
