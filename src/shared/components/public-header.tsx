'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@src/shared/components/ui/navigation-menu';
import { Button } from '@src/shared/components/ui/button';
import { useAuthStore } from '@src/shared/stores/auth';
import { useSignOut } from '@src/features/auth/hooks';
import { env } from '@src/env';

const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/#about' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Security', href: '/#security' },
  { label: 'Contact', href: '/#contact' },
];

export function PublicHeader() {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { mutate: logout, isPending: isLoading } = useSignOut();
  const pathname = usePathname();
  const isSignIn = pathname.startsWith('/sign-in');
  const isSignUp = pathname.startsWith('/sign-up');

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-wider text-primary uppercase"
        >
          {env.NEXT_PUBLIC_ASSOCIATION_SLUG.toUpperCase()}
        </Link>

        <NavigationMenu className="hidden md:flex" viewport={false}>
          <NavigationMenuList>
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  href={item.href}
                  className="px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-colors hover:text-primary"
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-x-2">
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                disabled={isAuthLoading || isLoading}
                onClick={() => logout()}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              {!isSignIn && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
              {!isSignUp && (
                <Button asChild variant="default" size="sm">
                  <Link href="/sign-up">Join Now</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
