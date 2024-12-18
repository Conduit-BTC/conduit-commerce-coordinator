import RelayPoolModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const RELAY_POOL_MODULE = "relay-pool";

export default Module(RELAY_POOL_MODULE, {
    service: RelayPoolModuleService,
})
