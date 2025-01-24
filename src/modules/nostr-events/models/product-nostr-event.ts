import { model } from '@medusajs/framework/utils';

const ProductNostrEvent = model.define("product_nostr_event", {
    medusaVariantId: model.text().primaryKey(),
    medusaProductId: model.text(),
    id: model.text(), // 32-byte hex-encoded sha256
    pubkey: model.text().searchable(), // 32-byte hex-encoded public key
    kind: model.number(), // Integer between 0 and 65535
    tags: model.array(), // Array of arrays of strings
    content: model.text().searchable(), // Arbitrary string
    sig: model.text(), // 64-byte hex signature
});

export default ProductNostrEvent;
