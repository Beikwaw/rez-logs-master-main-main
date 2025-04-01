'use client';

import { useEffect, useState } from 'react';
import { getAllSleepoverRequests, getTodaySleepoverRequests, updateSleepoverStatus } from '@/lib/firestore';
import { SleepoverRequest } from '@/lib/firestore';
import { format } from 'date-fns';

export default function AdminSleepoversPage() {
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [showHistory]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = showHistory 
        ? await getAllSleepoverRequests()
        : await getTodaySleepoverRequests();
      setRequests(data);
    } catch (err) {
      setError('Failed to fetch sleepover requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected', response?: string) => {
    try {
      await updateSleepoverStatus(requestId, status, response);
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error('Error updating request status:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sleepover Requests</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showHistory ? 'Show Today\'s Requests' : 'Show History'}
        </button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Tenant Code</p>
                <p>{request.tenantCode}</p>
              </div>
              <div>
                <p className="font-semibold">Guest Name</p>
                <p>{request.guestName} {request.guestSurname}</p>
              </div>
              <div>
                <p className="font-semibold">Guest Number</p>
                <p>{request.guestPhoneNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Room Number</p>
                <p>{request.roomNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Duration of Stay</p>
                <p>{request.durationOfStay}</p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p className={`font-semibold ${
                  request.status === 'approved' ? 'text-green-600' :
                  request.status === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </p>
              </div>
            </div>

            {request.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            )}

            {request.adminResponse && (
              <div className="mt-4">
                <p className="font-semibold">Admin Response:</p>
                <p>{request.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No {showHistory ? 'historical' : 'today\'s'} sleepover requests found.
        </div>
      )}
    </div>
  );
} 