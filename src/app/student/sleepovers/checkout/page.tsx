'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { checkoutSleepoverGuest } from '@/lib/firestore';

const SECURITY_CODE = '3693';

export default function SleepoverCheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [securityCode, setSecurityCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to check out a guest');
      return;
    }

    if (!securityCode) {
      toast.error('Please ask security to enter the checkout code');
      return;
    }

    if (securityCode !== SECURITY_CODE) {
      toast.error('Invalid security code');
      setSecurityCode('');
      return;
    }

    try {
      setLoading(true);
      await checkoutSleepoverGuest(user.uid);
      toast.success('Guest has been successfully checked out');
      setTimeout(() => {
        router.push('/student/sleepovers/history');
      }, 2000);
    } catch (error: any) {
      console.error('Error checking out guest:', error);
      toast.error(error.message || 'Failed to check out guest');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
              <p className="text-gray-600">You need to be signed in to check out a guest.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button 
        variant="outline" 
        onClick={() => router.back()} 
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Out Sleepover Guest</CardTitle>
          <CardDescription>
            Please hand your phone to security personnel to enter the checkout code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label htmlFor="securityCode" className="block text-sm font-medium text-gray-700 mb-1">
                Security Checkout Code
              </label>
              <Input
                id="securityCode"
                type="password"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                placeholder="Enter security code"
                required
                className="w-full"
                maxLength={4}
              />
              <p className="text-sm text-muted-foreground mt-2">
                This code must be entered by security personnel
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Checkout'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 