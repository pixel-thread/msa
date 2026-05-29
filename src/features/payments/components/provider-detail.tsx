'use client';

import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Separator } from '@src/shared/components/ui/separator';
import { Pencil, Trash2 } from 'lucide-react';
import { ProviderResponse } from '../types';

interface ProviderDetailProps {
  provider: ProviderResponse;
  onEdit?: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function ProviderDetail({ provider, onEdit, onDelete, isDeleting }: ProviderDetailProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className=" border-hairline bg-surface-card md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Provider Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Provider</p>
                <p className="text-lg font-medium text-ink mt-1 capitalize">
                  {provider.provider.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge
                    variant={provider.isActive ? 'default' : 'secondary'}
                    className={provider.isActive ? 'bg-green-600' : ''}
                  >
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Key ID</p>
                <p className="text-sm text-ink mt-1 font-mono">{provider.keyId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-sm text-ink mt-1">
                  {new Date(provider.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Provider
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Provider'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-sm text-ink mt-1">
                  {new Date(provider.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Separator className="bg-hairline" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm text-ink mt-1">
                  {new Date(provider.updatedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
