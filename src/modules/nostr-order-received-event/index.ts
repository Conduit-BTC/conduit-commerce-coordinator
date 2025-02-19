import NostrEventsModuleService from "../nostr-events/service";
import { Module } from "@medusajs/framework/utils";
import orderSubscriptionLoader from "./loaders/order-subscription-loader";

export default Module("nostr-order-received-event", {
    service: NostrEventsModuleService,
    loaders: [orderSubscriptionLoader],
})
