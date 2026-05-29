import Link from 'next/link';
import { Separator } from '@src/shared/components/ui/separator';
import { Text } from '@src/shared/components/ui/text';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Text
              variant="title-sm"
              transform="uppercase"
              className="mb-4 font-heading tracking-wider"
            >
              MFSA Connect
            </Text>
            <Text variant="body-sm" color="muted" className="leading-relaxed">
              Security-first governance platform for Meghalaya Finance Service Association and
              affiliated bodies.
            </Text>
          </div>
          <div>
            <Text variant="caption-strong" transform="uppercase" className="mb-4 block">
              Platform
            </Text>
            <ul className="space-y-2">
              {[
                { label: 'Features', href: '/#features' },
                { label: 'Testimonials', href: '/#testimonials' },
                { label: 'Security', href: '/#security' },
                { label: 'How It Works', href: '/#how-it-works' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Text variant="caption-strong" transform="uppercase" className="mb-4 block">
              Company
            </Text>
            <ul className="space-y-2">
              {[
                { label: 'About', href: '/#about' },
                { label: 'Contact', href: '/#contact' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms of Service', href: '/terms-of-service' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Text variant="caption-strong" transform="uppercase" className="mb-4 block">
              Support
            </Text>
            <ul className="space-y-2">
              {[
                { label: 'Help Center', href: '#' },
                { label: 'Documentation', href: '#' },
                { label: 'API Status', href: '#' },
                { label: 'Contact Support', href: '/#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Text variant="caption" color="muted">
            &copy; {new Date().getFullYear()} Meghalaya Finance Service Association. All rights
            reserved.
          </Text>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
