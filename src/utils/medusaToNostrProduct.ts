export default function productToNostrProduct(product, stallId = "default-stall") {
    // Since the new schema doesn't have options, we'll create minimal specs
    const specs = [
        ["type", product.type || "standard"],
        ["handle", product.handle]
    ];

    // No images in new schema, initialize as empty array
    const images = [];

    // Simplified tags without categories
    const tags = [
        ["d", product.id] // Required d tag with product id
    ];

    // Add material as tag if it exists
    if (product.material) {
        tags.push(["t", product.material]);
    }

    // Construct the Nostr product event
    const nostrEvent = {
        kind: 30018,
        content: {
            id: product.id,
            stall_id: stallId,
            name: product.title,
            description: product.description || "",
            images: images,
            currency: "USD", // Maintaining USD as default
            price: 0, // Price still needs to be set separately
            quantity: null, // Quantity would need to be set separately
            specs: specs,
            shipping: [] // Maintaining empty shipping array
        },
        tags: tags
    };

    // Add any metadata as additional specs if it exists
    if (product.metadata) {
        Object.entries(product.metadata || {}).forEach(([key, value]) => {
            nostrEvent.content.specs.push([key, value.toString()]);
        });
    }

    return nostrEvent;
}

// Example usage with new schema:
// const product = {
//     "id": "prod_01JFS91PGW94GXBN9PZX8YRMPF",
//     "title": "Lightn.ng Roast",
//     "handle": "lightnng-roast",
//     "subtitle": "Roasty",
//     "description": null,
//     "material": null,
//     "metadata": null
// };
