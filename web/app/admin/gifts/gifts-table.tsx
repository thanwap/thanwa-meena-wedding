"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RiDeleteBinLine, RiDownload2Line, RiImageLine } from "@remixicon/react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/admin/page-header"
import { parseAmount } from "@/lib/gift-notice"
import { deleteAllSlips, deleteGiftNotice, updateGiftNotice, type GiftNoticeDto } from "./actions"

/** Signed slip URLs live 5 minutes; refetch a little before that. */
const SLIP_URL_TTL_MS = 4 * 60 * 1000

const bangkokTime = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})
const baht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 })

export function GiftsTable({ initialNotices }: { initialNotices: GiftNoticeDto[] }) {
  const router = useRouter()
  const [notices, setNotices] = useState(initialNotices)
  const [viewing, setViewing] = useState<GiftNoticeDto | null>(null)
  const [deleting, setDeleting] = useState<GiftNoticeDto | null>(null)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const loadedAt = useRef(0)

  // A refresh brings new rows and fresh slip URLs
  const [source, setSource] = useState(initialNotices)
  if (source !== initialNotices) {
    setSource(initialNotices)
    setNotices(initialNotices)
  }
  useEffect(() => {
    loadedAt.current = Date.now()
  }, [initialNotices])

  const verified = notices.filter((n) => n.verified)
  const verifiedTotal = verified.reduce((sum, n) => sum + (n.amount ?? 0), 0)
  const slipCount = notices.filter((n) => n.hasSlip).length

  function replace(updated: GiftNoticeDto) {
    // PATCH responses carry no slip URL — keep the one we have
    setNotices((list) => list.map((n) => (n.id === updated.id ? { ...updated, slipUrl: n.slipUrl } : n)))
  }

  async function save(notice: GiftNoticeDto, fields: { amount: number | null; verified: boolean }) {
    const result = await updateGiftNotice(notice.id, fields)
    if (result.success) replace(result.data)
    else toast.error(result.error)
  }

  function openSlip(notice: GiftNoticeDto) {
    if (Date.now() - loadedAt.current > SLIP_URL_TTL_MS) router.refresh()
    setViewing(notice)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const result = await deleteGiftNotice(deleting.id)
    setBusy(false)
    if (!result.success) return toast.error(result.error)
    setNotices((list) => list.filter((n) => n.id !== deleting.id))
    toast.success(`Deleted notice from "${deleting.giver}".`)
    setDeleting(null)
  }

  async function confirmWipe() {
    setBusy(true)
    const result = await deleteAllSlips()
    setBusy(false)
    if (!result.success) return toast.error(result.error)
    setNotices((list) => list.map((n) => ({ ...n, hasSlip: false, slipUrl: null })))
    toast.success(`Deleted ${result.data} slip image${result.data === 1 ? "" : "s"}. Notices are kept.`)
    setWipeOpen(false)
  }

  // Keep the dialog's slip URL current after a refresh
  const viewingNow = viewing ? (notices.find((n) => n.id === viewing.id) ?? viewing) : null

  return (
    <div className="space-y-6">
      <PageHeader title="Gifts" subtitle="Transfer notices from guests — match each one to your bank app, then tick Verified.">
        <a href="/api/admin/gift-notices/export.csv" download className={buttonVariants({ variant: "outline" })}>
          <RiDownload2Line />
          Export CSV
        </a>
        <Button variant="outline" onClick={() => setWipeOpen(true)} disabled={slipCount === 0}>
          <RiDeleteBinLine />
          Delete all slips
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Notices" value={String(notices.length)} />
        <Stat label="Verified" value={`${verified.length} / ${notices.length}`} />
        <Stat label="Verified total (฿)" value={baht.format(verifiedTotal)} className="tabular-nums" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giver</TableHead>
                <TableHead>Transferred (Bangkok)</TableHead>
                <TableHead className="w-36">Amount (฿)</TableHead>
                <TableHead>Slip</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                    No transfer notices yet. Guests send them from the gift section under the PromptPay QR.
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((n) => (
                  <TableRow key={n.id} data-state={n.verified ? "selected" : undefined}>
                    <TableCell className="max-w-64 font-medium break-words whitespace-normal">{n.giver}</TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {bangkokTime.format(new Date(n.transferredAt))}
                    </TableCell>
                    <TableCell>
                      <AmountInput key={`${n.id}:${n.amount}`} notice={n} onSave={(amount) => save(n, { amount, verified: n.verified })} />
                    </TableCell>
                    <TableCell>
                      {n.hasSlip ? (
                        <Button variant="ghost" size="sm" onClick={() => openSlip(n)}>
                          <RiImageLine />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={n.verified}
                        onCheckedChange={(checked) => save(n, { amount: n.amount, verified: checked === true })}
                        aria-label={`Verified: ${n.giver}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(n)} aria-label={`Delete notice from ${n.giver}`}>
                        <RiDeleteBinLine />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewingNow !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingNow?.giver}</DialogTitle>
            <DialogDescription>
              {viewingNow && bangkokTime.format(new Date(viewingNow.transferredAt))}
            </DialogDescription>
          </DialogHeader>
          {viewingNow?.slipUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
            <img
              src={viewingNow.slipUrl}
              alt={`Slip from ${viewingNow.giver}`}
              className="max-h-[70vh] w-full rounded-md object-contain"
              onError={() => router.refresh()}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Loading slip…</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this notice?</DialogTitle>
            <DialogDescription>
              The notice from &ldquo;{deleting?.giver}&rdquo; and its slip are removed for good.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all slip images?</DialogTitle>
            <DialogDescription>
              Every slip is deleted, including ones from notices that were never sent. Givers, times,
              amounts and Verified stay. This can&apos;t be undone — export the CSV first if you need it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWipeOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={confirmWipe} disabled={busy}>Delete all slips</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${className ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

/** Saves on blur or Enter, and only when the value actually changed. Keyed by amount, so a saved value resets it. */
function AmountInput({ notice, onSave }: { notice: GiftNoticeDto; onSave: (amount: number | null) => Promise<void> }) {
  const shown = notice.amount === null ? "" : String(notice.amount)
  const [value, setValue] = useState(shown)

  async function commit() {
    const amount = parseAmount(value)
    if (Number.isNaN(amount)) {
      toast.error("Amount must be a number above 0 with at most 2 decimals.")
      setValue(shown)
      return
    }
    if (amount === notice.amount) return
    await onSave(amount)
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      inputMode="decimal"
      placeholder="—"
      className="h-8 tabular-nums"
      aria-label={`Amount from ${notice.giver}`}
    />
  )
}
