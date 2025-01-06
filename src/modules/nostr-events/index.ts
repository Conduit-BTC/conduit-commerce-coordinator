import orderSubscriptionLoader from "./loaders/order-subscription";
import NostrEventsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const NOSTR_EVENTS_MODULE = "nostr-events";

export default Module(NOSTR_EVENTS_MODULE, {
    loaders: [orderSubscriptionLoader],
    service: NostrEventsModuleService,
})
