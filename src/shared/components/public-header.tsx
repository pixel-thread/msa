"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@src/shared/components/ui/navigation-menu";
import { Button } from "@src/shared/components/ui/button";
import { useAuthStore } from "@src/shared/stores/auth";

const NAV_ITEMS = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Security", href: "/#security" },
  { label: "Contact", href: "/#contact" },
];

export function PublicHeader() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const isSignIn = pathname.startsWith("/sign-in");
  const isSignUp = pathname.startsWith("/sign-up");

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-wider uppercase"
        >
          MFSA Connect
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
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
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
