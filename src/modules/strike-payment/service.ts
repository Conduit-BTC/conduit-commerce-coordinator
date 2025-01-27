import {
    AbstractPaymentProvider,
    PaymentActions,
    PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
    CreatePaymentProviderSession,
    PaymentMethodResponse,
    PaymentProviderContext,
    PaymentProviderError,
    PaymentProviderSessionResponse,
    PaymentSessionStatus as MedusaPaymentSessionStatus,
    UpdatePaymentProviderSession,
    Logger,
    WebhookActionResult
} from "@medusajs/framework/types"

type StrikeOptions = {
    apiKey: string
    apiUrl?: string
}

type StrikeInvoiceResponse = {
    invoiceId: string
    amount: {
        amount: string
        currency: string
    }
    state: "UNPAID" | "PAID"
    created: string
    correlationId?: string
    description?: string
    issuerId: string
    receiverId: string
}

type StrikeQuoteResponse = {
    quoteId: string
    lnInvoice: string
    expiration: string
    sourceAmount: {
        amount: string
        currency: string
    }
    targetAmount: {
        amount: string
        currency: string
    }
}

class StrikePaymentProviderService extends AbstractPaymentProvider<StrikeOptions> {
    static identifier = "strike-payment"
    protected readonly options_: StrikeOptions
    protected readonly logger_: Logger

    constructor(
        container: { logger: Logger },
        options: StrikeOptions
    ) {
        super(container, options)
        this.options_ = options
        this.logger_ = container.logger
    }

    // Helper method to make requests to Strike API
    private async strikeRequest(
        endpoint: string,
        method: string = "GET",
        body?: Record<string, unknown>
    ): Promise<any> {
        const baseUrl = this.options_.apiUrl || "https://api.strike.me/v1"
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${this.options_.apiKey}`,
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : undefined
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || "Strike API request failed")
        }

        return await response.json()
    }

    async initiatePayment(
        context: CreatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        try {
            // Create Strike invoice
            const invoice: StrikeInvoiceResponse = await this.strikeRequest("/invoices", "POST", {
                correlationId: context.context.session_id,
                description: `Order ${context.context.session_id}`,
                amount: {
                    currency: context.currency_code.toUpperCase(),
                    amount: context.amount.toString()
                }
            })

            // Generate quote for the invoice
            const quote: StrikeQuoteResponse = await this.strikeRequest(
                `/invoices/${invoice.invoiceId}/quote`,
                "POST"
            )

            return {
                data: {
                    invoice_id: invoice.invoiceId,
                    quote_id: quote.quoteId,
                    lightning_invoice: quote.lnInvoice,
                    expires_at: quote.expiration
                }
            }
        } catch (error) {
            return {
                error: error.message,
                code: "strike_error",
                detail: error
            }
        }
    }

    async authorizePayment(
        paymentSessionData: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<
        PaymentProviderError | {
            status: PaymentSessionStatus
            data: PaymentProviderSessionResponse["data"]
        }
    > {
        try {
            const invoice: StrikeInvoiceResponse = await this.strikeRequest(
                `/invoices/${paymentSessionData.invoice_id}`
            )

            if (invoice.state === "PAID") {
                return {
                    status: PaymentSessionStatus.AUTHORIZED,
                    data: {
                        ...paymentSessionData,
                        strike_payment_id: invoice.invoiceId
                    }
                }
            }

            // Check if quote is expired
            const now = new Date()
            const expiresAt = new Date(paymentSessionData.expires_at as string)
            if (now > expiresAt) {
                return {
                    status: PaymentSessionStatus.PENDING,
                    data: {
                        ...paymentSessionData,
                        requires_more_action: true,
                        error: "Lightning invoice expired"
                    }
                }
            }

            return {
                status: PaymentSessionStatus.PENDING,
                data: paymentSessionData
            }
        } catch (error) {
            return {
                error: error.message,
                code: "strike_error",
                detail: error
            }
        }
    }

    async capturePayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        // Strike payments are captured automatically when paid
        return paymentData
    }

    async cancelPayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        // Lightning invoices automatically expire, no need to cancel
        return paymentData
    }

    async deletePayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        // Can't delete Lightning invoices, they just expire
        return paymentData
    }

    async getPaymentStatus(
        paymentData: Record<string, unknown>
    ): Promise<PaymentSessionStatus> {
        try {
            const invoice: StrikeInvoiceResponse = await this.strikeRequest(
                `/invoices/${paymentData.invoice_id}`
            )

            switch (invoice.state) {
                case "PAID":
                    return PaymentSessionStatus.CAPTURED;
                case "UNPAID":
                    // Check if expired
                    const now = new Date()
                    const expiresAt = new Date(paymentData.expires_at as string)
                    if (now > expiresAt) {
                        return PaymentSessionStatus.CANCELED;
                    }
                    return PaymentSessionStatus.PENDING
                default:
                    return PaymentSessionStatus.PENDING
            }
        } catch (error) {
            return PaymentSessionStatus.ERROR
        }
    }

    async refundPayment(
        _: Record<string, unknown>,
        __: number
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        return {
            error: "Refunds are not supported for Lightning payments",
            code: "unsupported_operation",
            detail: "Lightning payments cannot be refunded. Please arrange an alternative refund method."
        }
    }

    async retrievePayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        try {
            const invoice: StrikeInvoiceResponse = await this.strikeRequest(
                `/invoices/${paymentData.invoice_id}`
            )

            return {
                id: invoice.invoiceId,
                ...paymentData,
                status: invoice.state
            }
        } catch (error) {
            return {
                error: error.message,
                code: "strike_error",
                detail: error
            }
        }
    }

    async updatePayment(
        context: UpdatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const { amount, currency_code } = context

        try {
            // Create new invoice with updated amount
            const invoice: StrikeInvoiceResponse = await this.strikeRequest("/invoices", "POST", {
                correlationId: context.context.session_id,
                description: `Updated order ${context.context.session_id}`,
                amount: {
                    currency: currency_code.toUpperCase(),
                    amount: amount.toString()
                }
            })

            // Generate new quote
            const quote: StrikeQuoteResponse = await this.strikeRequest(
                `/invoices/${invoice.invoiceId}/quote`,
                "POST"
            )

            return {
                data: {
                    invoice_id: invoice.invoiceId,
                    quote_id: quote.quoteId,
                    lightning_invoice: quote.lnInvoice,
                    expires_at: quote.expiration
                }
            }
        } catch (error) {
            return {
                error: error.message,
                code: "strike_error",
                detail: error
            }
        }
    }

    async listPaymentMethods(
        context: PaymentProviderContext
    ): Promise<PaymentMethodResponse[]> {
        // Strike Lightning payments don't have saved payment methods
        return []
    }

    async getWebhookActionAndData(
        payload: { data: Record<string, unknown>; rawData: string | Buffer; headers: Record<string, unknown> }
    ): Promise<WebhookActionResult> {
        const eventData = payload.data as {
            eventType: string;
            entityId: string;
            changes: string[]
        }

        if (eventData.eventType === "invoice.updated") {
            try {
                const invoice: StrikeInvoiceResponse = await this.strikeRequest(
                    `/invoices/${eventData.entityId}`
                )

                if (invoice.state === "PAID") {
                    return {
                        action: PaymentActions.SUCCESSFUL,
                        data: {
                            session_id: invoice.invoiceId,
                            amount: Number(invoice.amount.amount)
                        }
                    }
                }
            } catch (error) {
                this.logger_.error("Error processing Strike webhook: " + error.message)
            }
        }

        return {
            action: PaymentActions.NOT_SUPPORTED
        }
    }
}

export default StrikePaymentProviderService
