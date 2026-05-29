'use client';

import { useParams, useRouter } from 'next/navigation';

import { useMember } from '@src/features/members/hooks/useMember';
import { SectionHeader } from '@src/shared/components/section-header';
import { Button } from '@src/shared/components/ui/button';
import { PersonalInfoCard } from '@src/features/members/components/detail/personal-info-card';
import { StatusCard } from '@src/features/members/components/detail/status-card';
import { DatesCard } from '@src/features/members/components/detail/dates-card';
import { PaymentsCard } from '@src/features/members/components/detail/payments-card';
import { ActivityCard } from '@src/features/members/components/detail/activity-card';
import { AccountCard } from '@src/features/members/components/detail/account-card';

export function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const { member, isLoading, error } = useMember(memberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading member details...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Member not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={member.name}
        description="Member details and activity"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <PersonalInfoCard member={member} />

        <div className="space-y-6">
          <StatusCard member={member} />
          <DatesCard member={member} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PaymentsCard member={member} />
        <ActivityCard member={member} />
        <AccountCard member={member} />
      </div>
    </>
  );
}
