import { z } from "zod";

const hexString = z.string()
    .refine(val => /^[0-9a-f]{64}$/i.test(val), {  // Updated to 64 characters
        message: "Must be a 64-character hex string"
    });

const ContactSchema = z.object({
    nostr: hexString,
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
});

// New Address Schema
const AddressSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    address1: z.string(),
    address2: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    special_instructions: z.string(),
});

const BaseOrderSchema = z.object({
    id: z.string(),
    type: z.literal(0),
    contact: ContactSchema,
});

const OptionalOrderFields = z.object({
    name: z.string().optional(),
    address: AddressSchema,  // Updated to use AddressSchema
    message: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string(),
        quantity: z.number().int().positive(),
    })),  // Made required since it appears in your data
    shipping_id: z.string(),  // Made required since it appears in your data
});

const CustomerOrderSchema = BaseOrderSchema.merge(OptionalOrderFields);

const PaymentOptionSchema = z.object({
    type: z.enum(["url", "btc", "ln", "lnurl"]),
    link: z.string()
});

const PaymentRequestSchema = z.object({
    id: z.string(),
    type: z.literal(1),
    message: z.string().optional(),
    payment_options: z.array(PaymentOptionSchema).min(1)
});

const OrderStatusSchema = z.object({
    id: z.string(),
    type: z.literal(2),
    message: z.string(),
    paid: z.boolean(),
    shipped: z.boolean()
});

const OrderEventSchema = z.discriminatedUnion("type", [
    CustomerOrderSchema,
    PaymentRequestSchema,
    OrderStatusSchema
]);

export const validateOrderEvent = (data: unknown) => {
    return OrderEventSchema.safeParse(data);
};
