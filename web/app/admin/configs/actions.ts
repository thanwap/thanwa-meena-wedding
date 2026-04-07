"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { ConfigDto, ConfigInput } from "./types"

const API = process.env.DOTNET_API_URL!

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

export async function getConfigs(): Promise<ConfigDto[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/configs`, { headers, cache: "no-store" })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const wwwAuth = res.headers.get("www-authenticate") ?? ""
    console.error("[getConfigs] failed", { status: res.status, wwwAuth, body })
    throw new Error(
      `Failed to fetch configs: ${res.status} ${wwwAuth || body}`.trim()
    )
  }
  return res.json()
}

export async function createConfig(input: ConfigInput) {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/configs`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create config: ${res.status}`)
  revalidatePath("/admin/configs")
}

export async function updateConfig(id: number, input: ConfigInput) {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to update config: ${res.status}`)
  revalidatePath("/admin/configs")
}

export async function deleteConfig(id: number) {
  const headers = await authHeaders()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error(`Failed to delete config: ${res.status}`)
  revalidatePath("/admin/configs")
}
