function periodYM(d = new Date()) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function nextDocNumber(sb: any, docType: "invoice" | "receipt") {
  const period = periodYM()

  try {
    // Try to insert new counter
    const { data, error } = await sb
      .from("doc_counters")
      .insert({ doc_type: docType, period, counter: 1 })
      .select("*")
      .single()

    if (!error && data) {
      return `${docType === "invoice" ? "INV" : "RCT"}-${period}-${String(data.counter).padStart(4, "0")}`
    }
  } catch (insertError) {
    // Conflict: use RPC to increment
    try {
      const { data: upd } = await sb.rpc("doc_counter_inc", {
        p_doc: docType,
        p_period: period,
      })

      if (upd?.[0]?.num) {
        return `${docType === "invoice" ? "INV" : "RCT"}-${period}-${String(upd[0].num).padStart(4, "0")}`
      }
    } catch (rpcError) {
      console.error("RPC increment failed:", rpcError)
    }
  }

  // Fallback: timestamp
  return `${docType === "invoice" ? "INV" : "RCT"}-${period}-${Date.now()}`
}
