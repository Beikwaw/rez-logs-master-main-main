'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { getMySleepoverRequests, SleepoverRequest } from '@/lib/firestore';
import { Loader2 } from 'lucide-react';

export default function StudentSleepoverPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [formData, setFormData] = useState({
    tenantCode: userData?.tenant_code || '',
    roomNumber: userData?.room_number || '',
    guestName: '',
    guestSurname: '',
    guestPhoneNumber: '',
    startDate: '',
    endDate: '',
    additionalGuests: [{ name: '', surname: '', phoneNumber: '' }]
  });

  useEffect(() => {
    if (user && userData) {
      fetchRequests();
    }
  }, [user, userData]);

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        tenantCode: userData.tenant_code,
        roomNumber: userData.room_number
      }));
    }
  }, [userData]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userRequests = await getMySleepoverRequests(user.uid);
      setRequests(userRequests);
    } catch (err) {
      console.error('Error fetching sleepover requests:', err);
      setError('Failed to fetch sleepover requests. Please try again.');
      toast.error('Failed to fetch sleepover requests');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: typeof formData): boolean => {
    const errors: string[] = [];

    if (!data.tenantCode) errors.push('Tenant code is required');
    if (!data.roomNumber) errors.push('Room number is required');
    if (!data.guestName) errors.push('Guest first name is required');
    if (!data.guestSurname) errors.push('Guest last name is required');
    if (!data.guestPhoneNumber) errors.push('Guest phone number is required');
    if (!data.startDate) errors.push('Start date is required');
    if (!data.endDate) errors.push('End date is required');

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push('Start date cannot be in the past');
    }

    if (endDate < startDate) {
      errors.push('End date must be after start date');
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user || !userData) {
        throw new Error('You must be logged in to submit a sleepover request');
      }

      const sleepoverData = {
        userId: user.uid,
        tenantCode: userData.tenant_code,
        roomNumber: userData.room_number,
        guestName: formData.guestName,
        guestSurname: formData.guestSurname,
        guestPhoneNumber: formData.guestPhoneNumber,
        startDate: formData.startDate,
        endDate: formData.endDate,
        additionalGuests: formData.additionalGuests,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'sleepover'), sleepoverData);
      toast.success('Sleepover request submitted successfully');
      setFormData({
        tenantCode: userData.tenant_code,
        roomNumber: userData.room_number,
        guestName: '',
        guestSurname: '',
        guestPhoneNumber: '',
        startDate: '',
        endDate: '',
        additionalGuests: [{ name: '', surname: '', phoneNumber: '' }]
      });
      fetchRequests();
    } catch (err) {
      console.error('Error submitting sleepover request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit sleepover request');
      toast.error('Failed to submit sleepover request');
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

  if (!user || !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to submit a sleepover request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Request Sleepover</h1>
          <p className="text-gray-600 mt-1">Submit and track your sleepover requests</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Requests'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Submit New Request</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Room Number</label>
                <input
                  type="text"
                  value={userData.room_number}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tenant Code</label>
                <input
                  type="text"
                  value={userData.tenant_code}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100"
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
                  placeholder="Enter guest's first name"
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
                  placeholder="Enter guest's last name"
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
                  placeholder="Enter guest's phone number"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Requests</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No sleepover requests submitted</p>
              <p className="text-sm text-gray-500 mt-2">Submit a request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{request.guestName} {request.guestSurname}</h3>
                      <p className="text-sm text-gray-600">Room: {request.roomNumber}</p>
                      <p className="text-sm text-gray-600">Start: {new Date(request.startDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">End: {new Date(request.endDate).toLocaleDateString()}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 