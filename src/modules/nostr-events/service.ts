import { MedusaService } from "@medusajs/framework/utils";
import ProductNostrEvent from "./models/product-nostr-event";

class NostrEventsModuleService extends MedusaService({
    ProductNostrEvent,
}) { }

export default NostrEventsModuleService;
