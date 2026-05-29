import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Button } from '@src/shared/components/ui/button';
import { Calendar } from '@src/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@src/shared/components/ui/popover';
import { cn } from '@src/shared/lib/utils';
import { formatDate } from '@src/shared/utils/format';
import { CalendarIcon } from 'lucide-react';
import { useMemberTypes } from '@src/features/members/hooks/useMemberTypes';
import { useApproveMember } from '@src/features/members/hooks/useApproveMember';
import { useRejectMember } from '@src/features/members/hooks/useRejectMember';
import { ROLES } from '../utils/constants';
import { MemberListItem } from '../types';

const MemberReviewSchema = z.object({
  memberTypeId: z.string().min(1, 'Member type is required'),
  role: z.string(),
  dateOfJoiningGovt: z.date().optional(),
});

type MemberReviewForm = z.infer<typeof MemberReviewSchema>;

interface MemberReviewDialogProps {
  member: MemberListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberReviewDialog({ member, open, onOpenChange }: MemberReviewDialogProps) {
  const { memberTypes } = useMemberTypes();
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();

  const form = useForm<MemberReviewForm>({
    resolver: zodResolver(MemberReviewSchema),
    defaultValues: {
      memberTypeId: '',
      role: 'MEMBER',
    },
  });

  const onSubmit = (data: MemberReviewForm) => {
    if (!member) return;

    approveMember.mutate(
      {
        applicationId: member.id,
        memberTypeId: data.memberTypeId,
        role: data.role,
        dateOfJoiningGovt: data.dateOfJoiningGovt,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleReject = () => {
    if (!member) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }
    rejectMember.mutate(
      { applicationId: member.id, rejectionReason: reason.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  React.useEffect(() => {
    if (open) {
      form.reset({
        memberTypeId: '',
        role: 'MEMBER',
        dateOfJoiningGovt: undefined,
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Review Member Application</DialogTitle>
          <DialogDescription>
            {member?.name} ({member?.email})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="memberTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {memberTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          Level {type.level}
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
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
              name="dateOfJoiningGovt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Joining Govt</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value.toISOString())
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={rejectMember.isPending}
              >
                Reject
              </Button>
              <Button type="submit" disabled={approveMember.isPending}>
                {approveMember.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
