import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import syncProduct from "@/workflows/sync/sync-product"
import { AdminProduct } from "@medusajs/framework/types"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { result } = await syncProduct(req.scope)
        .run({
            input: {
                product: req.body as AdminProduct
            },
        })

    res.send(result)
}
