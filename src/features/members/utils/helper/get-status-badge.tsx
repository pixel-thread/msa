import { Badge } from "@components/ui/badge";

export const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ACTIVE: "default",
    INACTIVE: "secondary",
    SUSPENDED: "destructive",
    PENDING: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};
