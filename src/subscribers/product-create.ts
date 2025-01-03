import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import syncProductCreate from "@/workflows/sync/sync-product-create"

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
        logger.error(`[subscriber:product-created] Product not found: ${data.id}`)
        return
    }

    await syncProductCreate(container)
        .run({
            input: {
                product
            },
        })
}

export const config: SubscriberConfig = {
    event: ["product.created"],
}
