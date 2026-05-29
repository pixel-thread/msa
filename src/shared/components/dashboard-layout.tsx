'use client';

import * as React from 'react';

import { AppSidebar } from '@src/shared/components/app-sidebar';
import { Separator } from '@src/shared/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@src/shared/components/ui/sidebar';
import { useTheme } from '../providers/theme-provider';
import { Button } from './ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Ternary } from './Ternary';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { setTheme, themeMode } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-hairline bg-canvas transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center w-full justify-between gap-2 px-4">
            <div className="flex items-center">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
            </div>
            <Button variant={'ghost'} onClick={() => toggleTheme()}>
              <Ternary
                condition={mounted}
                ifTrue={
                  <Ternary
                    condition={themeMode === 'light'}
                    ifTrue={<MoonIcon />}
                    ifFalse={<SunIcon />}
                  />
                }
                ifFalse={<div className="size-5" />}
              />
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 bg-canvas p-6 min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
