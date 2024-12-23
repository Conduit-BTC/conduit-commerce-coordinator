export default function medusaToNostrProduct(medusaProduct, stallId = "default-stall") {
    // Convert product options into specs format
    const specs = medusaProduct.options.map(option => {
        return [
            option.title.toLowerCase(),
            option.values.map(v => v.value).join(", ")
        ];
    });

    // Extract image URLs
    const images = medusaProduct.images.map(img => img.url);

    // Map categories to tags
    const tags = [
        ["d", medusaProduct.id], // Required d tag with product id
        ...medusaProduct.categories.map(cat => ["t", cat.handle])
    ];

    // Construct the Nostr product event
    const nostrEvent = {
        kind: 30018,
        content: {
            id: medusaProduct.id,
            stall_id: stallId,
            name: medusaProduct.title,
            description: medusaProduct.description,
            images: images,
            currency: "USD", // Assuming USD as default since not specified in Medusa product
            price: 0, // Price needs to be set separately as it's not in the base product
            quantity: null, // Quantity would need to be calculated from variants
            specs: specs,
            // Shipping would need to be added separately as it's not in the Medusa product
            shipping: []
        },
        tags: tags
    };

    return nostrEvent;
}

// Example usage:
// const medusaProduct = {
//     "id": "prod_01JFBVVFKV2JB6X33RRG34928Z",
//     "title": "Medusa T-Shirt",
//     "description": "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
//     "options": [
//         {
//             "title": "Color",
//             "values": [
//                 { "value": "Black" },
//                 { "value": "White" }
//             ]
//         },
//         {
//             "title": "Size",
//             "values": [
//                 { "value": "S" },
//                 { "value": "M" },
//                 { "value": "L" },
//                 { "value": "XL" }
//             ]
//         }
//     ],
//     "images": [
//         {
//             "url": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png"
//         },
//         // ... other images
//     ],
//     "categories": [
//         {
//             "handle": "shirts",
//             "name": "Shirts"
//         }
//     ]
// };
