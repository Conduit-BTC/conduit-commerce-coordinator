import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import WebSocket from 'ws'
import { NostrEventQueue } from "@/utils/NostrEventQueue"
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema"
import { sanitizeDecryptedMessage } from "@/utils/sanitizeDecryptedMessage";

if (!global.WebSocket) {
    (global as any).WebSocket = WebSocket
}

export default async function connectToRelaysLoader({
    container,
}: LoaderOptions) {
    if (process.env.DISABLE_WEBSOCKETS === 'true' || process.env.DISABLE_ORDER_FETCHING === 'true') return;

    const logger: Logger = container.resolve("logger")
    const { NRelay1, NSchema: n } = await import('@nostrify/nostrify')
    const { decrypt: nostrDecrypt } = await import('nostr-tools/nip04');

    const queue = new NostrEventQueue(logger)

    queue.on('processEvent', async (event) => {
        try {
            logger.info('[NostrEventQueue]: Processing event: ' + JSON.stringify(event))
            // Trigger workflow
            // const workflowService = container.resolve("workflowService")
            // await workflowService.trigger("nostr-event", {
            //     event_data: event,
            // })
        } catch (error) {
            logger.error(`Failed to trigger workflow: ${error}`)
        }
    })

    const url = 'ws://localhost:7777';
    const pubkey = process.env.PUBKEY;
    const privkey = process.env.PRIVKEY;

    if (!pubkey || !privkey) {
        logger.error(`[connectToRelays]: PUBKEY or PRIVKEY not found in .env`)
        return
    }

    const relay = new NRelay1(url);

    logger.info(`[connectToRelays]: Listening to ${url} for NIP-04 DMs addressed to ${pubkey}`)

    // NIP-04 DMs
    for await (const msg of relay.req([{ kinds: [4], '#p': [pubkey] }])) {
        if (msg[0] === 'EVENT') {
            try {
                if (!n.relayEVENT().safeParse(msg).success) return;

                const event = msg[2];
                const decrypted = await nostrDecrypt(
                    privkey,
                    event.pubkey,
                    event.content
                );

                const sanitized = sanitizeDecryptedMessage(decrypted);

                try {
                    const parsed = JSON.parse(sanitized);
                    const order = validateOrderEvent(parsed);

                    if (!order.success) return;

                    queue.push(order.data);
                } catch (_) {
                    return;
                }
            } catch (error) {
                logger.error('[connectToRelays] - Event Processing error:', error);
            }
        };
    }
}
