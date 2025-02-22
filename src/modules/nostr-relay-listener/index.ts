import NostrEventsModuleService from "../nostr-events/service";
import { Module } from "@medusajs/framework/utils";
import orderSubscriptionLoader from "./loaders/nostr-relay-listener-loader";

export const NOSTR_RELAY_LISTENER_MODULE = "nostr-relay-listener";

export default Module(NOSTR_RELAY_LISTENER_MODULE, {
    service: NostrEventsModuleService,
    loaders: [orderSubscriptionLoader],
})
