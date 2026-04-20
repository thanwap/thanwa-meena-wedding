import { redirect } from "next/navigation"
import { auth } from "@/auth"

const API = process.env.DOTNET_API_URL!

export async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  const session = await auth()
  if (!session?.idToken) {
    redirect("/api/auth/force-signout")
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    redirect("/api/auth/force-signout")
  }

  return res
}
