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
          tenantCode: data.tenantCode || '',
          roomNumber: data.roomNumber || '',
          guestName: data.guestName || '',
          guestSurname: data.guestSurname || '',
          guestPhone: data.guestPhone || '',
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
          additionalGuests: data.additionalGuests || [],
          status: data.status || 'pending',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          adminResponse: data.adminResponse || ''
        } as SleepoverRequest;
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
          <div key={request.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {request.guestName} {request.guestSurname}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Room Number</p>
                    <p>{request.roomNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Tenant Code</p>
                    <p>{request.tenantCode}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p>{request.guestPhone}</p>
                  </div>
                  <div>
                    <p className="font-medium">Duration</p>
                    <p>{format(request.startDate, 'PPP')} - {format(request.endDate, 'PPP')}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  request.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : request.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
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
                  onClick={() => handleReject(request.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(request.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Approve
                </button>
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