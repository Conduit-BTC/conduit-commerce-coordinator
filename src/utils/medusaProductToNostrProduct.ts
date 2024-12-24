export default function medusaToNostrProduct(medusaProduct, stallId = "default-stall") {
    const specs = medusaProduct.options.map(option => {
        return [
            option.title?.toLowerCase(),
            option.values?.map(v => v.value).join(", ")
        ];
    });

    const images = medusaProduct.images.map(img => img.url);

    const tags = [
        ["d", medusaProduct.id], // Required d tag with product id
        ...medusaProduct.categories.map(cat => ["t", cat.handle])
    ];

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

// {
//   id: 'prod_01JFS91PGW94GXBN9PZX8YRMPF',
//   title: 'Lightn.ng Roast',
//   handle: 'lightning',
//   subtitle: 'Light Roast Coffee Beans',
//   description: 'De',
//   is_giftcard: false,
//   status: 'published',
//   thumbnail: null,
//   weight: null,
//   length: null,
//   height: null,
//   width: null,
//   origin_country: null,
//   hs_code: null,
//   mid_code: null,
//   material: null,
//   discountable: true,
//   external_id: null,
//   metadata: null,
//   type_id: null,
//   type: null,
//   collection_id: null,
//   collection: null,
//   created_at: '2024-12-23T08:09:59.520Z',
//   updated_at: '2024-12-23T08:09:59.520Z',
//   deleted_at: null,
//   variants: [
//     {
//       id: 'variant_01JFS91Q4WASB8YEWDG2SNXRAM',
//       title: 'Default variant',
//       sku: null,
//       barcode: null,
//       ean: null,
//       upc: null,
//       allow_backorder: false,
//       manage_inventory: false,
//       hs_code: null,
//       origin_country: null,
//       mid_code: null,
//       material: null,
//       weight: null,
//       length: null,
//       height: null,
//       width: null,
//       metadata: null,
//       variant_rank: 0,
//       product_id: 'prod_01JFS91PGW94GXBN9PZX8YRMPF',
//       created_at: '2024-12-23T08:10:00.221Z',
//       updated_at: '2024-12-23T08:10:00.221Z',
//       deleted_at: null
//     }
//   ],
//   options: [
//     {
//       id: 'opt_01JFS91Q16R0W301VPGBWQ4XZ5',
//       title: 'Default option',
//       metadata: null,
//       product_id: 'prod_01JFS91PGW94GXBN9PZX8YRMPF',
//       created_at: '2024-12-23T08:09:59.520Z',
//       updated_at: '2024-12-23T08:09:59.520Z',
//       deleted_at: null
//     }
//   ],
//   images: [
//     {
//       id: 'img_01JFVSWW5JJHRF5KGF3WMWGZ6Y',
//       url: 'http://localhost:9000/static/1735026176125-lightning-roast-label.png',
//       metadata: null,
//       rank: 0,
//       product_id: 'prod_01JFS91PGW94GXBN9PZX8YRMPF',
//       created_at: '2024-12-24T07:42:56.163Z',
//       updated_at: '2024-12-24T07:42:56.163Z',
//       deleted_at: null
//     }
//   ],
//   categories: []
// }
