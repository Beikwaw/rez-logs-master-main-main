'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createMaintenanceRequest } from '@/lib/firestore';
import { toast } from 'sonner';

interface MaintenanceRequestFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  userData: {
    room_number: string;
    tenant_code: string;
  };
}

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'bedroom' | 'bathroom' | 'kitchen' | 'other';
  roomNumber: string;
  tenantCode: string;
  preferredDate: string;
  timeSlot: string;
}

export function MaintenanceRequestForm({ userId, onSuccess, onCancel, userData }: MaintenanceRequestFormProps) {
  // Generate time slots from 9:00 to 16:00
  const timeSlots = Array.from({ length: 8 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      roomNumber: userData.room_number,
      tenantCode: userData.tenant_code,
      priority: 'low',
      timeSlot: timeSlots[0],
      category: 'bedroom'
    }
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: FormData) => {
    try {
      const requestId = await createMaintenanceRequest({
        userId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        roomNumber: data.roomNumber,
        tenantCode: data.tenantCode,
        preferredDate: data.preferredDate,
        timeSlot: data.timeSlot
      });
      
      toast.success('Maintenance request submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('Failed to submit maintenance request');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="roomNumber">Room Number</Label>
        <Input
          id="roomNumber"
          {...register('roomNumber')}
          defaultValue={userData.room_number}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenantCode">Tenant Code</Label>
        <Input
          id="tenantCode"
          {...register('tenantCode')}
          defaultValue={userData.tenant_code}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Maintenance Category</Label>
        <Select
          onValueChange={(value) => setValue('category', value as FormData['category'])}
          defaultValue="bedroom"
          {...register('category', { required: 'Category is required' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bedroom">Bedroom</SelectItem>
            <SelectItem value="bathroom">Bathroom</SelectItem>
            <SelectItem value="kitchen">Kitchen</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Brief description of the issue"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Detailed description of the maintenance issue"
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredDate">Preferred Date</Label>
        <Input
          type="date"
          id="preferredDate"
          {...register('preferredDate', { required: 'Preferred date is required' })}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors.preferredDate && (
          <p className="text-sm text-red-500">{errors.preferredDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeSlot">Preferred Time</Label>
        <Select
          onValueChange={(value) => setValue('timeSlot', value)}
          defaultValue={timeSlots[0]}
          {...register('timeSlot', { required: 'Time slot is required' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time slot" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timeSlot && (
          <p className="text-sm text-red-500">{errors.timeSlot.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
          defaultValue="low"
          {...register('priority', { required: 'Priority is required' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-sm text-red-500">{errors.priority.message}</p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
        <p className="text-sm text-yellow-800">
          Service delivery is dependent on staff availability. Weekend requests are subject to change.
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
} 