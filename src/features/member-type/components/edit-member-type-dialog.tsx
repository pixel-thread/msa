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
import { Button } from '@src/shared/components/ui/button';
import { useUpdateMemberType } from '@src/features/member-type/hooks/useUpdateMemberType';
import {
  UpdateMemberTypeInput,
  UpdateMemberTypeSchema,
} from '@src/features/member-type/validators';

interface MemberType {
  id: string;
  level: number;
  description: string | null;
}

interface EditMemberTypeDialogProps {
  memberType: MemberType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberTypeDialog({
  memberType,
  open,
  onOpenChange,
}: EditMemberTypeDialogProps) {
  const updateMemberType = useUpdateMemberType();

  const form = useForm<UpdateMemberTypeInput>({
    resolver: zodResolver(UpdateMemberTypeSchema),
    defaultValues: {
      description: '',
      level: undefined,
    },
  });

  useEffect(() => {
    if (open && memberType) {
      form.reset({
        description: memberType.description ?? '',
        level: memberType.level,
      });
    }
  }, [open, memberType, form]);

  const onSubmit = (data: UpdateMemberTypeInput) => {
    if (!memberType) return;
    updateMemberType.mutate(
      { id: memberType.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  if (!memberType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member Type</DialogTitle>
          <DialogDescription>Update member type level {memberType.level}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                      }
                    />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Regular Member, Senior Member" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMemberType.isPending}>
                {updateMemberType.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
