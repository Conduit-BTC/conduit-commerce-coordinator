import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import syncProductUpdate from "../workflows/sync/sync-product-update"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    const query = container.resolve("query")

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["*", "images.*", "variants.*", "options.*", "categories.*"],
        filters: {
            id: data.id,
        },
    })

    const product = products[0]

    if (!product) {
        logger.error(`[subscriber:product-updated] Product not found: ${data.id}`)
        return
    }

    await syncProductUpdate(container)
        .run({
            input: {
                product
            },
        })
}

export const config: SubscriberConfig = {
    event: ["product.updated"],
}
