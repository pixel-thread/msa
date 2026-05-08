import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  paymentDate: string;
  user: {
    name: string;
    email: string;
  };
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    COMPLETED: "default",
    PENDING: "outline",
    FAILED: "destructive",
    REFUNDED: "secondary",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

const baseColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "user",
    header: "Member",
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm">{payment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {payment.user.email}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {formatCurrency(row.original.amount, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "receiptNumber",
    header: "Receipt",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.receiptNumber || "-"}
      </span>
    ),
  },
  {
    accessorKey: "paymentDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-right text-muted-foreground text-sm block ml-auto">
        {formatDate(row.original.paymentDate)}
      </span>
    ),
  },
];

export const usePaymentTableColumns = (): { columns: ColumnDef<Payment>[] } => {
  const columns: ColumnDef<Payment>[] = [...baseColumns];
  return { columns };
};