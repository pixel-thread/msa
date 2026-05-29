import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Avatar, AvatarFallback } from '@src/shared/components/ui/avatar';
import { Separator } from '@src/shared/components/ui/separator';
import { Mail, Phone, Hash, Briefcase } from 'lucide-react';
import { getInitials } from '@src/features/members/utils/helper/get-initials';
import type { User } from '@src/shared/types';

interface PersonalInfoCardProps {
  member: User;
}

export function PersonalInfoCard({ member }: PersonalInfoCardProps) {
  return (
    <Card className=" border-hairline bg-surface-card md:col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-sm bg-muted">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-ink">{member.name}</p>
              <p className="text-sm text-body">{member.email}</p>
            </div>
          </div>

          <Separator className="bg-hairline" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm text-ink">{member.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mobile</p>
                <p className="text-sm text-ink">{member.mobile || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Membership Number</p>
                <p className="text-sm text-ink">{member.membershipNumber || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Designation</p>
                <p className="text-sm text-ink">{member.designation || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
