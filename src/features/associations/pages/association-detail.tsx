'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@src/shared/components/ui/avatar';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Input } from '@src/shared/components/ui/input';
import { Textarea } from '@src/shared/components/ui/textarea';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { Spinner } from '@src/shared/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { useUpdateAssociation } from '@src/features/associations/hooks/useUpdateAssociation';
import { useUploadAssociationLogo } from '@src/features/associations/hooks/useUploadAssociationLogo';
import {
  UpdateAssociationInput,
  UpdateAssociationSchema,
} from '@src/features/associations/validators';
import { Camera, Pencil, Save, X, Building2 } from 'lucide-react';
import { useAssociation } from '@hooks/use-association';

export default function AssociationDetailPage() {
  const { data: association, isFetching: isLoading } = useAssociation();
  const updateAssociation = useUpdateAssociation();
  const uploadLogo = useUploadAssociationLogo();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (association) {
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
  }, [association, form]);

  const onSubmit = (data: UpdateAssociationInput) => {
    if (!association) return;
    updateAssociation.mutate(
      { id: association.id, data },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !association) return;
    uploadLogo.mutate({ id: association.id, file });
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  useEffect(() => {
    if (association) {
      form.reset({
        slug: association.slug,
        name: association.name,
        description: association.description ?? '',
        state: association.state ?? '',
        country: association.country,
        contactEmail: association.contactEmail ?? '',
        contactPhone: association.contactPhone ?? '',
        primaryColor: association.primaryColor ?? '',
        secondaryColor: association.secondaryColor ?? '',
      });
    }
  }, [association, form]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="flex items-center gap-6 py-8">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!association) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="mb-4 size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No Association Found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You are not associated with any association.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Association Settings"
        description="Manage your association profile and branding"
      >
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={updateAssociation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateAssociation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </SectionHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <div className="relative">
              <Avatar size="lg" className="rounded-none size-24">
                <AvatarImage
                  className="rounded-none"
                  src={association.logo ?? ''}
                  alt={association.name}
                />
                <AvatarFallback className="text-lg">
                  {association.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending}
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {uploadLogo.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div>
              <p className="font-semibold">{association.name}</p>
              <p className="text-sm text-muted-foreground">{association.slug}</p>
            </div>
            <Badge variant={association.isActive ? 'default' : 'destructive'}>
              {association.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
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
                          <Input placeholder="e.g., mfsa" disabled={!isEditing} {...field} />
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
                          <Input
                            placeholder="e.g., My Federation"
                            disabled={!isEditing}
                            {...field}
                          />
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
                        <Textarea
                          placeholder="Brief description of the association"
                          disabled={!isEditing}
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., IN"
                            maxLength={2}
                            className="uppercase"
                            disabled={!isEditing}
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
                          <Input placeholder="e.g., Maharashtra" disabled={!isEditing} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col w-full gap-2 md:flex-row">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@association.org"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+91 1234567890"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
