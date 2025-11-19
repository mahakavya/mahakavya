"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatIST } from "@/lib/dates"
import { Search, ChevronRight } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  entity: string
  entity_id?: string
  meta?: any
  created_at: string
  profiles?: {
    name?: string
    email?: string
  }
}

interface AuditTableProps {
  className?: string
}

export function AuditTable({ className }: AuditTableProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchAuditLogs = async (cursor?: string, reset = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (cursor) params.set("cursor", cursor)
      params.set("limit", "50")

      const response = await fetch(`/api/admin/audit?${params}`)
      if (!response.ok) throw new Error("Failed to fetch audit logs")

      const data = await response.json()

      if (reset) {
        setAuditLogs(data.items)
      } else {
        setAuditLogs((prev) => [...prev, ...data.items])
      }

      setNextCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs(undefined, true)
  }, [search])

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchAuditLogs(nextCursor)
    }
  }

  return (
    <div className={className} data-testid="audit-table">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search actions, entities..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.entity}</span>
                    {log.entity_id && (
                      <span className="text-xs text-muted-foreground font-mono">{log.entity_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.profiles?.name || "System"}</span>
                    {log.profiles?.email && <span className="text-xs text-muted-foreground">{log.profiles.email}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{formatIST(log.created_at)}</span>
                </TableCell>
                <TableCell>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-xs text-muted-foreground hover:text-foreground">View JSON</summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-xs">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {!loading && auditLogs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
        )}

        {hasMore && !loading && (
          <div className="p-4 border-t border-white/40 text-center">
            <Button onClick={loadMore} variant="outline" size="sm">
              <ChevronRight className="h-4 w-4 mr-2" />
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
