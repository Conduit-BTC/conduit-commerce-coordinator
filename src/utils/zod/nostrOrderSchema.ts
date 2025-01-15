import { z } from "zod";

export type CustomerOrder = z.infer<typeof CustomerOrderSchema>
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>
export type OrderStatus = z.infer<typeof OrderStatusSchema>
export type OrderEvent = z.infer<typeof OrderEventSchema>

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

const CustomerOrderSchema = z.object({
    id: z.string(),
    type: z.literal(0),
    contact: ContactSchema,
    items: z.array(z.object({
        title: z.string(),
        unit_price: z.number().positive(),
        product_id: z.string(),
        quantity: z.number().int().positive(),
    })),
    address: AddressSchema,
    shipping_id: z.string(),
    name: z.string().optional(),
    message: z.string().optional(),
});

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
