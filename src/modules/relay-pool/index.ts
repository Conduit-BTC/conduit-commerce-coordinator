import RelayPoolModuleService from "./service";
import { Module } from "@medusajs/framework/utils";
import connectToRelaysLoader from "./loaders/connect-to-relays";

export const RELAY_POOL_MODULE = "relay-pool";

export default Module(RELAY_POOL_MODULE, {
    loaders: [connectToRelaysLoader],
    service: RelayPoolModuleService,
})
