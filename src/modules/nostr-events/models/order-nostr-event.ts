import { model } from '@medusajs/framework/utils';

const OrderNostrEvent = model.define("order_nostr_event", {
    id: model.text().primaryKey(), // 32-byte hex-encoded sha256
    pubkey: model.text().searchable(), // 32-byte hex-encoded public key
    kind: model.number(), // Integer between 0 and 65535
    tags: model.array(), // Array of arrays of strings
    content: model.text().searchable(), // Arbitrary string
    sig: model.text(), // 64-byte hex signature
});

export default OrderNostrEvent;
