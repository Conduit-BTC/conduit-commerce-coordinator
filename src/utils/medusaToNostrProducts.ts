import { Product } from ".medusa/types/remote-query-entry-points";

type ShippingTag = ['shipping', `30406:${string}:${string}`]; // Shipping method; follows addressable format of "30406:<pubkey>:<d-tag>"
type ShippingCollectionTag = ['shipping', `30405:${string}:${string}`]; // References to a product collection, in this case, shipping is inherited from the collection; follows addressable format of "30405:<pubkey>:<d-tag>"
type OptionalTag = string[] | ShippingTag | ShippingCollectionTag;

export type NostrProduct = {
    kind: 30402,
    tags: [
        ['d', string], // Medusa Product ID
        ['title', string],
        ['price', string, string], // ["price", <amount>, <currency>]
        ['type', string], // ["type", "simple" | "variable" | "variation"]
        ...([OptionalTag] | OptionalTag[]) // Additional optional tags (zero or more)
    ],
    content: string // Note to the Merchant
}

export default function medusaToNostrProducts(medusaProduct: Product, merchantPubkey: string): NostrProduct[] {
    const { images, description } = medusaProduct;

    if (!medusaProduct.variants.length) throw new Error(`[medusaToNostrProducts]: Product has no variants. Product ID: ${medusaProduct.id}`);

    let parentProductId: string = `${medusaProduct.id}:${medusaProduct.variants[0].id}`;

    const nostrEvents = medusaProduct.variants.map((variant, i) => {

        // @ts-expect-error - variant.price_sets is set when the relay sync is first initiated
        const priceSets = variant.price_sets;

        if (!priceSets?.length || !priceSets[0].prices?.length) throw new Error(`[medusaToNostrProducts]: Variant has no price sets. Product ID: ${medusaProduct.id} Variant ID: ${variant.id}`);

        // TODO: Handle multiple price sets and prices

        const price: number = priceSets[0].prices[0].amount;
        const currency: string = priceSets[0].prices[0].currency_code;

        let type = "simple";

        // If there is only one variant, create only one Product event with ["type": "simple"] tag
        // If there are 2 or more variants, create a "primary" product with ["type": "variable"], and additional products with ["type": "variation"] tag
        if (medusaProduct.variants.length > 1) type = i === 0 ? "variable" : "variation";

        const requiredTags: [['d', string], ['title', string], ['price', string, string], ['type', string]] = [
            ["d", `${medusaProduct.id}___${variant.id}`],
            ["title", medusaProduct.title],
            ["price", price.toString(), currency],
            ["type", type]
        ];

        const optionalTags: OptionalTag[] = [
            ...images.map(img => ["image", img.url] as OptionalTag),
            ["shipping", `30406:${merchantPubkey}:_TODO_`], // Shipping method; follows addressable format of "30406:<pubkey>:<d-tag>"
            ["ncc", "C3 - Conduit Commerce Coordinator"]
        ];

        if (i > 0) {
            optionalTags.push(["a", parentProductId]); // Reference to the parent product
        }

        const eventData: NostrProduct = {
            kind: 30402,
            content: description || "",
            tags: [...requiredTags, ...optionalTags]
        };

        return eventData;
    });

    return nostrEvents;
}
