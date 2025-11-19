import { ENV } from "@/config/env"

// Razorpay SDK types
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  close(): void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

// Load Razorpay SDK
export async function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true)
      return
    }

    // Create script element
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true

    script.onload = () => {
      resolve(true)
    }

    script.onerror = () => {
      console.error("Failed to load Razorpay SDK")
      resolve(false)
    }

    document.body.appendChild(script)
  })
}

// Initialize Razorpay payment
export async function initializeRazorpayPayment(options: {
  orderId: string
  amount: number
  currency?: string
  name: string
  description?: string
  userEmail?: string
  userName?: string
  userContact?: string
  onSuccess: (response: RazorpayResponse) => void
  onError?: (error: any) => void
  onDismiss?: () => void
}): Promise<void> {
  // Load Razorpay SDK
  const isLoaded = await loadRazorpay()
  if (!isLoaded) {
    throw new Error("Failed to load Razorpay SDK")
  }

  // Validate required configuration
  if (!ENV.RAZORPAY_KEY_ID) {
    throw new Error("Razorpay key ID is not configured")
  }

  // Create Razorpay options
  const razorpayOptions: RazorpayOptions = {
    key: ENV.RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    handler: options.onSuccess,
    prefill: {
      name: options.userName,
      email: options.userEmail,
      contact: options.userContact,
    },
    theme: {
      color: "#3B82F6", // Blue theme
    },
    modal: {
      ondismiss: options.onDismiss,
    },
  }

  try {
    // Create and open Razorpay instance
    const razorpay = new window.Razorpay(razorpayOptions)
    razorpay.open()
  } catch (error) {
    console.error("Error initializing Razorpay payment:", error)
    if (options.onError) {
      options.onError(error)
    }
    throw error
  }
}

// Verify payment signature
export async function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  try {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        payment_id: paymentId,
        signature: signature,
      }),
    })

    if (!response.ok) {
      throw new Error("Payment verification failed")
    }

    const result = await response.json()
    return result.verified === true
  } catch (error) {
    console.error("Error verifying payment signature:", error)
    return false
  }
}

// Create Razorpay order
export async function createRazorpayOrder(options: {
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}): Promise<{
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}> {
  try {
    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency || "INR",
        receipt: options.receipt || `receipt_${Date.now()}`,
        notes: options.notes,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create Razorpay order")
    }

    const order = await response.json()
    return order
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    throw error
  }
}

// Get payment details
export async function getPaymentDetails(paymentId: string): Promise<any> {
  try {
    const response = await fetch(`/api/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch payment details")
    }

    const payment = await response.json()
    return payment
  } catch (error) {
    console.error("Error fetching payment details:", error)
    throw error
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number): Promise<any> {
  try {
    const response = await fetch("/api/payments/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_id: paymentId,
        amount: amount,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to process refund")
    }

    const refund = await response.json()
    return refund
  } catch (error) {
    console.error("Error processing refund:", error)
    throw error
  }
}

// Payment utilities
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount / 100) // Razorpay amounts are in paise
}

export function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 50000000 // Max 5 lakh INR
}

export function generateReceiptId(prefix = "receipt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export types
export type { RazorpayOptions, RazorpayResponse, RazorpayInstance }
