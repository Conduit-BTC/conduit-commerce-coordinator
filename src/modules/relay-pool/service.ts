import { MedusaService } from "@medusajs/framework/utils";
import Relay from "./models/relay";

class RelayPoolModuleService extends MedusaService({
    Relay,
}) { }

export default RelayPoolModuleService;
