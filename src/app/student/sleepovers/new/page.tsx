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

export default function NewSleepoverRequest() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    guestName: '',
    guestSurname: '',
    guestPhoneNumber: '',
    startDate: '',
    endDate: '',
    additionalGuests: [{ name: '', surname: '', phoneNumber: '' }]
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const data = await getUserById(user.uid);
          if (data) {
            setUserData(data);
            setFormData(prev => ({
              ...prev,
              roomNumber: data.room_number || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load user data');
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      toast.error('Please sign in to submit a sleepover request');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    // Validate phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.guestPhoneNumber.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid phone number for the main guest');
      return;
    }

    const invalidAdditionalGuests = formData.additionalGuests.filter(
      guest => guest.name && guest.phoneNumber && !phoneRegex.test(guest.phoneNumber.replace(/\s+/g, ''))
    );
    if (invalidAdditionalGuests.length > 0) {
      toast.error('Please enter valid phone numbers for all additional guests');
      return;
    }

    try {
      setLoading(true);
      const sleepoverData = {
        userId: user.uid,
        tenantCode: userData.tenant_code,
        roomNumber: formData.roomNumber,
        guestName: formData.guestName,
        guestSurname: formData.guestSurname,
        guestPhoneNumber: formData.guestPhoneNumber,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        additionalGuests: formData.additionalGuests.filter(guest => 
          guest.name && guest.surname && guest.phoneNumber
        )
      };

      await createSleepoverRequest(sleepoverData);
      toast.success('Your sleepover request has been submitted successfully');
      setTimeout(() => {
        router.push('/student/sleepovers/history');
      }, 2000);
    } catch (error) {
      console.error('Error submitting sleepover request:', error);
      toast.error('Failed to submit sleepover request');
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalGuest = () => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: [...prev.additionalGuests, { name: '', surname: '', phoneNumber: '' }]
    }));
  };

  const removeAdditionalGuest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalGuest = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.map((guest, i) => 
        i === index ? { ...guest, [field]: value } : guest
      )
    }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
              <p className="text-gray-600">You need to be signed in to submit a sleepover request.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Request Sleepover</CardTitle>
          <CardDescription>
            Fill in the details below to request a sleepover for your guest(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="Enter your room number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestName">Guest First Name</Label>
                <Input
                  id="guestName"
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                  placeholder="Enter guest's first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestSurname">Guest Last Name</Label>
                <Input
                  id="guestSurname"
                  type="text"
                  required
                  value={formData.guestSurname}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestSurname: e.target.value }))}
                  placeholder="Enter guest's last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">Guest Phone Number</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  required
                  value={formData.guestPhoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestPhoneNumber: e.target.value }))}
                  placeholder="+27123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      startDate: newStartDate,
                      endDate: prev.endDate && new Date(prev.endDate) <= new Date(newStartDate) 
                        ? format(addDays(new Date(newStartDate), 1), 'yyyy-MM-dd')
                        : prev.endDate
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Additional Guests</h2>
                <Button
                  type="button"
                  onClick={addAdditionalGuest}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guest
                </Button>
              </div>

              <div className="space-y-4">
                {formData.additionalGuests.map((guest, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input
                            type="text"
                            placeholder="First Name"
                            value={guest.name}
                            onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input
                            type="text"
                            placeholder="Last Name"
                            value={guest.surname}
                            onChange={(e) => updateAdditionalGuest(index, 'surname', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              placeholder="+27123456789"
                              value={guest.phoneNumber}
                              onChange={(e) => updateAdditionalGuest(index, 'phoneNumber', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => removeAdditionalGuest(index)}
                              variant="destructive"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 