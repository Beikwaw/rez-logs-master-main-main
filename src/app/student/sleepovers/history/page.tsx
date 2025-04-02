'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { getMySleepoverRequests, type SleepoverRequest } from '@/lib/firestore';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SleepoverHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user?.uid) return;
    
    try {
      const data = await getMySleepoverRequests(user.uid);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Sleepover Request History</h1>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sleepover Request</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <p><strong>Guest Name:</strong> {request.guestName} {request.guestSurname}</p>
                <p><strong>Room Number:</strong> {request.roomNumber}</p>
                <p><strong>Guest Phone:</strong> {request.guestPhoneNumber}</p>
                <p><strong>Check-in:</strong> {format(new Date(request.startDate), 'PPP')}</p>
                <p><strong>Check-out:</strong> {format(new Date(request.endDate), 'PPP')}</p>
                {request.durationOfStay && (
                  <p><strong>Duration:</strong> {request.durationOfStay}</p>
                )}
                {request.additionalGuests && request.additionalGuests.length > 0 && (
                  <div>
                    <p className="font-semibold mt-2">Additional Guests:</p>
                    <ul className="list-disc list-inside">
                      {request.additionalGuests.map((guest, index) => (
                        <li key={index}>
                          {guest.name} {guest.surname} - {guest.phoneNumber}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p><strong>Submitted:</strong> {format(new Date(request.createdAt), 'PPP p')}</p>
                {request.updatedAt && (
                  <p><strong>Last Updated:</strong> {format(new Date(request.updatedAt), 'PPP p')}</p>
                )}
                {request.adminResponse && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p><strong>Admin Response:</strong> {request.adminResponse}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {requests.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">
                No sleepover request history found
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 