"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LayoutDashboardIcon, PackageIcon, FolderTreeIcon, ShoppingCartIcon, StarIcon, UsersIcon, LeafIcon, LogOutIcon, ExternalLinkIcon } from "lucide-react"

const navMain = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <PackageIcon />,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: <FolderTreeIcon />,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Reviews",
    url: "/admin/reviews",
    icon: <StarIcon />,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon />,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [user, setUser] = useState({ name: "Admin", email: "admin@florafetch.com", avatar: "" })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json) setUser({ name: json.fullName, email: json.email, avatar: "" })
      })
      .catch(() => {})
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/admin" />}
            >
              <LeafIcon className="size-5!" />
              <span className="text-base font-semibold">FloraFetch</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <ExternalLinkIcon className="size-3.5 shrink-0" />
          View site
        </Link>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Log out"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              router.push("/login")
            }}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
