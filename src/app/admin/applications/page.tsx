'use client';

import { useState, useEffect } from 'react';
import { getAllApplications, approveApplication, rejectApplication } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Application {
  id: string;
  tenantCode: string;
  name: string;
  email: string;
  phone: string;
  placeOfStudy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  adminResponse?: string;
}

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const allApplications = await getAllApplications();
      // Convert Firestore timestamps to Date objects
      const processedApplications = allApplications.map(app => ({
        ...app,
        createdAt: app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt)
      })) as Application[];
      setApplications(processedApplications);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication || !adminResponse) return;

    try {
      await approveApplication(selectedApplication.id, adminResponse);
      toast.success('Application approved successfully');
      setSelectedApplication(null);
      setAdminResponse('');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to approve application');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !adminResponse) return;

    try {
      await rejectApplication(selectedApplication.id, adminResponse);
      toast.success('Application rejected successfully');
      setSelectedApplication(null);
      setAdminResponse('');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to reject application');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const displayApplications = showHistory 
    ? applications 
    : applications.filter(app => app.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Applications</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showHistory ? 'Show Pending Applications' : 'Show History'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {displayApplications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {showHistory ? 'No applications found.' : 'No pending applications.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-4">Application Details</h2>
                  
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Tenant Code:</p>
                          <p className="text-gray-900">{application.tenantCode}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Name:</p>
                          <p className="text-gray-900">{application.name}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Email:</p>
                          <p className="text-gray-900">{application.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Phone:</p>
                          <p className="text-gray-900">{application.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Academic Information</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Place of Study:</p>
                          <p className="text-gray-900">{application.placeOfStudy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Application Status */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Application Status</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            application.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Submitted on {format(application.createdAt, 'PPP')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {application.adminResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Admin Response:</span> {application.adminResponse}
                  </p>
                </div>
              )}

              {application.status === 'pending' && (
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedApplication(application)}
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
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Respond to Application</h3>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Enter your response..."
              className="w-full p-2 border rounded mb-4 h-32"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedApplication(null);
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