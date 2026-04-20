"use server"

import { revalidatePath } from "next/cache"
import { adminFetch } from "@/lib/admin-fetch"

export type UserRole = "super_admin" | "viewer"

export interface AdminUserDto {
  username: string
  role: UserRole
  updatedAt: string
}

export interface CreateUserResponse {
  username: string
  password: string
  role: UserRole
}

export interface ResetPasswordResponse {
  username: string
  password: string
}

export async function getUsers(): Promise<AdminUserDto[]> {
  const res = await adminFetch("/api/auth/users", { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function createUser(
  username: string,
  role: UserRole = "viewer",
): Promise<CreateUserResponse> {
  const res = await adminFetch("/api/auth/users", {
    method: "POST",
    body: JSON.stringify({ username, role }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to create user: ${res.status}`)
  }
  revalidatePath("/admin/users")
  return res.json()
}

export async function resetPassword(username: string): Promise<ResetPasswordResponse> {
  const res = await adminFetch(`/api/auth/users/${username}/reset-password`, { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to reset password: ${res.status}`)
  }
  revalidatePath("/admin/users")
  return res.json()
}

export async function changeRole(username: string, role: UserRole): Promise<AdminUserDto> {
  const res = await adminFetch(`/api/auth/users/${username}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to change role: ${res.status}`)
  }
  revalidatePath("/admin/users")
  return res.json()
}

export async function deleteUser(username: string): Promise<void> {
  const res = await adminFetch(`/api/auth/users/${username}`, { method: "DELETE" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to delete user: ${res.status}`)
  }
  revalidatePath("/admin/users")
}
