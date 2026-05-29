import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@src/shared/components/ui/textarea';
import { Button } from '@src/shared/components/ui/button';
import { useUpdateAssociation } from '@src/features/associations/hooks/useUpdateAssociation';
import {
  UpdateAssociationInput,
  UpdateAssociationSchema,
} from '@src/features/associations/validators';

interface Association {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country: string;
  state: string | null;
  contactEmail: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface EditAssociationDialogProps {
  association: Association | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAssociationDialog({
  association,
  open,
  onOpenChange,
}: EditAssociationDialogProps) {
  const updateAssociation = useUpdateAssociation();

  const form = useForm<UpdateAssociationInput>({
    resolver: zodResolver(UpdateAssociationSchema),
    defaultValues: {
      slug: '',
      name: '',
      description: '',
      state: '',
      country: 'IN',
      contactEmail: '',
      primaryColor: '',
      secondaryColor: '',
    },
  });

  useEffect(() => {
    if (open && association) {
      form.reset({
        slug: association.slug,
        name: association.name,
        description: association.description ?? '',
        state: association.state ?? '',
        country: association.country,
        contactEmail: association.contactEmail ?? '',
        primaryColor: association.primaryColor ?? '',
        secondaryColor: association.secondaryColor ?? '',
      });
    }
  }, [open, association, form]);

  const onSubmit = (data: UpdateAssociationInput) => {
    if (!association) return;
    updateAssociation.mutate(
      { id: association.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  if (!association) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Association</DialogTitle>
          <DialogDescription>Update settings for {association.name}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., mfsa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Federation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the association" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., IN"
                        maxLength={2}
                        className="uppercase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Maharashtra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@association.org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <div
                          className="h-9 w-9 border shrink-0"
                          style={{
                            backgroundColor: field.value || '#1f2937',
                          }}
                        />
                        <Input placeholder="#1f2937" className="font-mono" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <div
                          className="h-9 w-9 border shrink-0"
                          style={{
                            backgroundColor: field.value || '#3b82f6',
                          }}
                        />
                        <Input placeholder="#3b82f6" className="font-mono" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAssociation.isPending}>
                {updateAssociation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
