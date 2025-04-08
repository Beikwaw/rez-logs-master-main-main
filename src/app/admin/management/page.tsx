'use client';

import { useState, useEffect } from 'react';
import { getAllManagementRequests, getTodayManagementRequests, approveManagementRequest, rejectManagementRequest, ManagementRequest } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ManagementRequest[]>([]);
  const [todayRequests, setTodayRequests] = useState<ManagementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ManagementRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const [allRequests, today] = await Promise.all([
        getAllManagementRequests(),
        getTodayManagementRequests()
      ]);
      setRequests(allRequests);
      setTodayRequests(today);
    } catch (err) {
      setError('Failed to fetch management requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !adminResponse) return;

    try {
      await approveManagementRequest(selectedRequest.id, adminResponse);
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
      await rejectManagementRequest(selectedRequest.id, adminResponse);
      toast.success('Request rejected successfully');
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to reject request');
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
        <h1 className="text-2xl font-bold">Management Requests</h1>
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
            {showHistory ? 'No management requests found.' : 'No management requests for today.'}
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
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                  
                  <div className="space-y-6">
                    {/* Request Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Request Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Tenant Code:</p>
                          <p className="text-gray-900">{request.tenantCode}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Name:</p>
                          <p className="text-gray-900">{request.name}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Email:</p>
                          <p className="text-gray-900">{request.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Phone:</p>
                          <p className="text-gray-900">{request.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Request Details</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Type:</p>
                          <p className="text-gray-900">{request.type}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Description:</p>
                          <p className="text-gray-900">{request.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Request Status */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Request Status</h3>
                      <div className="flex items-center gap-2">
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
                        <span className="text-sm text-gray-500">
                          Submitted on {format(request.createdAt, 'PPP')}
                        </span>
                      </div>
                    </div>
                  </div>
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
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Respond to Request</h3>
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
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 