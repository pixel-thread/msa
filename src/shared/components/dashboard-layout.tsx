"use client";

import * as React from "react";

import { AppSidebar } from "@src/shared/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@src/shared/components/ui/breadcrumb";
import { Separator } from "@src/shared/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@src/shared/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{
    href?: string;
    label: string;
  }>;
}

export function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
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
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <React.Fragment key={crumb.label}>
                        {index > 0 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem className="hidden md:block">
                          {isLast ? (
                            <BreadcrumbPage className="text-ink">
                              {crumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={crumb.href || "#"}
                              className="text-body hover:text-ink"
                            >
                              {crumb.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 bg-canvas p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
