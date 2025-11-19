import jsPDF from "jspdf"
import { format } from "date-fns"

// Invoice PDF generation
export interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate?: string
  from: {
    name: string
    address: string[]
    email?: string
    phone?: string
    gst?: string
  }
  to: {
    name: string
    address: string[]
    email?: string
    phone?: string
    gst?: string
  }
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  tax?: {
    rate: number
    amount: number
  }
  total: number
  currency: string
  notes?: string
  terms?: string[]
}

export function renderInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Header
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - 20, yPosition, { align: "right" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 20, yPosition + 10, { align: "right" })
  doc.text(`Date: ${format(new Date(data.date), "dd/MM/yyyy")}`, pageWidth - 20, yPosition + 20, { align: "right" })

  if (data.dueDate) {
    doc.text(`Due Date: ${format(new Date(data.dueDate), "dd/MM/yyyy")}`, pageWidth - 20, yPosition + 30, {
      align: "right",
    })
  }

  // From section
  yPosition = 60
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("From:", 20, yPosition)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  yPosition += 10
  doc.text(data.from.name, 20, yPosition)

  data.from.address.forEach((line) => {
    yPosition += 8
    doc.text(line, 20, yPosition)
  })

  if (data.from.email) {
    yPosition += 8
    doc.text(`Email: ${data.from.email}`, 20, yPosition)
  }

  if (data.from.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.from.phone}`, 20, yPosition)
  }

  if (data.from.gst) {
    yPosition += 8
    doc.text(`GST: ${data.from.gst}`, 20, yPosition)
  }

  // To section
  yPosition = 60
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("To:", pageWidth / 2 + 20, yPosition)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  yPosition += 10
  doc.text(data.to.name, pageWidth / 2 + 20, yPosition)

  data.to.address.forEach((line) => {
    yPosition += 8
    doc.text(line, pageWidth / 2 + 20, yPosition)
  })

  if (data.to.email) {
    yPosition += 8
    doc.text(`Email: ${data.to.email}`, pageWidth / 2 + 20, yPosition)
  }

  if (data.to.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.to.phone}`, pageWidth / 2 + 20, yPosition)
  }

  if (data.to.gst) {
    yPosition += 8
    doc.text(`GST: ${data.to.gst}`, pageWidth / 2 + 20, yPosition)
  }

  // Items table
  yPosition = Math.max(yPosition, 140) + 20

  // Table header
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPosition - 5, pageWidth - 40, 15, "F")

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Description", 25, yPosition + 5)
  doc.text("Qty", pageWidth - 120, yPosition + 5, { align: "center" })
  doc.text("Rate", pageWidth - 80, yPosition + 5, { align: "center" })
  doc.text("Amount", pageWidth - 25, yPosition + 5, { align: "right" })

  yPosition += 20

  // Table items
  doc.setFont("helvetica", "normal")
  data.items.forEach((item) => {
    doc.text(item.description, 25, yPosition)
    doc.text(item.quantity.toString(), pageWidth - 120, yPosition, { align: "center" })
    doc.text(`${data.currency} ${item.rate.toFixed(2)}`, pageWidth - 80, yPosition, { align: "center" })
    doc.text(`${data.currency} ${item.amount.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })
    yPosition += 15
  })

  // Totals
  yPosition += 10
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 15

  doc.text("Subtotal:", pageWidth - 80, yPosition)
  doc.text(`${data.currency} ${data.subtotal.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })

  if (data.tax) {
    yPosition += 12
    doc.text(`Tax (${data.tax.rate}%):`, pageWidth - 80, yPosition)
    doc.text(`${data.currency} ${data.tax.amount.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })
  }

  yPosition += 15
  doc.setFont("helvetica", "bold")
  doc.text("Total:", pageWidth - 80, yPosition)
  doc.text(`${data.currency} ${data.total.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })

  // Notes
  if (data.notes) {
    yPosition += 30
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", 20, yPosition)
    yPosition += 10
    doc.setFont("helvetica", "normal")
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40)
    doc.text(splitNotes, 20, yPosition)
    yPosition += splitNotes.length * 6
  }

  // Terms
  if (data.terms && data.terms.length > 0) {
    yPosition += 20
    doc.setFont("helvetica", "bold")
    doc.text("Terms & Conditions:", 20, yPosition)
    yPosition += 10
    doc.setFont("helvetica", "normal")
    data.terms.forEach((term, index) => {
      doc.text(`${index + 1}. ${term}`, 20, yPosition)
      yPosition += 8
    })
  }

  return doc
}

// Donation receipt PDF generation
export interface DonationReceiptData {
  receiptNumber: string
  date: string
  donor: {
    name: string
    email?: string
    phone?: string
    address?: string[]
    pan?: string
  }
  organization: {
    name: string
    address: string[]
    email?: string
    phone?: string
    registration?: string
    pan?: string
    website?: string
  }
  donation: {
    amount: number
    currency: string
    method: string
    transactionId?: string
    campaign?: string
    purpose?: string
  }
  taxExemption?: {
    section: string
    percentage: number
  }
}

export function renderDonationReceiptPDF(data: DonationReceiptData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("DONATION RECEIPT", pageWidth / 2, yPosition, { align: "center" })

  yPosition += 20
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Receipt No: ${data.receiptNumber}`, pageWidth - 20, yPosition, { align: "right" })
  doc.text(`Date: ${format(new Date(data.date), "dd/MM/yyyy")}`, pageWidth - 20, yPosition + 10, { align: "right" })

  // Organization details
  yPosition += 30
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Received by:", 20, yPosition)

  yPosition += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(data.organization.name, 20, yPosition)

  data.organization.address.forEach((line) => {
    yPosition += 8
    doc.text(line, 20, yPosition)
  })

  if (data.organization.email) {
    yPosition += 8
    doc.text(`Email: ${data.organization.email}`, 20, yPosition)
  }

  if (data.organization.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.organization.phone}`, 20, yPosition)
  }

  if (data.organization.registration) {
    yPosition += 8
    doc.text(`Registration: ${data.organization.registration}`, 20, yPosition)
  }

  if (data.organization.pan) {
    yPosition += 8
    doc.text(`PAN: ${data.organization.pan}`, 20, yPosition)
  }

  // Donor details
  yPosition += 30
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Received from:", 20, yPosition)

  yPosition += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(data.donor.name, 20, yPosition)

  if (data.donor.address) {
    data.donor.address.forEach((line) => {
      yPosition += 8
      doc.text(line, 20, yPosition)
    })
  }

  if (data.donor.email) {
    yPosition += 8
    doc.text(`Email: ${data.donor.email}`, 20, yPosition)
  }

  if (data.donor.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.donor.phone}`, 20, yPosition)
  }

  if (data.donor.pan) {
    yPosition += 8
    doc.text(`PAN: ${data.donor.pan}`, 20, yPosition)
  }

  // Donation details
  yPosition += 30
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPosition - 5, pageWidth - 40, 80, "F")

  yPosition += 10
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Donation Details:", 25, yPosition)

  yPosition += 15
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Amount: ${data.donation.currency} ${data.donation.amount.toFixed(2)}`, 25, yPosition)

  yPosition += 10
  doc.text(`Payment Method: ${data.donation.method}`, 25, yPosition)

  if (data.donation.transactionId) {
    yPosition += 10
    doc.text(`Transaction ID: ${data.donation.transactionId}`, 25, yPosition)
  }

  if (data.donation.campaign) {
    yPosition += 10
    doc.text(`Campaign: ${data.donation.campaign}`, 25, yPosition)
  }

  if (data.donation.purpose) {
    yPosition += 10
    doc.text(`Purpose: ${data.donation.purpose}`, 25, yPosition)
  }

  // Tax exemption
  if (data.taxExemption) {
    yPosition += 30
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Tax Exemption under Section ${data.taxExemption.section}`, 20, yPosition)
    yPosition += 10
    doc.setFont("helvetica", "normal")
    doc.text(
      `This donation is eligible for ${data.taxExemption.percentage}% tax deduction under Section ${data.taxExemption.section} of the Income Tax Act.`,
      20,
      yPosition,
    )
  }

  // Footer
  yPosition = pageHeight - 40
  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, yPosition, {
    align: "center",
  })

  if (data.organization.website) {
    yPosition += 10
    doc.text(`Visit us at: ${data.organization.website}`, pageWidth / 2, yPosition, { align: "center" })
  }

  return doc
}

// Generic receipt generation
export interface ReceiptData {
  receiptNumber: string
  date: string
  type: string
  from: {
    name: string
    address?: string[]
    email?: string
    phone?: string
  }
  to: {
    name: string
    address?: string[]
    email?: string
    phone?: string
  }
  items: Array<{
    description: string
    amount: number
  }>
  total: number
  currency: string
  notes?: string
}

export function renderReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(`${data.type.toUpperCase()} RECEIPT`, pageWidth / 2, yPosition, { align: "center" })

  yPosition += 20
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Receipt No: ${data.receiptNumber}`, pageWidth - 20, yPosition, { align: "right" })
  doc.text(`Date: ${format(new Date(data.date), "dd/MM/yyyy")}`, pageWidth - 20, yPosition + 10, { align: "right" })

  // From section
  yPosition += 40
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("From:", 20, yPosition)

  yPosition += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(data.from.name, 20, yPosition)

  if (data.from.address) {
    data.from.address.forEach((line) => {
      yPosition += 8
      doc.text(line, 20, yPosition)
    })
  }

  if (data.from.email) {
    yPosition += 8
    doc.text(`Email: ${data.from.email}`, 20, yPosition)
  }

  if (data.from.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.from.phone}`, 20, yPosition)
  }

  // To section
  yPosition += 20
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("To:", 20, yPosition)

  yPosition += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(data.to.name, 20, yPosition)

  if (data.to.address) {
    data.to.address.forEach((line) => {
      yPosition += 8
      doc.text(line, 20, yPosition)
    })
  }

  if (data.to.email) {
    yPosition += 8
    doc.text(`Email: ${data.to.email}`, 20, yPosition)
  }

  if (data.to.phone) {
    yPosition += 8
    doc.text(`Phone: ${data.to.phone}`, 20, yPosition)
  }

  // Items
  yPosition += 30
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPosition - 5, pageWidth - 40, 15, "F")

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Description", 25, yPosition + 5)
  doc.text("Amount", pageWidth - 25, yPosition + 5, { align: "right" })

  yPosition += 20

  doc.setFont("helvetica", "normal")
  data.items.forEach((item) => {
    doc.text(item.description, 25, yPosition)
    doc.text(`${data.currency} ${item.amount.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })
    yPosition += 15
  })

  // Total
  yPosition += 10
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 15

  doc.setFont("helvetica", "bold")
  doc.text("Total:", pageWidth - 80, yPosition)
  doc.text(`${data.currency} ${data.total.toFixed(2)}`, pageWidth - 25, yPosition, { align: "right" })

  // Notes
  if (data.notes) {
    yPosition += 30
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", 20, yPosition)
    yPosition += 10
    doc.setFont("helvetica", "normal")
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40)
    doc.text(splitNotes, 20, yPosition)
  }

  return doc
}

// Utility functions
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output("blob")
}

export function getPDFDataURL(doc: jsPDF): string {
  return doc.output("dataurlstring")
}
