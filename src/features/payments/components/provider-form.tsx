"use client";

import { useState } from "react";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Label } from "@src/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Switch } from "@src/shared/components/ui/switch";
import { ProviderResponse } from "../types";

const PROVIDER_TYPES = ["RAZORPAY", "STRIPE", "PAYU", "CASHFREE"] as const;

interface ProviderFormProps {
  initialData?: ProviderResponse;
  isPending: boolean;
  onSubmit: (data: {
    provider: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    isActive?: boolean;
  }) => void;
}

export function ProviderForm({
  initialData,
  isPending,
  onSubmit,
}: ProviderFormProps) {
  const isEdit = !!initialData;
  const [provider, setProvider] = useState(initialData?.provider ?? "");
  const [keyId, setKeyId] = useState(initialData?.keyId ?? "");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      provider,
      keyId,
      ...(keySecret ? { keySecret } : {}),
      ...(webhookSecret ? { webhookSecret } : {}),
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="provider">Provider Type</Label>
          <Select value={provider} onValueChange={setProvider} disabled={isEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="keyId">Key ID</Label>
        <Input
          id="keyId"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current" : "Enter key ID"}
          required={!isEdit}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="keySecret">Key Secret</Label>
        <Input
          id="keySecret"
          type="password"
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current" : "Enter key secret"}
          required={!isEdit}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="webhookSecret">Webhook Secret</Label>
        <Input
          id="webhookSecret"
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>Active</Label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Saving..."
          : isEdit
            ? "Update Provider"
            : "Add Provider"}
      </Button>
    </form>
  );
}
