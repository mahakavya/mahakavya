import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { renderDonationReceiptPDF } from "@/lib/pdf"
import { putPrivateFile, getSignedUrl } from "@/lib/storage-docs"
import { nextDocNumber } from "@/lib/docnum"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  donationId: z.string().uuid(),
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
    const { donationId } = RequestSchema.parse(body)

    // Get donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select(`
        *,
        profiles!inner(name, email),
        campaigns!inner(title)
      `)
      .eq("id", donationId)
      .eq("user_id", user.id)
      .eq("status", "captured")
      .single()

    if (donationError || !donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 })
    }

    // Check if PDF already exists
    if (donation.meta?.receipt_url) {
      try {
        const signedUrl = await getSignedUrl(supabase, "receipts", donation.meta.receipt_url)
        return NextResponse.json({ url: signedUrl })
      } catch (error) {
        console.log("Existing receipt not found, generating new one")
      }
    }

    // Generate receipt number
    const receiptNumber = await nextDocNumber(supabase, "receipt")

    // Generate PDF
    const pdfBuffer = await renderDonationReceiptPDF({
      receiptNumber,
      receiptDate: new Date(donation.created_at),
      donorName: donation.profiles.name || "",
      donorEmail: donation.profiles.email,
      campaignTitle: donation.campaigns.title,
      amountInPaise: Math.round(donation.amount * 100),
      paymentId: donation.payment_id || undefined,
    })

    // Store PDF
    const filePath = `${user.id}/${receiptNumber}.pdf`
    await putPrivateFile(supabase, "receipts", filePath, new Uint8Array(pdfBuffer))

    // Update donation record
    await supabase
      .from("donations")
      .update({
        meta: {
          ...donation.meta,
          receipt_url: filePath,
          receipt_number: receiptNumber,
        },
      })
      .eq("id", donationId)

    // Get signed URL
    const signedUrl = await getSignedUrl(supabase, "receipts", filePath)

    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error("Receipt PDF generation failed:", error)
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 })
  }
}
