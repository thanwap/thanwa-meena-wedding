import { redirect } from "next/navigation"
import { signIn, auth } from "@/auth"
import { AuthError } from "next-auth"

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
      if (err instanceof AuthError) {
        redirect(`/admin/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`)
      }
      throw err
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Admin login</h1>

        {params.error && (
          <p className="text-sm text-red-600">Invalid username or password.</p>
        )}

        <input
          type="hidden"
          name="callbackUrl"
          value={params.callbackUrl ?? "/admin"}
        />

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}
