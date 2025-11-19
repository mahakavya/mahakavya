"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { formatIST } from "@/lib/dates"

interface User {
  id: string
  email: string
  name: string
  is_admin: boolean
  is_active: boolean
  shadow_muted: boolean
  created_at: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [filterValue, setFilterValue] = useState("all")
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (searchValue) params.set("q", searchValue)
      if (filterValue !== "all") params.set("status", filterValue)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.items)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [searchValue, filterValue])

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        fetchUsers()
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleNameEdit = (userId: string, currentName: string) => {
    setEditingName(userId)
    setEditValue(currentName)
  }

  const handleNameSave = async (userId: string) => {
    if (editValue.trim()) {
      await updateUser(userId, { name: editValue.trim() })
    }
    setEditingName(null)
    setEditValue("")
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value: string, row: User) => (
        <div className="flex items-center gap-2">
          {editingName === row.id ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave(row.id)
                  if (e.key === "Escape") setEditingName(null)
                }}
                autoFocus
              />
              <Button size="sm" onClick={() => handleNameSave(row.id)}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{value}</span>
              <Button size="sm" variant="ghost" onClick={() => handleNameEdit(row.id, value)}>
                Edit
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "is_admin",
      label: "Role",
      render: (value: boolean, row: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? "default" : "secondary"}>{value ? "Admin" : "User"}</Badge>
          <Switch checked={value} onCheckedChange={(checked) => updateUser(row.id, { is_admin: checked })} />
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value: boolean, row: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? "default" : "destructive"}>{value ? "Active" : "Inactive"}</Badge>
          <Switch checked={value} onCheckedChange={(checked) => updateUser(row.id, { is_active: checked })} />
        </div>
      ),
    },
    {
      key: "shadow_muted",
      label: "Shadow-muted",
      render: (value: boolean, row: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? "destructive" : "secondary"}>{value ? "Muted" : "Normal"}</Badge>
          <Switch
            checked={value}
            onCheckedChange={(checked) => updateUser(row.id, { shadow_muted: checked })}
            title="Shadow-mute hides a user's new posts/comments/reels from others without notifying them"
          />
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (value: string) => formatIST(value),
    },
  ]

  const filterOptions = [
    { value: "all", label: "All Users" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" },
  ]

  return (
    <div data-testid="admin-users-table">
      <DataTable
        columns={columns}
        data={users}
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
