'use client';

import { useState, useEffect } from 'react';
import { getAllGuestRequests } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GuestRequest {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roomNumber: string;
  tenantCode: string;
  purpose: string;
  fromDate: string;
  createdAt: Date;
  userId: string;
}

export default function AdminGuestSignInPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const allRequests = await getAllGuestRequests();
      setRequests(allRequests);
    } catch (err) {
      setError('Failed to fetch guest requests');
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Guest Sign-In Records</CardTitle>
          <Button variant="outline" onClick={fetchRequests}>Refresh</Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">Guest Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Guest Information</p>
                          <p className="text-sm">Name: {request.firstName} {request.lastName}</p>
                          <p className="text-sm">Phone: {request.phoneNumber}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Location Information</p>
                          <p className="text-sm">Room Number: {request.roomNumber}</p>
                          <p className="text-sm">Tenant Code: {request.tenantCode}</p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-600">Visit Details</p>
                        <p className="text-sm">Purpose: {request.purpose}</p>
                        <p className="text-sm">Date: {format(new Date(request.fromDate), 'PPP')}</p>
                        <p className="text-sm">Registered: {format(new Date(request.createdAt), 'PPP pp')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 