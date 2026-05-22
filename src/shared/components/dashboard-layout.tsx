"use client";

import * as React from "react";

import { AppSidebar } from "@src/shared/components/app-sidebar";
import { Separator } from "@src/shared/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@src/shared/components/ui/sidebar";
import { useTheme } from "../providers/theme-provider";
import { Button } from "./ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{
    href?: string;
    label: string;
  }>;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { setTheme, themeMode } = useTheme();
  const toggleTheme = () => {
    setTheme(themeMode === "light" ? "dark" : "light");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-hairline bg-canvas transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Button onClick={() => toggleTheme()}>
              {themeMode === "light" ? "Dark" : "Light"}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 bg-canvas p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
