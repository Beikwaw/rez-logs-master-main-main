'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getMySleepoverRequests, subscribeToSleepoverRequests } from '@/lib/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SleepoverRequest } from '@/lib/firestore';
import { Badge } from '@/components/ui/badge';

export default function SleepoverHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<SleepoverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (!user?.uid) return;
      const userRequests = await getMySleepoverRequests(user.uid);
      setRequests(userRequests);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, signOutTime?: any) => {
    if (signOutTime) {
      return <Badge className="bg-green-500">Checked Out</Badge>;
    }
    switch (status) {
      case 'approved':
        return <Badge className="bg-blue-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  // Separate active and completed requests
  const activeRequests = requests.filter(request => 
    request.status === 'approved' && !request.signOutTime
  );

  const completedRequests = requests.filter(request => 
    request.signOutTime || request.status === 'completed' || request.status === 'rejected'
  );

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
            onClick={() => {
              setIsRefreshing(true);
              fetchRequests();
            }}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Requests Section */}
      {activeRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Requests</h2>
          <div className="grid gap-4">
            {activeRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">
                    Guest: {request.guestName}
                  </CardTitle>
                  {getStatusBadge(request.status, request.signOutTime)}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <p><strong>Room Number:</strong> {request.roomNumber}</p>
                    <p><strong>Guest Phone:</strong> {request.guestPhoneNumber}</p>
                    <p><strong>Check-in:</strong> {format(new Date(request.startDate), 'PPP')}</p>
                    <p><strong>Check-out:</strong> {format(new Date(request.endDate), 'PPP')}</p>
                    <p><strong>Submitted:</strong> {format(new Date(request.createdAt), 'PPP p')}</p>
                    {request.status === 'approved' && !request.signOutTime && (
                      <div className="mt-4">
                        <Button
                          onClick={() => router.push('/student/sleepovers/checkout')}
                          className="w-full"
                        >
                          Sign Out Guest
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Requests Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Request History</h2>
        <div className="grid gap-4">
          {completedRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  Guest: {request.guestName}
                </CardTitle>
                {getStatusBadge(request.status, request.signOutTime)}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <p><strong>Room Number:</strong> {request.roomNumber}</p>
                  <p><strong>Guest Phone:</strong> {request.guestPhoneNumber}</p>
                  <p><strong>Check-in:</strong> {format(new Date(request.startDate), 'PPP')}</p>
                  <p><strong>Check-out:</strong> {format(new Date(request.endDate), 'PPP')}</p>
                  <p><strong>Submitted:</strong> {format(new Date(request.createdAt), 'PPP p')}</p>
                  {request.signOutTime && (
                    <div className="mt-2 p-3 bg-green-50 rounded-md">
                      <p><strong>Checked Out:</strong> {format(new Date(request.signOutTime), 'PPP p')}</p>
                    </div>
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

          {completedRequests.length === 0 && !isLoading && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    No completed sleepover requests found
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
  );
} 