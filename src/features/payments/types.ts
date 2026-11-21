/**
 * PAYMENT ARCHITECTURE (not yet active — no payment processing is performed).
 *
 * Planned Razorpay flow, kept separate from registration logic:
 *
 *  1. Client  → Edge Function `payments-create-order` with { registrationId }.
 *     Server looks up the fee (never trusts a client-sent amount), creates a
 *     Razorpay order with the KEY SECRET, and inserts a `payment_transactions`
 *     row (status 'created').
 *  2. Client opens Razorpay Checkout with the returned order id + public key id.
 *  3. Client  → Edge Function `payments-verify` with the checkout response.
 *     Server verifies HMAC-SHA256(order_id|payment_id, KEY_SECRET) and marks
 *     the transaction 'paid' / 'failed'.
 *  4. Razorpay → Edge Function `payments-webhook`. Server verifies the
 *     `X-Razorpay-Signature` header against the WEBHOOK SECRET, records the
 *     event id in `payment_webhook_events` for idempotency, and reconciles the
 *     transaction status. The webhook is the source of truth.
 *
 * Card / UPI / bank details are handled entirely by Razorpay and are never
 * sent to or stored by this application. Secrets live only in Supabase
 * Edge Function environment variables.
 */

export type PaymentStatus = 'created' | 'attempted' | 'paid' | 'failed' | 'refunded'

export interface CreateOrderRequest {
  registrationId: string
}

export interface CreateOrderResponse {
  transactionId: string
  providerOrderId: string
  /** Amount in paise, decided server-side. */
  amount: number
  currency: 'INR'
  keyId: string
}

export interface VerifyPaymentRequest {
  providerOrderId: string
  providerPaymentId: string
  signature: string
}

export interface PaymentResult {
  transactionId: string
  status: PaymentStatus
  failureReason?: string
}

export interface PaymentTransaction {
  id: string
  registrationId: string
  provider: 'razorpay'
  providerOrderId: string | null
  providerPaymentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
}

export interface PaymentGateway {
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>
  verify(req: VerifyPaymentRequest): Promise<PaymentResult>
}
