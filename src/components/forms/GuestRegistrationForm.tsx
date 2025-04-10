'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createGuestRegistration } from '@/lib/firestore';

interface GuestRegistrationFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  userData: {
    room_number: string;
    tenant_code: string;
  };
}

interface FormData {
  guestName: string;
  guestEmail: string;
  visitDate: string;
  visitTime: string;
  purpose: string;
  roomNumber: string;
  tenantCode: string;
}

export function GuestRegistrationForm({ userId, onSuccess, onCancel, userData }: GuestRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      roomNumber: userData.room_number,
      tenantCode: userData.tenant_code
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createGuestRegistration({
        userId,
        ...data,
        status: 'pending'
      });
      toast.success('Guest registration submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting guest registration:', error);
      toast.error('Failed to submit guest registration');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="roomNumber">Room Number</Label>
        <Input
          id="roomNumber"
          {...register('roomNumber')}
          value={userData.room_number}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenantCode">Tenant Code</Label>
        <Input
          id="tenantCode"
          {...register('tenantCode')}
          value={userData.tenant_code}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestName">Guest Name</Label>
        <Input
          id="guestName"
          {...register('guestName', {
            required: 'Guest name is required',
          })}
        />
        {errors.guestName && (
          <p className="text-sm text-red-500">{errors.guestName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestEmail">Guest Email</Label>
        <Input
          id="guestEmail"
          type="email"
          {...register('guestEmail', {
            required: 'Guest email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.guestEmail && (
          <p className="text-sm text-red-500">{errors.guestEmail.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitDate">Visit Date</Label>
        <Input
          id="visitDate"
          type="date"
          {...register('visitDate', {
            required: 'Visit date is required',
            validate: value => new Date(value).getTime() >= new Date().setHours(0, 0, 0, 0) || 'Visit date must be today or later',
          })}
        />
        {errors.visitDate && (
          <p className="text-sm text-red-500">{errors.visitDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitTime">Visit Time</Label>
        <Input
          id="visitTime"
          type="time"
          {...register('visitTime', {
            required: 'Visit time is required',
          })}
        />
        {errors.visitTime && (
          <p className="text-sm text-red-500">{errors.visitTime.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose of Visit</Label>
        <Input
          id="purpose"
          {...register('purpose', {
            required: 'Purpose of visit is required',
          })}
        />
        {errors.purpose && (
          <p className="text-sm text-red-500">{errors.purpose.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
} 