'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { createSleepoverRequest, getUserById } from '@/lib/firestore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { addDays, format } from 'date-fns';
import { SleepoverRequestForm } from '@/components/forms/SleepoverRequestForm';

export default function NewSleepoverRequestPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);

  const handleSuccess = () => {
    toast.success('Sleepover request submitted successfully');
    router.push('/student/sleepovers');
  };

  if (!user || !userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Sleepover Request</CardTitle>
          <CardDescription>Submit a new sleepover request</CardDescription>
        </CardHeader>
        <CardContent>
          {showForm && (
            <SleepoverRequestForm
              userId={user.uid}
              userData={{
                room_number: userData.room_number,
                tenant_code: userData.tenant_code
              }}
              onSuccess={handleSuccess}
              onCancel={() => router.push('/student/sleepovers')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 