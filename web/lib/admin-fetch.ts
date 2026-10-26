import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { apiFetch } from "@/lib/api"

export async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  const session = await auth()
  if (!session?.idToken) {
    redirect("/api/auth/force-signout")
  }

  // Multipart bodies need fetch to set Content-Type itself (it adds the boundary)
  const isFormData = options?.body instanceof FormData

  const res = await apiFetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    redirect("/api/auth/force-signout")
  }

  return res
}
