import type {
    MedusaRequest,
    MedusaResponse
} from "@medusajs/framework/http";
import { createRelayWorkflow } from "@/workflows/create-relay";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {

    const url = "wss://localhost:7777"

    if (!url) {
        return res.status(400).send({
            message: "Missing required fields",
        });
    }

    const { result: relay } = await createRelayWorkflow(req.scope)
        .run({
            input: {
                url: url,
            },
        })

    res.json({
        relay,
    })
}

export const AUTHENTICATE = false
