'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSleepoverRequest } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function NewSleepoverRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    
    guestName: '',
    guestSurname: '',
    roomNumber: '',
    startDate: '',
    endDate: '',
    additionalGuests: [{ name: '', surname: '', phoneNumber: '' }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Validate additional guests count
      if (formData.additionalGuests.length > 3) {
        toast.error('Maximum of 3 additional guests allowed');
        return;
      }

      // Filter out empty additional guests
      const validAdditionalGuests = formData.additionalGuests.filter(
        guest => guest.name && guest.surname && guest.phoneNumber
      );

      await createSleepoverRequest({
        userId: user.uid,
        guestName: formData.guestName,
        guestSurname: formData.guestSurname,
        roomNumber: formData.roomNumber,
        additionalGuests: validAdditionalGuests,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      });

      toast.success('Sleepover request submitted successfully');
      router.push('/student/sleepovers');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  const addAdditionalGuest = () => {
    if (formData.additionalGuests.length < 3) {
      setFormData(prev => ({
        ...prev,
        additionalGuests: [...prev.additionalGuests, { name: '', surname: '', phoneNumber: '' }]
      }));
    }
  };

  const removeAdditionalGuest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalGuest = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.map((guest, i) => 
        i === index ? { ...guest, [field]: value } : guest
      )
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">New Sleepover Request</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Guest Name</label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Guest Surname</label>
            <input
              type="text"
              value={formData.guestSurname}
              onChange={(e) => setFormData(prev => ({ ...prev, guestSurname: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Number</label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Additional Guests */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Additional Guests</label>
              {formData.additionalGuests.length < 3 && (
                <button
                  type="button"
                  onClick={addAdditionalGuest}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add Guest
                </button>
              )}
            </div>
            {formData.additionalGuests.map((guest, index) => (
              <div key={index} className="border p-4 rounded-lg mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Guest {index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAdditionalGuest(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Name</label>
                    <input
                      type="text"
                      value={guest.name}
                      onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Surname</label>
                    <input
                      type="text"
                      value={guest.surname}
                      onChange={(e) => updateAdditionalGuest(index, 'surname', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Phone Number</label>
                    <input
                      type="tel"
                      value={guest.phoneNumber}
                      onChange={(e) => updateAdditionalGuest(index, 'phoneNumber', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/student/sleepovers')}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 