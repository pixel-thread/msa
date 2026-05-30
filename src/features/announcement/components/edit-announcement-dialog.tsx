import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { Input } from '@src/shared/components/ui/input';
import { Button } from '@src/shared/components/ui/button';
import { useUpdateAnnouncement } from '@src/features/announcement/hooks/useUpdateAnnouncement';
import { useUploadAnnouncementImage } from '@src/features/announcement/hooks/useUploadAnnouncementImage';
import {
  UpdateAnnouncementInput,
  UpdateAnnouncementSchema,
} from '@src/features/announcement/validators';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Textarea } from '@src/shared/components/ui/textarea';
import { AnnouncementStatus, AnnouncementPriority } from '@prisma/client';
import type { Announcement } from '@src/features/announcement/types';
import { ImageIcon, Upload, X } from 'lucide-react';

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
  const { uploadImage, isUploading } = useUploadAnnouncementImage(announcement?.id as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(UpdateAnnouncementSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      imageUrl: null,
      status: undefined,
      priority: undefined,
      isPinned: false,
    } as UpdateAnnouncementInput,
  });

  const previewUrl = useWatch({
    control: form.control,
    name: 'imageUrl',
  });

  useEffect(() => {
    if (open && announcement) {
      form.reset({
        title: announcement.title,
        summary: announcement.summary ?? '',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    uploadImage(file, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      onError: () => {
        URL.revokeObjectURL(objectUrl);
      },
    });
  };

  const currentFile = announcement?.imageFile;

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>Update announcement: {announcement.title}</DialogDescription>
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
                    <Textarea placeholder="Brief summary of the announcement" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="space-y-2">
              <FormLabel>Image</FormLabel>
              {previewUrl ? (
                <div className="relative overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="Announcement image"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isUploading ? 'Uploading...' : 'Change'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        form.setValue('imageUrl', null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {currentFile && (
                    <div className="px-3 py-1.5 bg-muted text-xs text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="h-3 w-3" />
                      {currentFile.originalName}
                      {' — '}
                      {(currentFile.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Click to upload an image'}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAnnouncement.isPending}>
                {updateAnnouncement.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
