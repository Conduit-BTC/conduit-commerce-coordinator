import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import syncProduct from "@/workflows/sync/sync-product"
import { AdminProduct } from "@medusajs/framework/types"
import { Product } from ".medusa/types/remote-query-entry-points"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { result } = await syncProduct(req.scope)
        .run({
            input: {
                product: req.body as Product
            },
        })

    res.send(result)
}
