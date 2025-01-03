import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import syncProductUpsert from "@/workflows/sync/sync-product-create"
import { Product } from ".medusa/types/remote-query-entry-points"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { result } = await syncProductUpsert(req.scope)
        .run({
            input: {
                product: req.body as Product
            },
        })

    res.send(result)
}
