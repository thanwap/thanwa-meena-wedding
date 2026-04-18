"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type AdminUserDto,
  type UserRole,
  changeRole,
  createUser,
  deleteUser,
  getUsers,
  resetPassword,
} from "./actions"

export function UsersClient({
  initialUsers,
  currentUser,
  isSuperAdmin,
}: {
  initialUsers: AdminUserDto[]
  currentUser: string
  isSuperAdmin: boolean
}) {
  const [users, setUsers] = useState(initialUsers)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("viewer")
  const [creating, setCreating] = useState(false)

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  )
  const [generatedUsername, setGeneratedUsername] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [resetting, setResetting] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const data = await getUsers()
    setUsers(data)
  }, [])

  const handleCreate = async () => {
    if (!newUsername.trim()) return
    setCreating(true)
    try {
      const result = await createUser(newUsername.trim(), newRole)
      setCreateOpen(false)
      setNewUsername("")
      setNewRole("viewer")
      setGeneratedUsername(result.username)
      setGeneratedPassword(result.password)
      setPasswordDialogOpen(true)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setCreating(false)
    }
  }

  const handleResetPassword = async (username: string) => {
    setResetting(username)
    try {
      const result = await resetPassword(username)
      setGeneratedUsername(result.username)
      setGeneratedPassword(result.password)
      setPasswordDialogOpen(true)
      await refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
      )
    } finally {
      setResetting(null)
    }
  }

  const handleChangeRole = async (username: string, role: UserRole) => {
    setChangingRole(username)
    try {
      await changeRole(username, role)
      toast.success(`Role for "${username}" changed to ${role === "super_admin" ? "Super Admin" : "Viewer"}`)
      await refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change role",
      )
    } finally {
      setChangingRole(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget)
      setDeleteTarget(null)
      toast.success(`User "${deleteTarget}" deleted`)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedPassword) return
    await navigator.clipboard.writeText(generatedPassword)
    toast.success("Password copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage admin accounts and roles.
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Add User</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Admin User</DialogTitle>
                <DialogDescription>
                  A random password will be generated. You can copy it to share
                  with the user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="e.g. photographer"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(v) => setNewRole(v as UserRole)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newUsername.trim()}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Updated</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">
                    {user.username}
                  </TableCell>
                  <TableCell>
                    {isSuperAdmin && user.username !== currentUser ? (
                      <Select
                        value={user.role}
                        onValueChange={(v) =>
                          handleChangeRole(user.username, v as UserRole)
                        }
                        disabled={changingRole === user.username}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          user.role === "super_admin" ? "default" : "secondary"
                        }
                      >
                        {user.role === "super_admin" ? "Super Admin" : "Viewer"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.username)}
                          disabled={resetting === user.username}
                        >
                          {resetting === user.username
                            ? "Resetting..."
                            : "Reset Password"}
                        </Button>
                        {user.username !== currentUser && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(user.username)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Password display dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password for {generatedUsername}</DialogTitle>
            <DialogDescription>
              Copy this password now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={generatedPassword ?? ""}
                className="font-mono"
              />
              <Button variant="outline" onClick={handleCopy}>
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setPasswordDialogOpen(false)
                setGeneratedPassword(null)
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
