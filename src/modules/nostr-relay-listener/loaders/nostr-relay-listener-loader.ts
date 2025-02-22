import emitNewOrderEventWorkflow from "@/workflows/order/emit-new-order-event"
import {
    LoaderOptions,
    Logger,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import LocalEventBusModule from "@medusajs/medusa/event-bus-local"

export default async function orderSubscriptionLoader({
    container,
}: LoaderOptions) {
    const logger: Logger = container.resolve("logger")
    emitNewOrderEventWorkflow.run({ input: { data: "test" } })


    // console.log(eventBusService)
}


// function serializeNDKEvent(event: NDKEvent): NostrEvent {
//     return {
//         id: event.id,
//         pubkey: event.pubkey,
//         created_at: event.created_at || new Date().getTime(),
//         kind: event.kind,
//         content: event.content,
//         tags: event.tags,
//         sig: event.sig
//     };
// }

// console.log(">>>>>> orderSubscriptionLoader")
// if (process.env.DISABLE_ORDER_FETCHING === 'true') return;

// const pubkey = process.env.PUBKEY
// const privkey = process.env.PRIVKEY

// if (!pubkey || !privkey) {
//     logger.error(`[orderSubscriptionLoader]: PUBKEY or PRIVKEY not found in .env`)
//     return
// }

// const ndk = await getNdk();

// logger.info(`[orderSubscriptionLoader]: Listening for NIP-17 DMs addressed to ${pubkey}`)

// // Set up subscription filter for NIP-17 DMs
// const filter: NDKFilter = {
//     kinds: [1059 as NDKKind],
//     '#p': [pubkey]
// }

// // Subscribe to events
// const subscription = ndk.subscribe(filter, { closeOnEose: false })
// const signer = new NDKPrivateKeySigner(privkey);

// subscription.on('event', async (event: NDKEvent) => {
//     // TODO: Add a table of non-Order NIP-17 events to ignore early; currently only Order events are stored, meaning a whole load of repeated validation takes place for non-Order events
//     const { result } = await checkOrderEventExistsWorkflow().run({ input: { orderEvent: serializeNDKEvent(event) as NDKEvent } })
//     if (result.exists === true) return; // If event already exists in the database, skip processing
//     const serializedEvent: NostrEvent = serializeNDKEvent(event);

//     console.log(">>>>>> Emitting event: ")
//     // TODO: This is causing a wild amount of repeated validation for non-Order events; need to add a table of non-Order NIP-17 events to ignore early
//     var start = new Date().getTime();
//     var end = start;
//     while (end < start + 500) {
//         end = new Date().getTime();
//     }

//     const eventData = {
//         signer: signer,
//         nostrEvent: serializedEvent
//     }


//     // EMIT EVENT
//     const nostrEventsModuleService: NostrOrderEventReceivedService = container.resolve("nostrEventsModuleService")
//     nostrEventsModuleService.emit(eventData, {});
// })
