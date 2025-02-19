import { Message } from "@medusajs/framework/types";
import { AbstractEventBusModuleService } from "@medusajs/framework/utils";

export const NOSTR_ORDER_RECEIVED_EVENT = "nostr.order.received";

class NostrOrderEventReceivedService extends AbstractEventBusModuleService {
    async emit<T>(data: Message<T> | Message<T>[], options: Record<string, unknown>): Promise<void> {
        const events = Array.isArray(data) ? data : [data]
        for (const event of events) {
            console.log(`Received the event ${event.name} with data ${event.data}`)
            if (event.name === NOSTR_ORDER_RECEIVED_EVENT) {
                console.log("Processing the Nostr order received event")
            }
        }
    }
    async releaseGroupedEvents(_: string): Promise<void> { throw new Error("Method not implemented.") }
    async clearGroupedEvents(_: string): Promise<void> { throw new Error("Method not implemented.") }
}

export default NostrOrderEventReceivedService;
