'use server'

import { auth } from '@/auth'
import type { ConfigDto } from './types'

async function getIdToken(): Promise<string> {
  const session = await auth()
  if (!session?.idToken) throw new Error('Not authenticated')
  return session.idToken
}

const API = process.env.DOTNET_API_URL!

export async function getConfigs(): Promise<ConfigDto[]> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch configs: ${res.status}`)
  return res.json()
}

export async function createConfig(
  key: string,
  value: string,
  type: string,
): Promise<ConfigDto> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key, value, type }),
  })
  if (!res.ok) throw new Error(`Failed to create config: ${res.status}`)
  return res.json()
}

export async function updateConfig(
  id: number,
  key: string,
  value: string,
  type: string,
): Promise<ConfigDto> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key, value, type }),
  })
  if (!res.ok) throw new Error(`Failed to update config: ${res.status}`)
  return res.json()
}

export async function deleteConfig(id: number): Promise<void> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete config: ${res.status}`)
}
