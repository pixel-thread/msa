import { DashboardLayout } from '@src/shared/components/dashboard-layout';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
