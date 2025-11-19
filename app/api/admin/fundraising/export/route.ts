import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { filters, format } = await request.json()

  const supabase = createSupabaseServerClient()
  const sb: any = supabase as any
  let query = sb
      .from("fundraising_campaigns_with_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters.risk && filters.risk !== "all") {
      query = query.eq("risk_level", filters.risk)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
    }

    if (format === "csv") {
      const csvHeaders = [
        "ID",
        "Title",
        "Category",
        "Status",
        "Target Amount",
        "Raised Amount",
        "Donor Count",
        "Success Rate",
        "Risk Level",
        "AI Score",
        "Blockchain Verified",
        "Creator Name",
        "Creator Email",
        "Location",
        "Created At",
        "Updated At",
      ]

      // Normalize data and guard against missing fields coming from custom views
      const rows: any[] = Array.isArray(data) ? data : []

      const csvRows: string[][] = rows.map((campaign: any) => {
        const id = campaign?.id ?? ""
        const title = String(campaign?.title ?? "").replace(/"/g, '""')
        const category = campaign?.category ?? ""
        const status = campaign?.status ?? ""
        const target = campaign?.target_amount ?? 0
        const raised = campaign?.raised_amount ?? 0
        const donorCount = campaign?.donor_count ?? 0
        const successRate = target ? Math.round((raised / target) * 100) : 0
        const risk = campaign?.risk_level ?? ""
        const aiScore = campaign?.ai_score ?? ""
        const blockchain = campaign?.blockchain_verified ? "Yes" : "No"
        const creatorName = String(campaign?.creator_name ?? "").replace(/"/g, '""')
        const creatorEmail = campaign?.creator_email ?? ""
        const location = campaign?.location ?? ""
        const createdAt = campaign?.created_at ?? ""
        const updatedAt = campaign?.updated_at ?? ""

        // Ensure each cell is a string and strip any newlines which would break CSV rows
        const safe = (v: any) => String(v).replace(/\r?\n/g, " ")

        return [
          safe(id),
          `"${safe(title)}"`,
          safe(category),
          safe(status),
          safe(target),
          safe(raised),
          safe(donorCount),
          safe(successRate),
          safe(risk),
          safe(aiScore),
          safe(blockchain),
          `"${safe(creatorName)}"`,
          safe(creatorEmail),
          safe(location),
          safe(createdAt),
          safe(updatedAt),
        ]
      })

      const csvContent = [csvHeaders.join(","), ...csvRows.map((row: string[]) => row.join(","))].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=fundraising-campaigns.csv",
        },
      })
    }

    return NextResponse.json({ success: false, error: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 })
  }
}
