'use client';

import { useState, useEffect } from 'react';
import { getAllMaintenanceRequests, getTodayMaintenanceRequests, updateMaintenanceStatus } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminMaintenancePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [todayRequests, setTodayRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
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
        getAllMaintenanceRequests(),
        getTodayMaintenanceRequests()
      ]);
      setRequests(allRequests);
      setTodayRequests(today);
    } catch (err) {
      setError('Failed to fetch maintenance requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedRequest || !adminResponse) return;

    try {
      await updateMaintenanceStatus(selectedRequest.id, status, adminResponse);
      toast.success(`Request ${status} successfully`);
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (err) {
      toast.error(`Failed to ${status} request`);
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
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
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
            {showHistory ? 'No maintenance requests found.' : 'No maintenance requests for today.'}
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
                    {request.title}
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
                      <p className="font-medium">Category</p>
                      <p>{request.category}</p>
                    </div>
                    <div>
                      <p className="font-medium">Priority</p>
                      <p className={`text-sm font-medium ${
                        request.priority === 'high'
                          ? 'text-red-600'
                          : request.priority === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {(request.priority || 'low').charAt(0).toUpperCase() + (request.priority || 'low').slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p>{format(request.createdAt, 'PPP p')}</p>
                    </div>
                    {request.updatedAt && (
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p>{format(request.updatedAt, 'PPP p')}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-gray-600">{request.description}</p>
                  </div>

                  {request.images && request.images.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Images</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {request.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Maintenance request image ${index + 1}`}
                            className="w-full h-48 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {request.status.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
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
                    onClick={() => setSelectedRequest(request)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Start Work
                  </button>
                </div>
              )}

              {request.status === 'in_progress' && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Mark as Completed
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
            <h3 className="text-xl font-semibold mb-4">
              {selectedRequest.status === 'pending' ? 'Start Work' : 'Mark as Completed'}
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
                onClick={() => handleStatusUpdate(selectedRequest.status === 'pending' ? 'in_progress' : 'completed')}
                className={`px-4 py-2 text-white rounded ${
                  selectedRequest.status === 'pending'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {selectedRequest.status === 'pending' ? 'Start Work' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}