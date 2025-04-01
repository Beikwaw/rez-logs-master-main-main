'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getPendingApplications, processRequest } from '@/lib/firestore';
import type { UserData } from '@/lib/firestore';
import { Check, X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

export default function NewbiesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<UserData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!userData?.role || userData.role !== 'admin') {
      toast.error('Unauthorized access');
      router.push('/portals/admin');
      return;
    }

    fetchApplications();
  }, [userData, router]);

  const fetchApplications = async () => {
    try {
      const data = await getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplication = async (userId: string, status: 'accepted' | 'denied', message: string) => {
    try {
      await processRequest(userId, status, message, userData.id);
      toast.success(`Application ${status} successfully`);
      fetchApplications();
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error('Failed to process application');
    }
  };

  if (!userData?.role || userData.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Applications</h1>
        <Badge variant="secondary" className="text-sm">
          {applications.length} pending applications
        </Badge>
      </div>

      <div className="grid gap-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {application.full_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Applied on {format(application.createdAt, 'PPP')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedApplication(application);
                      setIsDialogOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApplication(application.id, 'accepted', 'Your application has been accepted. Welcome to our student accommodation!')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleApplication(application.id, 'denied', 'We regret to inform you that your application has been denied.')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <p><strong>Email:</strong> {application.email}</p>
                <p><strong>Place of Study:</strong> {application.place_of_study}</p>
                {application.requestDetails && (
                  <>
                    <p><strong>Accommodation Type:</strong> {application.requestDetails.accommodationType}</p>
                    <p><strong>Preferred Location:</strong> {application.requestDetails.location}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Personal Information</h3>
                <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                <p><strong>Email:</strong> {selectedApplication.email}</p>
                <p><strong>Phone:</strong> {selectedApplication.phone || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="font-medium">Academic Information</h3>
                <p><strong>Place of Study:</strong> {selectedApplication.place_of_study}</p>
              </div>
              {selectedApplication.requestDetails && (
                <div>
                  <h3 className="font-medium">Accommodation Preferences</h3>
                  <p><strong>Type:</strong> {selectedApplication.requestDetails.accommodationType}</p>
                  <p><strong>Location:</strong> {selectedApplication.requestDetails.location}</p>
                  <p><strong>Date Submitted:</strong> {format(selectedApplication.requestDetails.dateSubmitted, 'PPP')}</p>
                </div>
              )}
              <div>
                <h3 className="font-medium">Application Status</h3>
                <p><strong>Status:</strong> {selectedApplication.applicationStatus}</p>
                <p><strong>Applied On:</strong> {format(selectedApplication.createdAt, 'PPP')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 