'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface SleepoverRequest {
  id: string;
  tenantCode: string;
  roomNumber: string;
  guestName: string;
  guestSurname: string;
  guestPhone: string;
  startDate: Date;
  endDate: Date;
  additionalGuests: Array<{
    name: string;
    phone: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  adminResponse?: string;
}

export default function AdminSleepoversPage() {
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SleepoverRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'sleepover_requests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Helper function to safely convert Firestore timestamp to Date
        const toDate = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          if (timestamp instanceof Timestamp) return timestamp.toDate();
          if (timestamp instanceof Date) return timestamp;
          return new Date(timestamp);
        };

        return {
          id: doc.id,
          ...data,
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt)
        };
      });
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching sleepover requests:', error);
      setError('Failed to fetch sleepover requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'sleepover_requests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        adminResponse,
        updatedAt: serverTimestamp()
      });
      toast.success('Sleepover request approved');
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'sleepover_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        adminResponse,
        updatedAt: serverTimestamp()
      });
      toast.success('Sleepover request rejected');
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sleepover Requests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg shadow-md p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {request.guestName} {request.guestSurname}
                </h3>
                <p className="text-sm text-gray-600">
                  Tenant Code: {request.tenantCode}
                </p>
                <p className="text-sm text-gray-600">
                  Room: {request.roomNumber}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : request.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Phone:</span> {request.guestPhone}
              </p>
              <p className="text-sm">
                <span className="font-medium">Start Date:</span>{' '}
                {format(request.startDate, 'MMM dd, yyyy')}
              </p>
              <p className="text-sm">
                <span className="font-medium">End Date:</span>{' '}
                {format(request.endDate, 'MMM dd, yyyy')}
              </p>
            </div>

            {request.additionalGuests && request.additionalGuests.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Additional Guests:</h4>
                <ul className="space-y-1">
                  {request.additionalGuests.map((guest, index) => (
                    <li key={index} className="text-sm">
                      {guest.name} - {guest.phone}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Review
                </button>
              </div>
            )}

            {request.adminResponse && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm">
                  <span className="font-medium">Admin Response:</span>{' '}
                  {request.adminResponse}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Review Sleepover Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Response
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminResponse('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 