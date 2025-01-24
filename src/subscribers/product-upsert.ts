import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import syncProductCreate from "@/workflows/sync/sync-product-upsert"

export default async function productCreatedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    const query = container.resolve("query")

    // TODO: Increase safety for each step of the workflow

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["*", "images.*", "variants.*", "options.*", "categories.*"],
        filters: {
            id: data.id,
        },
    })

    const product = products[0]

    if (!product) {
        logger.error(`[subscriber:product-created] Product not found: ${data.id}`)
        return
    }

    // Create a new Product for each Variant.

    const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["*"],
        filters: {
            product_id: product.id as unknown as undefined, // Because, TypeScript...
        },
    })

    const { data: productVariantPriceSets } = await query.graph({
        entity: "product_variant_price_set",
        fields: ["*"],
        filters: {
            variant_id: variants.map((variant) => variant.id)
        }
    })

    const { data: priceSets } = await query.graph({
        entity: "price_set",
        fields: ["*"],
        filters: {
            id: productVariantPriceSets.map((priceSet) => priceSet.price_set_id)
        }
    })

    const { data: prices } = await query.graph({
        entity: "price",
        fields: ["*"],
        filters: {
            price_set_id: priceSets.map((priceSet) => priceSet.id)
        }
    })

    // Attach priceSets to variants
    // product.variants[x].id <- variants[x].product_id
    // variants[x].id <- productVariantPriceSets[x].variant_id
    // productVariantPriceSets.price_set_id <- priceSets[x].id
    // prices[x].price_set_id <- priceSets[x].id

    // When complete: product.variants[].price_sets[].prices[]

    // Create a map of price set IDs to their prices
    const priceSetPricesMap = prices.reduce((acc, price) => {
        if (!acc[price.price_set_id]) {
            acc[price.price_set_id] = [];
        }
        acc[price.price_set_id].push(price);
        return acc;
    }, {});

    // Create a map of variant IDs to their price sets
    const variantPriceSetsMap = productVariantPriceSets.reduce((acc, pvps) => {
        if (!acc[pvps.variant_id]) {
            acc[pvps.variant_id] = [];
        }
        acc[pvps.variant_id].push(pvps.price_set_id);
        return acc;
    }, {});

    // Create a map of price set IDs to price set objects with attached prices
    const priceSetsMap = priceSets.reduce((acc, priceSet) => {
        acc[priceSet.id] = {
            ...priceSet,
            prices: priceSetPricesMap[priceSet.id] || []
        };
        return acc;
    }, {});

    // Attach price sets (with prices) to each variant in the product
    product.variants = product.variants.map(variant => {
        const variantFromQuery = variants.find(v => v.id === variant.id);
        if (!variantFromQuery) return variant;

        const priceSetIds = variantPriceSetsMap[variantFromQuery.id] || [];
        const attachedPriceSets = priceSetIds.map(psId => priceSetsMap[psId]).filter(Boolean);

        return {
            ...variant,
            price_sets: attachedPriceSets
        };
    });

    await syncProductCreate(container)
        .run({
            input: {
                product,
            },
        })
}

export const config: SubscriberConfig = {
    event: ["product.created", "product.updated"],
}
