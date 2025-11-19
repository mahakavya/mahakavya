// Server-side payment utilities
export function isPaymentsEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

// Server action to get payment status
export async function getPaymentsStatus(): Promise<{ enabled: boolean }> {
  return { enabled: isPaymentsEnabled() }
}
