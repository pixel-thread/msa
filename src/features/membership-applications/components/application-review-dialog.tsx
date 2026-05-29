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
import { useApproveApplication } from '@src/features/membership-applications/hooks/useApproveApplication';
import { useRejectApplication } from '@src/features/membership-applications/hooks/useRejectApplication';
import { MembershipApplicationListItem } from '../types';
import { ROLES } from '@src/features/members/utils/constants';

const ApplicationReviewSchema = z.object({
  memberTypeId: z.string().min(1, 'Member type is required'),
  role: z.string(),
  dateOfJoiningGovt: z.date().optional(),
});

type ApplicationReviewForm = z.infer<typeof ApplicationReviewSchema>;

interface ApplicationReviewDialogProps {
  application: MembershipApplicationListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationReviewDialog({
  application,
  open,
  onOpenChange,
}: ApplicationReviewDialogProps) {
  const { memberTypes } = useMemberTypes();
  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();

  const form = useForm<ApplicationReviewForm>({
    resolver: zodResolver(ApplicationReviewSchema),
    defaultValues: {
      memberTypeId: '',
      role: 'MEMBER',
    },
  });

  const onSubmit = (data: ApplicationReviewForm) => {
    if (!application) return;

    approveApplication.mutate(
      {
        applicationId: application.id,
        memberTypeId: data.memberTypeId,
        role: data.role,
        dateOfJoiningGovt: data.dateOfJoiningGovt,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleReject = () => {
    if (!application) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }
    rejectApplication.mutate(
      { applicationId: application.id, rejectionReason: reason.trim() },
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

  if (!application) return null;

  const fullName = `${application.firstName ?? ''} ${application.lastName}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Review Membership Application</DialogTitle>
          <DialogDescription>
            {fullName} ({application.email})
          </DialogDescription>
        </DialogHeader>

        <div className=" border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Phone:</span> {application.phone}
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span> {application.age}
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span> {application.gender}
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>{' '}
              {[application.city, application.state, application.country]
                .filter(Boolean)
                .join(', ') || '—'}
            </div>
            {application.address && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span> {application.address}
              </div>
            )}
          </div>
        </div>

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
                disabled={rejectApplication.isPending}
              >
                Reject
              </Button>
              <Button type="submit" disabled={approveApplication.isPending}>
                {approveApplication.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
