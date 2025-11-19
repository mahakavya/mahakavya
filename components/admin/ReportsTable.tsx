"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatIST } from "@/lib/dates"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Report {
  id: string
  entity_type: string
  entity_id: string
  reason: string
  status: string
  created_at: string
  reporter: { name: string; email: string }
  reported_user: { name: string; email: string }
}

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [filterValue, setFilterValue] = useState("open")
  const { toast } = useToast()

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams()
      if (searchValue) params.set("q", searchValue)
      if (filterValue !== "all") params.set("status", filterValue)

      const response = await fetch(`/api/admin/moderation/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.items)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [searchValue, filterValue])

  const handleAction = async (reportId: string, action: string) => {
    try {
      const response = await fetch("/api/admin/moderation/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report ${action}d successfully`,
        })
        fetchReports()
      } else {
        throw new Error(`Failed to ${action} report`)
      }
    } catch (error) {
      console.error(`Error ${action}ing report:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} report`,
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      key: "entity_type",
      label: "Entity",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          variant={
            value === "open"
              ? "destructive"
              : value === "reviewing"
                ? "default"
                : value === "resolved"
                  ? "default"
                  : "secondary"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (value: any) => value?.name || "Unknown",
    },
    {
      key: "reported_user",
      label: "Reported User",
      render: (value: any) => value?.name || "Unknown",
    },
    {
      key: "created_at",
      label: "Created",
      render: (value: string) => formatIST(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: Report) => (
        <div className="flex gap-2">
          {row.status === "open" && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleAction(row.id, "resolve")}>
                Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(row.id, "reject")}>
                Reject
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Hide
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hide Content</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will hide the reported content from public view. This action can be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction(row.id, "hide")}>Hide Content</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Ban
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deactivate the reported user's account. They will not be able to access the platform.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction(row.id, "ban")}>Ban User</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ),
    },
  ]

  const filterOptions = [
    { value: "open", label: "Open" },
    { value: "reviewing", label: "Reviewing" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <div data-testid="admin-reports-table">
      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={filterOptions}
      />
    </div>
  )
}
