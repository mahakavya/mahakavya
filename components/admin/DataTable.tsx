"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: { value: string; label: string }[]
  onRowAction?: (action: string, row: any) => void
  pagination?: {
    hasMore: boolean
    onNext: () => void
    onPrev: () => void
    canPrev: boolean
  }
}

export function DataTable({
  columns,
  data,
  loading,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  onRowAction,
  pagination,
}: DataTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {onFilterChange && filterOptions && (
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={pagination.onPrev}
            disabled={!pagination.canPrev}
            className="flex items-center gap-2 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={pagination.onNext}
            disabled={!pagination.hasMore}
            className="flex items-center gap-2 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
