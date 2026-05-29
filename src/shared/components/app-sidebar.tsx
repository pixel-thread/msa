'use client';

import * as React from 'react';

import { NavMain } from '@src/shared/components/nav-main';
import { NavUser } from '@src/shared/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@src/shared/components/ui/sidebar';
import { GalleryVerticalEndIcon } from 'lucide-react';
import { useAuthStore } from '@src/shared/stores/auth';
import { DRAWER_NAV_MAIN } from '../constants/drawer';
import { useAssociation } from '@hooks/use-association';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const { data } = useAssociation();

  const sidebarUser = {
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.imageUrl || '',
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-background data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{data?.slug.toUpperCase()}</span>
                <span className="truncate text-xs">{data?.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={DRAWER_NAV_MAIN} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
