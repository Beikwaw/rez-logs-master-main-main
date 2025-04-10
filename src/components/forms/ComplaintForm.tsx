'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createComplaint } from '@/lib/firestore';
import { toast } from 'sonner';

const complaintSchema = z.object({
  category: z.enum(['maintenance', 'security', 'noise', 'cleanliness', 'other']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().optional(),
  roomNumber: z.string(),
  tenantCode: z.string()
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  userId: string;
  onSuccess?: () => void;
  userData: {
    room_number: string;
    tenant_code: string;
  };
}

export function ComplaintForm({ userId, onSuccess, userData }: ComplaintFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'maintenance',
      title: '',
      description: '',
      location: '',
      roomNumber: userData.room_number,
      tenantCode: userData.tenant_code
    },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    try {
      await createComplaint({
        userId,
        ...data,
        status: 'pending'
      });
      toast.success('Complaint submitted successfully');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input
            id="roomNumber"
            {...form.register('roomNumber')}
            defaultValue={userData.room_number}
            readOnly
            className="bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantCode">Tenant Code</Label>
          <Input
            id="tenantCode"
            {...form.register('tenantCode')}
            defaultValue={userData.tenant_code}
            readOnly
            className="bg-gray-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.watch('category')}
          onValueChange={(value) => form.setValue('category', value as ComplaintFormData['category'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="noise">Noise</SelectItem>
            <SelectItem value="cleanliness">Cleanliness</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="Brief description of your complaint"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Detailed description of your complaint"
          className="min-h-[100px]"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          {...form.register('location')}
          placeholder="Where did this occur?"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
      </Button>
    </form>
  );
} 