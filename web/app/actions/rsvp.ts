"use server"

const API = process.env.DOTNET_API_URL!

export async function submitRsvp(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const hpWebsite = formData.get("hp_website") as string | null
    const attending = formData.get("attending") === "true"
    const name = (formData.get("name") as string | null) ?? ""
    const guestsRaw = (formData.get("guestCount") as string | null) ?? "1"
    const guestCount = guestsRaw === "6+" ? 6 : parseInt(guestsRaw, 10)
    const dietary = (formData.get("dietary") as string | null) || null
    const message = (formData.get("message") as string | null) || null

    const body = {
      attending,
      name,
      guestCount,
      dietary,
      message,
      hpWebsite: hpWebsite || null,
    }

    const res = await fetch(`${API}/api/rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      return { success: false, error: "Too many submissions. Please try again later." }
    }

    if (res.status === 400) {
      const text = await res.text().catch(() => "")
      return { success: false, error: text || "Invalid submission." }
    }

    if (!res.ok) {
      return { success: false, error: `Submission failed (${res.status}).` }
    }

    return { success: true }
  } catch (err) {
    console.error("[submitRsvp]", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
