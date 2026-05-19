"use client"

import * as React from "react"

import { NavMain } from "@src/shared/components/nav-main"
import { NavUser } from "@src/shared/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@src/shared/components/ui/sidebar"
import { GalleryVerticalEndIcon, UsersIcon, LayoutDashboardIcon, Settings2Icon, CalendarDaysIcon } from "lucide-react"
import { useAuthStore } from "@src/shared/stores/auth"

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Members",
    url: "/dashboard/members",
    icon: <UsersIcon />,
    isActive: true,
    items: [
      {
        title: "All Members",
        url: "/dashboard/members",
      },
      {
        title: "Pending Members",
        url: "/dashboard/members/pending",
      },
    ],
  },
  {
    title: "Meetings",
    url: "/dashboard/meetings",
    icon: <CalendarDaysIcon />,
    isActive: true,
    items: [
      {
        title: "All Meetings",
        url: "/dashboard/meetings",
      },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      {
        title: "General",
        url: "#",
      },
      {
        title: "Change Password",
        url: "/change-password",
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, fetchUser } = useAuthStore()

  React.useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [user, fetchUser])

  const sidebarUser = {
    name: user?.name || "User",
    email: user?.email || "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">MFSA</span>
                <span className="truncate text-xs">Association Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
