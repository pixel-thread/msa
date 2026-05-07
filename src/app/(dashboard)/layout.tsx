"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  House,
  Users,
  Calendar,
  CreditCard,
  FileText,
  User,
  Gear,
} from "@phosphor-icons/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@src/shared/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { SidebarInset, SidebarProvider } from "@src/shared/components/ui/sidebar";
import { Redirect } from "@src/shared/components/Redirect";
import { useAuthStore } from "@src/shared/stores/auth";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: House },
  { title: "Members", href: "/dashboard/members", icon: Users },
  { title: "Meetings", href: "/dashboard/meetings", icon: Calendar },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { title: "Documents", href: "/dashboard/documents", icon: FileText },
];

const bottomNavItems = [
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Settings", href: "/dashboard/settings", icon: Gear },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
            MFSA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">MFSA Connect</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user?.email || ""}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Redirect>
      <SidebarProvider defaultOpen>
        <DashboardSidebar />
        <SidebarInset>
          <div className="container mx-auto py-8 space-y-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Redirect>
  );
}