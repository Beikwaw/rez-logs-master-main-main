'use client';

import { useState, useEffect } from 'react';
import { getMySleepoverRequests } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import Link from 'next/link';

export default function StudentSleepoverHistoryPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const userRequests = await getMySleepoverRequests(user?.uid || '');
      setRequests(userRequests);
    } catch (err) {
      setError('Failed to fetch sleepover requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sleepover Request History</h1>
        <Link
          href="/student/sleepover"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Request
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No sleepover requests found.</p>
          <Link
            href="/student/sleepover"
            className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
          >
            Submit your first request
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {request.guestName} {request.guestSurname}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Tenant Code</p>
                      <p>{request.tenantCode}</p>
                    </div>
                    <div>
                      <p className="font-medium">Room Number</p>
                      <p>{request.roomNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Guest Phone</p>
                      <p>{request.guestPhoneNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Duration</p>
                      <p>{request.durationOfStay} days</p>
                    </div>
                    <div>
                      <p className="font-medium">Check-in</p>
                      <p>{format(request.startDate, 'PPP')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Check-out</p>
                      <p>{format(request.endDate, 'PPP')}</p>
                    </div>
                  </div>

                  {request.additionalGuests && request.additionalGuests.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Additional Guests</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {request.additionalGuests.map((guest, index) => (
                          <li key={index}>
                            {guest.name} {guest.surname} - {guest.phoneNumber}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  {request.status === 'approved' && request.isActive && (
                    <p className="text-sm text-gray-600 mt-2">
                      Security Code: {request.securityCode}
                    </p>
                  )}
                </div>
              </div>

              {request.adminResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Admin Response:</span> {request.adminResponse}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 