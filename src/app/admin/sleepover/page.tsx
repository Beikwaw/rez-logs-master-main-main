'use client';

import { useState, useEffect } from 'react';
import { getAllSleepoverRequests, getTodaySleepoverRequests, approveSleepoverRequest, rejectSleepoverRequest, signOutSleepoverGuest } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { SleepoverRequest } from '@/lib/firestore';

export default function AdminSleepoverPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [todayRequests, setTodayRequests] = useState<SleepoverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SleepoverRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [signOutCode, setSignOutCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const [allRequests, today] = await Promise.all([
        getAllSleepoverRequests(),
        getTodaySleepoverRequests()
      ]);
      setRequests(allRequests);
      setTodayRequests(today);
    } catch (err) {
      setError('Failed to fetch sleepover requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !adminResponse) return;

    try {
      await approveSleepoverRequest(selectedRequest.id, adminResponse);
      toast.success('Request approved successfully');
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to approve request');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !adminResponse) return;

    try {
      await rejectSleepoverRequest(selectedRequest.id, adminResponse);
      toast.success('Request rejected successfully');
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to reject request');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    if (!selectedRequest || !signOutCode) return;

    try {
      await signOutSleepoverGuest(selectedRequest.id, signOutCode);
      toast.success('Guest signed out successfully');
      setSelectedRequest(null);
      setSignOutCode('');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to sign out guest');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const displayRequests = showHistory ? requests : todayRequests;

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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {displayRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {showHistory ? 'No sleepover requests found.' : 'No sleepover requests for today.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayRequests.map((request) => (
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

              {request.status === 'pending' && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                </div>
              )}

              {request.status === 'approved' && request.isActive && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Sign Out Guest
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Response Modal */}
      {selectedRequest && selectedRequest.status === 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {selectedRequest.status === 'pending' ? 'Respond to Request' : 'Sign Out Guest'}
            </h3>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Enter your response..."
              className="w-full p-2 border rounded mb-4 h-32"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminResponse('');
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      {selectedRequest && selectedRequest.status === 'approved' && selectedRequest.isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Sign Out Guest</h3>
            <p className="mb-4">Enter the security code to sign out the guest:</p>
            <input
              type="text"
              value={signOutCode}
              onChange={(e) => setSignOutCode(e.target.value)}
              placeholder="Enter security code"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setSignOutCode('');
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 