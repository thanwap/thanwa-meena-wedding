import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage wedding website content.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/configs">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Site configs</CardTitle>
              <CardDescription>
                Key/value settings powering the public site.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
