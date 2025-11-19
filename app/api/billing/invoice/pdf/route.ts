import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { renderInvoicePDF } from "@/lib/pdf"
import { putPrivateFile, getSignedUrl } from "@/lib/storage-docs"
import { nextDocNumber } from "@/lib/docnum"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  paymentId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId } = RequestSchema.parse(body)

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        profiles!inner(name, email)
      `)
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.kind !== "invoice") {
      return NextResponse.json({ error: "Not an invoice payment" }, { status: 400 })
    }

    // Check if PDF already exists
    if (payment.meta?.invoice_url) {
      try {
        const signedUrl = await getSignedUrl(supabase, "invoices", payment.meta.invoice_url)
        return NextResponse.json({ url: signedUrl })
      } catch (error) {
        console.log("Existing PDF not found, generating new one")
      }
    }

    // Generate invoice number
    const invoiceNumber = await nextDocNumber(supabase, "invoice")

    // Get subscription details for period
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("current_period_start, current_period_end")
      .eq("user_id", user.id)
      .single()

    // Generate PDF
    const pdfBuffer = await renderInvoicePDF({
      invoiceNumber,
      invoiceDate: new Date(payment.created_at),
      buyerName: payment.profiles.name || "",
      buyerEmail: payment.profiles.email,
      amountInPaise: Math.round(payment.amount * 100),
      planName: "Mahakavya Monthly — ₹499",
      periodStart: subscription?.current_period_start ? new Date(subscription.current_period_start) : undefined,
      periodEnd: subscription?.current_period_end ? new Date(subscription.current_period_end) : undefined,
    })

    // Store PDF
    const filePath = `${user.id}/${invoiceNumber}.pdf`
    await putPrivateFile(supabase, "invoices", filePath, new Uint8Array(pdfBuffer))

    // Update payment record
    await supabase
      .from("payments")
      .update({
        meta: {
          ...payment.meta,
          invoice_url: filePath,
          invoice_number: invoiceNumber,
        },
      })
      .eq("id", paymentId)

    // Get signed URL
    const signedUrl = await getSignedUrl(supabase, "invoices", filePath)

    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error("Invoice PDF generation failed:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
