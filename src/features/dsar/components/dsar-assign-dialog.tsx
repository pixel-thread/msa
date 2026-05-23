"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Button } from "@src/shared/components/ui/button";
import { Label } from "@src/shared/components/ui/label";
import { useAssignDsarTicket, useAssociationAdmins } from "../hooks";
import type { DsarTicketRecord } from "../types";

interface DsarAssignDialogProps {
  record: DsarTicketRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DsarAssignDialog({
  record,
  open,
  onOpenChange,
}: DsarAssignDialogProps) {
  const [selectedAdminId, setSelectedAdminId] = useState("");

  const { admins, isLoading: adminsLoading } = useAssociationAdmins();
  const assignMutation = useAssignDsarTicket();

  const handleSubmit = () => {
    if (!record || !selectedAdminId) return;

    assignMutation.mutate(
      { id: record.id, assignedToId: selectedAdminId },
      {
        onSuccess: () => {
          setSelectedAdminId("");
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = () => {
    setSelectedAdminId("");
    onOpenChange(false);
  };

  if (!record) return null;

  const currentAssigneeId = record.assignedTo?.id || "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign DSAR Ticket</DialogTitle>
          <DialogDescription>
            {record.ticketNumber} — Choose an administrator to handle this request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select
            value={selectedAdminId || currentAssigneeId}
            onValueChange={setSelectedAdminId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={adminsLoading ? "Loading..." : "Select administrator"}
              />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name || admin.email || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isPending || !selectedAdminId}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
