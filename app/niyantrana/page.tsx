import { requireAdmin } from "@/lib/auth/requireAdmin"
import { AdminDashboard } from "./AdminDashboard"

export default async function NiyantranaPage() {
  // Verify admin access server-side
  await requireAdmin()

  return <AdminDashboard />
}
