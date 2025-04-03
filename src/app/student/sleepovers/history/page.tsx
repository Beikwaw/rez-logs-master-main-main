'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMySleepoverRequests, subscribeToSleepoverRequests } from '@/lib/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SleepoverRequest } from '@/lib/firestore';

export default function SleepoverHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Set up real-time subscription
    const unsubscribe = subscribeToSleepoverRequests(user.uid, (updatedRequests) => {
      setRequests(updatedRequests);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    // Initial fetch
    const fetchInitialRequests = async () => {
      try {
        const data = await getMySleepoverRequests(user.uid);
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error('Unable to load your sleepover requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialRequests();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
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
        <div className="flex items-center gap-4">
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              Refreshing...
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsRefreshing(true)}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sleepover Request</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusMessage(request.status)}
                  </span>
                </div>
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
                {request.status === 'approved' && request.securityCode && (
                  <div className="mt-2 p-3 bg-green-50 rounded-md">
                    <p><strong>Security Code:</strong> {request.securityCode}</p>
                    <p className="text-sm text-green-700 mt-1">Please provide this code to your guest for check-in</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {requests.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  No sleepover request history found
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/student/sleepovers/new')}
                >
                  Create New Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="text-muted-foreground">Loading your sleepover requests...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 