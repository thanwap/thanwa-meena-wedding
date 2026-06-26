import { redirect } from "next/navigation"
import { signIn, auth } from "@/auth"
import { AuthError } from "next-auth"
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  if (session) redirect(params.callbackUrl ?? "/admin")

  async function login(formData: FormData) {
    "use server"
    const username = formData.get("username")
    const password = formData.get("password")
    const callbackUrl =
      (formData.get("callbackUrl") as string | null) ?? "/admin"

    try {
      await signIn("credentials", {
        username,
        password,
        redirectTo: callbackUrl,
      })
    } catch (err) {
      // NEXT_REDIRECT is thrown by Next.js on successful redirect — let it through
      if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err
      if (err instanceof AuthError) {
        redirect(`/admin/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`)
      }
      // Network errors, API down, etc. — show generic error instead of silent failure
      redirect(`/admin/login?error=unavailable&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin login</CardTitle>
        </CardHeader>

        <form action={login}>
          <CardContent className="space-y-4">
            {params.error === "invalid" && (
              <p className="text-sm text-destructive">Invalid username or password.</p>
            )}
            {params.error === "unavailable" && (
              <p className="text-sm text-destructive">Service unavailable. Please try again shortly.</p>
            )}

            <input
              type="hidden"
              name="callbackUrl"
              value={params.callbackUrl ?? "/admin"}
            />

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter>
            <SubmitButton label="Sign in" loadingLabel="Signing in…" />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
