"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Textarea } from "@src/shared/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { CreateSupplementSchema, type CreateSupplementInput } from "../validators/training";
import { useTrainingSupplements } from "../hooks";
import { TrainingSupplementType } from "@prisma/client";
import { Paperclip, X } from "lucide-react";

interface AddSupplementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
}

export function AddSupplementDialog({
  open,
  onOpenChange,
  moduleId,
}: AddSupplementDialogProps) {
  const { createSupplement, isCreating } = useTrainingSupplements(moduleId);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<CreateSupplementInput>({
    resolver: zodResolver(CreateSupplementSchema),
    defaultValues: {
      title: "",
      description: "",
      type: TrainingSupplementType.DOCUMENT,
      sortOrder: 0,
      isActive: true,
    },
  });

  const handleClose = useCallback(() => {
    form.reset();
    setFile(null);
    onOpenChange(false);
  }, [form, onOpenChange]);

  const onSubmit = (values: CreateSupplementInput) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(values));

    createSupplement(formData, {
      onSuccess: (res) => {
        if (res.success) {
          form.reset();
          setFile(null);
          onOpenChange(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Supplement</DialogTitle>
          <DialogDescription>
            Add a new supplement to this training module.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplement Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TrainingSupplementType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                {file ? (
                  <div className="flex items-center justify-between rounded-md border border-hairline bg-canvas px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-body truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-hairline bg-canvas px-3 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Paperclip className="h-4 w-4" />
                    Choose file
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !file}>
                {isCreating ? "Adding..." : "Add Supplement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
