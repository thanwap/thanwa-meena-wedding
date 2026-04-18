"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const API = process.env.DOTNET_API_URL!

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

async function getIdToken(): Promise<string> {
  const session = await auth()
  if (!session?.idToken) throw new Error("Not authenticated")
  return session.idToken
}

async function authHeaders() {
  const token = await getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export async function getUsers(): Promise<AdminUserDto[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/auth/users`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function createUser(
  username: string,
  role: UserRole = "viewer",
): Promise<CreateUserResponse> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/auth/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ username, role }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to create user: ${res.status}`)
  }
  revalidatePath("/admin/users")
  return res.json()
}

export async function resetPassword(
  username: string,
): Promise<ResetPasswordResponse> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/auth/users/${username}/reset-password`, {
    method: "POST",
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to reset password: ${res.status}`)
  }
  revalidatePath("/admin/users")
  return res.json()
}

export async function changeRole(
  username: string,
  role: UserRole,
): Promise<AdminUserDto> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/auth/users/${username}/role`, {
    method: "PATCH",
    headers,
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
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/auth/users/${username}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to delete user: ${res.status}`)
  }
  revalidatePath("/admin/users")
}
