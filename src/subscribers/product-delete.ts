import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import syncProductDelete from "../workflows/sync/sync-product-delete"

export default async function productDeletedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    const productId = data.id;

    logger.info(`Product deleted: ${productId}`)

    await syncProductDelete(container)
        .run({
            input: {
                productId
            },
        })
}

export const config: SubscriberConfig = {
    event: ["product.deleted"],
}
