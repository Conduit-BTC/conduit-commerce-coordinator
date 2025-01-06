import { MedusaService } from "@medusajs/framework/utils";
import ProductNostrEvent from "./models/product-nostr-event";
import OrderNostrEvent from "./models/order-nostr-event";

class NostrEventsModuleService extends MedusaService({
    ProductNostrEvent,
    OrderNostrEvent
}) { }

export default NostrEventsModuleService;
