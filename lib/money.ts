// Money formatting utilities for Indian Rupee (INR)

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    // 1 crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  } else if (amount >= 100000) {
    // 1 lakh
    return `₹${(amount / 100000).toFixed(1)}L`
  } else if (amount >= 1000) {
    // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount}`
}

export function parseINR(amountString: string): number {
  // Remove currency symbols and commas
  const cleaned = amountString.replace(/[₹,\s]/g, "")
  return Number.parseFloat(cleaned) || 0
}

export function convertPaiseToRupees(paise: number): number {
  return paise / 100
}

export function convertRupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function formatPaise(paise: number): string {
  return formatINR(convertPaiseToRupees(paise))
}

export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000000 // Max 1 crore
}

export function calculateTax(amount: number, taxRate = 0.18): number {
  return amount * taxRate
}

export function calculateTotal(amount: number, taxRate = 0.18): number {
  return amount + calculateTax(amount, taxRate)
}

export function formatAmountWithTax(
  amount: number,
  taxRate = 0.18,
): {
  amount: string
  tax: string
  total: string
} {
  const tax = calculateTax(amount, taxRate)
  const total = amount + tax

  return {
    amount: formatINR(amount),
    tax: formatINR(tax),
    total: formatINR(total),
  }
}
