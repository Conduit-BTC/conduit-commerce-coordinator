import { Product } from ".medusa/types/remote-query-entry-points";

type ShippingTag = ['shipping', `30406:${string}:${string}`]; // Shipping method; follows addressable format of "30406:<pubkey>:<d-tag>"
type ShippingCollectionTag = ['shipping', `30405:${string}:${string}`]; // References to a product collection, in this case, shipping is inherited from the collection; follows addressable format of "30405:<pubkey>:<d-tag>"
type OptionalTag = string[] | ShippingTag | ShippingCollectionTag;

type NostrProduct = {
    kind: 30402,
    tags: [
        ['d', string], // Medusa Product ID
        ['title', string],
        ['price', string, string], // ["price", <amount>, <currency>]
        ...([OptionalTag] | OptionalTag[]) // Additional optional tags (zero or more)
    ],
    content: string // Note to the Merchant
}

export default function medusaToNostrProduct(medusaProduct: Product): NostrProduct {
    const { images, description } = medusaProduct;

    const requiredTags: [['d', string], ['title', string], ['price', string, string]] = [
        ["d", medusaProduct.id],
        ["title", medusaProduct.title],
        ["price", "123.45", "USD"] // TODO: Replace with actual price from the Pricing Module
    ];

    const optionalTags: OptionalTag[] = [
        ...images.map(img => ["image", img.url] as OptionalTag)
    ];

    const nostrEvent: NostrProduct = {
        kind: 30402,
        content: description || "",
        tags: [...requiredTags, ...optionalTags]
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
