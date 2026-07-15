"use client"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { LayoutDashboardIcon, PackageIcon, FolderTreeIcon, ShoppingCartIcon, StarIcon, UsersIcon, LeafIcon } from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@florafetch.com",
    avatar: "",
  },
  navMain: [
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
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
