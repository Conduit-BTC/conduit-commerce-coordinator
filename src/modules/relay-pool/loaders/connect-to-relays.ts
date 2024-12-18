import {
    LoaderOptions,
} from "@medusajs/framework/types"

import WebSocket from 'ws'

if (!global.WebSocket) {
    (global as any).WebSocket = WebSocket
}

export default async function connectToRelaysLoader({
    container,
}: LoaderOptions) {
    const logger = container.resolve("logger")
    const { NRelay1 } = await import('@nostrify/nostrify')

    const relay = new NRelay1('wss://relay.mostr.pub');
    for await (const msg of relay.req([{ kinds: [1, 6] }])) {
        if (msg[0] === 'EVENT') logger.info(JSON.stringify(msg[2]));
        if (msg[0] === 'EOSE') break;
    }

}
