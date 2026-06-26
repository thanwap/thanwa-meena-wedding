import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SubmitButton } from "@/components/submit-button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>

        <form action={changePassword}>
          <CardContent className="space-y-4">
            {params.status === "ok" && (
              <p className="text-sm text-green-600">Password updated.</p>
            )}
            {params.status === "failed" && (
              <p className="text-sm text-destructive">Current password incorrect.</p>
            )}
            {params.status === "mismatch" && (
              <p className="text-sm text-destructive">New passwords do not match.</p>
            )}
            {params.status === "invalid" && (
              <p className="text-sm text-destructive">
                New password must be at least 8 characters.
              </p>
            )}

            <div className="space-y-1">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter>
            <SubmitButton label="Update password" loadingLabel="Updating…" />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
