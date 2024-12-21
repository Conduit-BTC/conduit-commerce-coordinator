// *

//  Arguments:
// - store

// Dependencies:
// - relays pools

// Steps:
// 0. Fetch all current Medusa products and convert them into Nostr event format
// 1. For each relay in relay pool, fetch current store's products
// 2. For each product in store, check if it exists in the relay pool
// 3. If it doesn't exist, post it to the relay pool
// 4. If it exists, but is different than current product, update it in the relay pool
// 5. If it exists and is the same as the current product, do nothing

// product ID = Product SKU

//
//
//
//
//
// * /

import {
    createStep, StepResponse, createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

const step1 = createStep(
    "step-1",
    async () => {
        return new StepResponse(`Hello from step one!`)
    }
)

type WorkflowInput = {
    name: string
}

const step2 = createStep(
    "step-2",
    async ({ name }: WorkflowInput) => {
        return new StepResponse(`Hello ${name} from step two!`)
    }
)

const syncProducts = createWorkflow(
    "hello-world",
    function (input: WorkflowInput) {
        const str1 = step1()
        const str2 = step2(input)

        return new WorkflowResponse({
            message: str2,
        })
    }
)

export default syncProducts
