import { Redirect } from "@src/shared/components/Redirect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Redirect>
      <div className="container mx-auto py-6 space-y-6">{children}</div>
    </Redirect>
  );
}

