import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { DEFAULT_ENCRYPTION_SCHEME, NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk"
import { NostrEventQueue } from "@/utils/NostrEventQueue"
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { sanitizeDecryptedMessage } from "@/utils/sanitizeDecryptedMessage"
import { getNdk } from "@/utils/NdkService"

export default async function orderSubscriptionLoader({
    container,
}: LoaderOptions) {
    if (process.env.DISABLE_ORDER_FETCHING === 'true') return;

    const logger: Logger = container.resolve("logger")
    const queue = new NostrEventQueue(logger)

    queue.on('processEvent', async (event) => {
        try {
            logger.info('[NostrEventQueue]: Processing event: ' + JSON.stringify(event))
            // Check if event is already processed. If so, return
            // Store event in database,
            // Trigger order generation workflow
            // const workflowService = container.resolve("workflowService")
            // await workflowService.trigger("nostr-event", {
            //     event_data: event,
            // })
        } catch (error) {
            logger.error(`Failed to trigger workflow: ${error}`)
        }
    })

    const relayUrl = 'ws://localhost:7777'
    const pubkey = process.env.PUBKEY
    const privkey = process.env.PRIVKEY

    if (!pubkey || !privkey) {
        logger.error(`[orderSubscriptionLoader]: PUBKEY or PRIVKEY not found in .env`)
        return
    }

    // Initialize NDK with relay
    const ndk = await getNdk();

    logger.info(`[orderSubscriptionLoader]: Listening to ${relayUrl} for NIP-04 DMs addressed to ${pubkey}`)

    // Set up subscription filter for NIP-17 DMs
    const filter: NDKFilter = {
        kinds: [1059 as NDKKind],
        '#p': [pubkey]
    }

    // Subscribe to events
    const subscription = ndk.subscribe(filter, { closeOnEose: false })
    const signer = new NDKPrivateKeySigner(privkey);

    subscription.on('event', async (event: NDKEvent) => {
        try {
            const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
            const sealJson = JSON.parse(seal)
            const content: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
            const contentJson: NDKEvent = JSON.parse(content)
            const sanitizedJson = sanitizeDecryptedMessage(contentJson.content)

            try {
                const order = validateOrderEvent(sanitizedJson)
                if (!order.success) return
                queue.push(order.data)
            } catch (_) {
                return
            }
        } catch (error) {
            logger.error('[orderSubscriptionLoader] - Event Processing error:', error)
        }
    })
}
