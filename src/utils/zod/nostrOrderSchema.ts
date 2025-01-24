import { z } from "zod";

// Basic validation helpers
const hexString = z.string()
    .refine(val => /^[0-9a-f]{64}$/i.test(val), {
        message: "Must be a 64-character hex string"
    });

const addressableFormat = z.string()
    .refine(val => /^\d+:[0-9a-f]{64}:[a-zA-Z0-9_-]+$/i.test(val), {
        message: "Must follow format: <kind>:<pubkey>:<d-tag>"
    });

// Item Tag Schema
const ItemTagSchema = z.tuple([
    z.literal("item"),
    addressableFormat.refine(val => val.startsWith("30402:"), {
        message: "Item reference must start with 30402:"
    }),
    z.number().int().positive()
]);

// Shipping Tag Schema
const ShippingTagSchema = z.tuple([
    z.literal("shipping"),
    addressableFormat.refine(val => val.startsWith("30406:"), {
        message: "Shipping reference must start with 30406:"
    })
]);

// Optional Contact Tags Schema
const ContactTagSchema = z.union([
    z.tuple([z.literal("address"), z.string()]),
    z.tuple([z.literal("phone"), z.string()]),
    z.tuple([z.literal("email"), z.string().email()])
]);

// Complete Order Message Schema
export const OrderMessageSchema = z.object({
    kind: z.literal(15),
    tags: z.array(
        z.union([
            // Required tags
            z.tuple([z.literal("p"), hexString]),
            z.tuple([z.literal("subject"), z.literal("order-info")]),
            z.tuple([z.literal("order"), z.string().uuid()]),
            ItemTagSchema,
            ShippingTagSchema,
            // Optional contact tags
            ContactTagSchema
        ])
    ).refine(
        (tags) => {
            // Verify required tags are present
            const hasRequiredTags =
                tags.some(tag => tag[0] === "p") &&
                tags.some(tag => tag[0] === "subject" && tag[1] === "order-info") &&
                tags.some(tag => tag[0] === "order") &&
                tags.some(tag => tag[0] === "item")
            // tags.some(tag => tag[0] === "shipping"); // TODO: Uncomment when shipping is required
            return hasRequiredTags;
        },
        {
            message: "Missing required tags: p, subject, order, item, and shipping"
        }
    ),
    content: z.string()
});

// Helper type for TypeScript
export type OrderEvent = z.infer<typeof OrderMessageSchema>;

// Validation function
export const validateOrderEvent = (data: unknown) => {
    return OrderMessageSchema.safeParse(data);
};

// Example usage:
/*
const orderData = {
    kind: 15,
    tags: [
        ["p", "1234..."], // merchant pubkey
        ["subject", "order-info"],
        ["order", "123e4567-e89b-12d3-a456-426614174000"],
        ["item", "30402:abcd...:product-1", 2],
        ["shipping", "30406:efgh...:standard"],
        ["address", "123 Main St"],
        ["email", "customer@example.com"]
    ],
    content: "[Conduit Market Client] - [Order] - Please gift wrap"
};

const result = validateOrderMessage(orderData);
if (result.success) {
    // TypeScript knows this is an OrderMessage
    const order: OrderMessage = result.data;
} else {
    console.error(result.error);
}
*/
