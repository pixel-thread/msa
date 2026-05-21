import { useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import { Input } from "@src/shared/components/ui/input";
import { Button } from "@src/shared/components/ui/button";
import { useUpdateAnnouncement } from "@src/features/announcement/hooks/useUpdateAnnouncement";
import {
  UpdateAnnouncementInput,
  UpdateAnnouncementSchema,
} from "@src/features/announcement/validators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Textarea } from "@src/shared/components/ui/textarea";
import { AnnouncementStatus, AnnouncementPriority } from "@prisma/client";
import type { Announcement } from "@src/features/announcement/types";

interface EditAnnouncementDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: EditAnnouncementDialogProps) {
  const updateAnnouncement = useUpdateAnnouncement();

  const form = useForm<UpdateAnnouncementInput>({
    resolver: zodResolver(UpdateAnnouncementSchema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      imageUrl: null,
      status: undefined,
      priority: undefined,
      isPinned: false,
    } as UpdateAnnouncementInput,
  });

  useEffect(() => {
    if (open && announcement) {
      form.reset({
        title: announcement.title,
        summary: announcement.summary ?? "",
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        status: announcement.status as AnnouncementStatus,
        priority: announcement.priority as AnnouncementPriority,
        isPinned: announcement.isPinned,
      });
    }
  }, [open, announcement, form]);

  const onSubmit = (data: UpdateAnnouncementInput) => {
    if (!announcement) return;
    updateAnnouncement.mutate(
      { id: announcement.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update announcement: {announcement.title}
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
                    <Input placeholder="Announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief summary of the announcement"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full announcement content"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AnnouncementStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AnnouncementPriority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0) + priority.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAnnouncement.isPending}>
                {updateAnnouncement.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
