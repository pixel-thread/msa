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
  List,
} from "@phosphor-icons/react";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@src/shared/components/ui/sidebar";
import { TooltipProvider } from "@src/shared/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { Button } from "@src/shared/components/ui/button";
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
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="py-4 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-sm shrink-0">
            MFSA
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">MFSA Connect</span>
            <span className="text-xs text-muted-foreground truncate">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.title}</span>
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
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t border-border/60 pt-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
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

function DashboardHeader() {
  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <SidebarTrigger className="h-8 w-8">
        <List className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </SidebarTrigger>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0">
        MFSA
      </div>
      <span className="text-sm font-semibold">MFSA Connect</span>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Redirect>
      <TooltipProvider>
        <SidebarProvider defaultOpen>
          <DashboardSidebar />
          <SidebarInset className="flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </Redirect>
  );
}