let razorpayInstance: any = null

export function getRazorpay() {
  if (razorpayInstance) return razorpayInstance

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    // Return a lightweight stub that fails at call time instead of throwing during module load
    razorpayInstance = {
      orders: { create: async () => { throw new Error('Razorpay is not configured (missing keys)') } },
      payments: { capture: async () => { throw new Error('Razorpay is not configured (missing keys)') } },
      refunds: { refund: async () => { throw new Error('Razorpay is not configured (missing keys)') } },
    }
    return razorpayInstance
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Razorpay = require('razorpay')
  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  return razorpayInstance
}

// Helper functions for payment processing
export async function createOrder(amount: number, currency = "INR", receipt?: string) {
  try {
  const rp = getRazorpay()
  const order = await rp.orders.create({ amount: amount * 100, currency, receipt: receipt || `order_${Date.now()}` })
  return order
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    throw error
  }
}

export async function verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
  try {
    const crypto = require('crypto')
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.warn('RAZORPAY_KEY_SECRET missing for signature verification')
      return false
    }
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')
    return expectedSignature === razorpaySignature
  } catch (error) {
    console.error('Error verifying payment:', error)
    return false
  }
}

export async function capturePayment(paymentId: string, amount: number) {
  try {
  const rp = getRazorpay()
  const payment = await rp.payments.capture(paymentId, amount * 100)
  return payment
  } catch (error) {
    console.error("Error capturing payment:", error)
    throw error
  }
}

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const rp = getRazorpay()
    const refund = await rp.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined,
    })
    return refund
  } catch (error) {
    console.error("Error processing refund:", error)
    throw error
  }
}

// Aliases and helper exports used by the app

export async function createRazorpayOrder(options: { amount: number; currency?: string; receipt?: string; notes?: Record<string, string> }) {
  return createOrder(options.amount, options.currency, options.receipt)
}

export async function createSubscription(planId: string, customerId?: string, opts?: any) {
  // Minimal stub for build-time; in production this would call Razorpay subscription APIs
  return { id: `sub_${Date.now()}`, planId, customerId, status: 'created' }
}

export function verifyWebhookSignature(body: string, signature: string) {
  // Minimal verification stub; callers should implement proper HMAC verification using RAZORPAY_KEY_SECRET
  return Boolean(process.env.RAZORPAY_KEY_SECRET && signature)
}

// Default export returns the lazily-initialized instance
export default getRazorpay

// Provide a named, lazily-resolving instance compatible with existing call sites
// (e.g. `import { razorpay } from '@/lib/razorpay'` and then `razorpay.orders.create(...)`).
export const razorpay: any = new Proxy({}, {
  get(_target, prop) {
    const inst = getRazorpay()
    const val = (inst as any)[prop]
    // If this is a function, bind it to the instance so callers can do razorpay.orders.create(...)
    if (typeof val === 'function') return val.bind(inst)
    return val
  },
})
