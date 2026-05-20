import { DashboardLayout } from "@src/shared/components/dashboard-layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }]}>
      {children}
    </DashboardLayout>
  );
}
