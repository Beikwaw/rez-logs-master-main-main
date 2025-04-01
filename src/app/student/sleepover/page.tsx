'use client';

import { useState } from 'react';
import { createSleepoverRequest } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function StudentSleepoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tenantCode: '',
    guestName: '',
    guestSurname: '',
    guestPhoneNumber: '',
    roomNumber: '',
    startDate: '',
    endDate: '',
    additionalGuests: [{ name: '', surname: '', phoneNumber: '' }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createSleepoverRequest({
        userId: user?.uid || '',
        tenantCode: formData.tenantCode,
        guestName: formData.guestName,
        guestSurname: formData.guestSurname,
        guestPhoneNumber: formData.guestPhoneNumber,
        roomNumber: formData.roomNumber,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        additionalGuests: formData.additionalGuests.filter(guest => 
          guest.name && guest.surname && guest.phoneNumber
        )
      });

      router.push('/student/sleepover/history');
    } catch (err) {
      setError('Failed to submit sleepover request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalGuest = () => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: [...prev.additionalGuests, { name: '', surname: '', phoneNumber: '' }]
    }));
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
      <h1 className="text-2xl font-bold mb-6">Submit Sleepover Request</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tenant Code</label>
            <input
              type="text"
              required
              value={formData.tenantCode}
              onChange={(e) => setFormData(prev => ({ ...prev, tenantCode: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room Number</label>
            <input
              type="text"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Guest First Name</label>
            <input
              type="text"
              required
              value={formData.guestName}
              onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Guest Last Name</label>
            <input
              type="text"
              required
              value={formData.guestSurname}
              onChange={(e) => setFormData(prev => ({ ...prev, guestSurname: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Guest Phone Number</label>
            <input
              type="tel"
              required
              value={formData.guestPhoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, guestPhoneNumber: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Additional Guests</h2>
          {formData.additionalGuests.map((guest, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="First Name"
                value={guest.name}
                onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={guest.surname}
                onChange={(e) => updateAdditionalGuest(index, 'surname', e.target.value)}
                className="p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={guest.phoneNumber}
                  onChange={(e) => updateAdditionalGuest(index, 'phoneNumber', e.target.value)}
                  className="p-2 border rounded flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalGuest(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addAdditionalGuest}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Additional Guest
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
} 