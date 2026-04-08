import { redirect } from "next/navigation"
import { auth } from "@/auth"

const API = process.env.DOTNET_API_URL!

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.idToken) redirect("/admin/login")
  const params = await searchParams

  async function changePassword(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.idToken) redirect("/admin/login")

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      redirect("/admin/change-password?status=invalid")
    }
    if (newPassword !== confirmPassword) {
      redirect("/admin/change-password?status=mismatch")
    }

    const res = await fetch(`${API}/api/auth/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      cache: "no-store",
    })

    if (!res.ok) {
      redirect("/admin/change-password?status=failed")
    }
    redirect("/admin/change-password?status=ok")
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Change password</h1>

      {params.status === "ok" && (
        <p className="text-sm text-green-600">Password updated.</p>
      )}
      {params.status === "failed" && (
        <p className="text-sm text-red-600">Current password incorrect.</p>
      )}
      {params.status === "mismatch" && (
        <p className="text-sm text-red-600">New passwords do not match.</p>
      )}
      {params.status === "invalid" && (
        <p className="text-sm text-red-600">
          New password must be at least 8 characters.
        </p>
      )}

      <form action={changePassword} className="space-y-4 rounded-lg border p-6">
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Update password
        </button>
      </form>
    </div>
  )
}
