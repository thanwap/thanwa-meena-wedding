"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { NAV_GROUPS } from "./_nav"

interface AdminShellProps {
  children: React.ReactNode
  userName: string | null | undefined
  userRole: string | undefined
  signOutAction: () => Promise<void>
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AdminShell({
  children,
  userName,
  userRole,
  signOutAction,
}: AdminShellProps) {
  const pathname = usePathname()
  const isSuperAdmin = userRole === "super_admin"
  const roleLabel = isSuperAdmin ? "Super Admin" : "Viewer"
  const initials = getInitials(userName)

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/admin" />}
                tooltip="Admin Home"
              >
                <span className="font-semibold text-sm">
                  Thanwa &amp; Meena
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.superAdminOnly || isSuperAdmin
            )
            if (visibleItems.length === 0) return null
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            tooltip={item.label}
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-none px-2 py-1 text-left text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  aria-label={`User menu for ${userName ?? "unknown"}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase">
                    {initials}
                  </span>
                  <div className="flex flex-col gap-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-medium">{userName}</span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {roleLabel}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-48">
                  <DropdownMenuItem render={<Link href="/admin/change-password" />}>
                    Change password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <DropdownMenuItem
                      render={<button type="submit" className="w-full cursor-pointer" />}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <ThemeToggle />
        </header>
        <div className="px-6 py-8">{children}</div>
      </SidebarInset>

      <Toaster />
    </SidebarProvider>
  )
}
