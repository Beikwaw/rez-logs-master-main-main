'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSleepoverRequest } from '@/lib/firestore';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface SleepoverRequestFormProps {
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
  guestSurname: string;
  guestPhoneNumber: string;
  roomNumber: string;
  tenantCode: string;
  startDate: string;
  endDate: string;
  additionalGuests: Array<{
    name: string;
    surname: string;
    phoneNumber: string;
  }>;
}

export function SleepoverRequestForm({ userId, onSuccess, onCancel, userData }: SleepoverRequestFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      roomNumber: userData.room_number,
      tenantCode: userData.tenant_code
    }
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData | null>(null);

  const startDate = watch('startDate');

  const onSubmit = async (data: FormData) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    
    setIsSubmitting(true);
    try {
      await createSleepoverRequest({
        userId,
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: 'pending'
      });
      toast.success('Sleepover request submitted successfully');
      setShowConfirmation(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting sleepover request:', error);
      toast.error('Failed to submit sleepover request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name</Label>
            <Input
              id="guestName"
              {...register('guestName', { required: 'Guest name is required' })}
              placeholder="Guest name"
            />
            {errors.guestName && (
              <p className="text-sm text-red-500">{errors.guestName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestSurname">Guest Surname</Label>
            <Input
              id="guestSurname"
              {...register('guestSurname', { required: 'Guest surname is required' })}
              placeholder="Guest surname"
            />
            {errors.guestSurname && (
              <p className="text-sm text-red-500">{errors.guestSurname.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestPhoneNumber">Guest Phone Number</Label>
          <Input
            id="guestPhoneNumber"
            type="tel"
            {...register('guestPhoneNumber', { 
              required: 'Guest phone number is required',
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: 'Invalid phone number'
              }
            })}
            placeholder="Guest phone number"
          />
          {errors.guestPhoneNumber && (
            <p className="text-sm text-red-500">{errors.guestPhoneNumber.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate', { 
                required: 'Start date is required',
                validate: value => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return new Date(value).getTime() >= today.getTime() || 'Start date must be today or later';
                }
              })}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate', { 
                required: 'End date is required',
                validate: value => !startDate || new Date(value).getTime() >= new Date(startDate).getTime() || 'End date must be after start date'
              })}
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onCancel?.()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="relative">
            <Image
              src="/my-domain-logo.png"
              alt="My Domain Logo"
              width={200}
              height={100}
              className="absolute top-4 right-4"
              priority
            />
            <DialogHeader className="mb-16 pr-16">
              <DialogTitle>Confirm Sleepover Request</DialogTitle>
            </DialogHeader>
          </div>
          
          {formData && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Guest Information</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">Full Name:</span> {formData.guestName} {formData.guestSurname}</p>
                  <p><span className="font-semibold">Phone Number:</span> {formData.guestPhoneNumber}</p>
                  <p><span className="font-semibold">Room Number:</span> {formData.roomNumber}</p>
                  <p><span className="font-semibold">Tenant Code:</span> {formData.tenantCode}</p>
                  <p><span className="font-semibold">Duration:</span> {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}