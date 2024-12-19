import { z } from "zod";

const hexString = z.string()
    .refine(val => /^[0-9a-f]{62}$/i.test(val), {
        message: "Must be a 62-character hex string"
    });

const ContactSchema = z.object({
    nostr: hexString,
    phone: z.string().optional(),
    email: z.string().email().optional(),
});

const BaseOrderSchema = z.object({
    id: z.string(),
    type: z.literal(0),
    contact: ContactSchema,
});

const OptionalOrderFields = z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    message: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string(),
        quantity: z.number().int().positive(),
    })).optional(),
    shipping_id: z.string().optional(),
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
