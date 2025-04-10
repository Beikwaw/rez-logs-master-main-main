"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Clock, X, Check, Plus, Trash, RefreshCw, AlertTriangle, DoorOpen } from "lucide-react"
import { toast } from "react-hot-toast"
import { getCheckoutCode, createGuestRequest, getUserActiveGuests, updateGuestCheckout } from "@/lib/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from '@/lib/auth'
import { GuestRegistrationForm } from "@/components/forms/GuestRegistrationForm"

interface GuestData {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  roomNumber: string
  purpose: string
  fromDate: string
  status: 'active' | 'checked_out'
  tenantCode: string
  createdAt: Date
  userId: string
  checkoutTime?: Date
}

interface AdditionalGuest {
  firstName: string
  lastName: string
  phoneNumber: string
}

export default function GuestRegistrationPage() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeGuests, setActiveGuests] = useState<GuestData[]>([])
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [currentGuest, setCurrentGuest] = useState<GuestData | null>(null)
  const [checkoutCodeInput, setCheckoutCodeInput] = useState<string>('')
  const [addMoreGuests, setAddMoreGuests] = useState(false)
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([{ firstName: '', lastName: '', phoneNumber: '' }])
  const [formData, setFormData] = useState<Omit<GuestData, 'id' | 'status' | 'createdAt' | 'userId'>>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roomNumber: '',
    purpose: '',
    fromDate: new Date().toISOString().split('T')[0],
    tenantCode: ''
  })
  const [showForm, setShowForm] = useState(false)

  const fetchActiveGuests = useCallback(async () => {
    try {
      if (!user?.uid) return
      const guests = await getUserActiveGuests(user.uid)
      setActiveGuests(guests as GuestData[])
    } catch (error) {
      console.error('Error fetching active guests:', error)
      toast.error("Failed to fetch active guests")
    }
  }, [user?.uid])

  useEffect(() => {
    if (user?.uid) {
      fetchActiveGuests()
    }
  }, [fetchActiveGuests])

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        roomNumber: userData.room_number,
        tenantCode: userData.tenant_code
      }))
    }
  }, [userData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdditionalGuestChange = (index: number, field: keyof AdditionalGuest, value: string) => {
    const newAdditionalGuests = [...additionalGuests]
    newAdditionalGuests[index] = {
      ...newAdditionalGuests[index],
      [field]: value
    }
    setAdditionalGuests(newAdditionalGuests)
  }

  const addNewAdditionalGuest = () => {
    if (additionalGuests.length >= 2) {
      toast.error("Maximum of 3 guests allowed (1 main + 2 additional)")
      return
    }
    setAdditionalGuests([...additionalGuests, { firstName: '', lastName: '', phoneNumber: '' }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user || !userData) {
        throw new Error('User not authenticated')
      }

      if (activeGuests.length + (addMoreGuests ? additionalGuests.length : 1) > 3) {
        throw new Error('Maximum of 3 guests allowed')
      }

      // Create main guest
      const mainGuestData = {
        ...formData,
        userId: user.uid,
        createdAt: new Date(),
        status: 'active' as const
      }

      await createGuestRequest(mainGuestData)

      // Create additional guests if enabled
      if (addMoreGuests) {
        for (const guest of additionalGuests) {
          if (guest.firstName && guest.lastName && guest.phoneNumber) {
            const additionalGuestData = {
              ...mainGuestData,
              firstName: guest.firstName,
              lastName: guest.lastName,
              phoneNumber: guest.phoneNumber
            }
            await createGuestRequest(additionalGuestData)
          }
        }
      }

      toast.success("Guest(s) registered successfully")
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roomNumber: userData.room_number,
        purpose: '',
        fromDate: new Date().toISOString().split('T')[0],
        tenantCode: userData.tenant_code
      })
      setAdditionalGuests([{ firstName: '', lastName: '', phoneNumber: '' }])
      setAddMoreGuests(false)

      // Refresh active guests list
      await fetchActiveGuests()
    } catch (error) {
      console.error('Error submitting guest registration:', error)
      toast.error(error instanceof Error ? error.message : "Failed to register guest")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckoutGuest = async (guestId: string) => {
    try {
      const guest = activeGuests.find(g => g.id === guestId)
      if (!guest) {
        throw new Error('Guest not found')
      }

      if (checkoutCodeInput === '1005') {
        await updateGuestCheckout(guestId)
        toast.success(`${guest.firstName} ${guest.lastName} has been checked out successfully`)
        setCheckoutCodeInput('')
        // Refresh the active guests list after checkout
        await fetchActiveGuests()
      } else {
        toast.error("Invalid security PIN")
      }
    } catch (error) {
      console.error('Error checking out guest:', error)
      toast.error("Failed to check out guest")
    }
  }

  const handleSuccess = () => {
    // Handle success logic
  }

  if (!user || !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to register guests.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          Students are fully responsible for the behavior and actions of their guests.
          A fee of R150 will be charged for any guest not signed out by 23:00.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guest Registration</CardTitle>
              <CardDescription>Register a new guest or manage active guests</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchActiveGuests}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register">
            <TabsList>
              <TabsTrigger value="register">Register Guest</TabsTrigger>
              <TabsTrigger value="active">Active Guests ({activeGuests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              {showForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>New Guest Registration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestRegistrationForm
                      userId={user.uid}
                      userData={{
                        room_number: userData?.room_number || '',
                        tenant_code: userData?.tenant_code || ''
                      }}
                      onSuccess={handleSuccess}
                      onCancel={() => setShowForm(false)}
                    />
                  </CardContent>
                </Card>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={userData.room_number}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenantCode">Tenant Code</Label>
                    <Input
                      id="tenantCode"
                      value={userData.tenant_code}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit</Label>
                  <Input
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromDate">Date</Label>
                  <Input
                    id="fromDate"
                    name="fromDate"
                    type="date"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addMoreGuests"
                    checked={addMoreGuests}
                    onCheckedChange={(checked) => setAddMoreGuests(checked as boolean)}
                  />
                  <Label htmlFor="addMoreGuests">Add more guests</Label>
                </div>

                {addMoreGuests && (
                  <div className="space-y-4">
                    {additionalGuests.map((guest, index) => (
                      <div key={index} className="border p-4 rounded-lg space-y-4">
                        <h3 className="font-medium">Additional Guest {index + 1}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                              value={guest.firstName}
                              onChange={(e) => handleAdditionalGuestChange(index, 'firstName', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                              value={guest.lastName}
                              onChange={(e) => handleAdditionalGuestChange(index, 'lastName', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            type="tel"
                            value={guest.phoneNumber}
                            onChange={(e) => handleAdditionalGuestChange(index, 'phoneNumber', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    ))}
                    {additionalGuests.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addNewAdditionalGuest}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Guest
                      </Button>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register Guest(s)"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="active">
              {activeGuests.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No active guests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGuests.map((guest) => (
                    <Card key={guest.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{guest.firstName} {guest.lastName}</h3>
                            <div className="text-sm text-muted-foreground">
                              <p>Phone: {guest.phoneNumber}</p>
                              <p>Room: {guest.roomNumber}</p>
                              <p>Tenant Code: {guest.tenantCode}</p>
                              <p>Purpose: {guest.purpose}</p>
                              <p>Date: {new Date(guest.fromDate).toLocaleDateString()}</p>
                              <p>Status: {guest.status === 'active' ? 
                                <span className="text-green-600 font-medium">Active</span> : 
                                <span className="text-red-600 font-medium">Checked Out</span>
                              }</p>
                            </div>
                          </div>
                          {guest.status === 'active' && (
                            <div className="flex flex-col items-end gap-2">
                              <Input
                                type="password"
                                placeholder="Security PIN"
                                value={checkoutCodeInput}
                                onChange={(e) => setCheckoutCodeInput(e.target.value)}
                                className="w-32"
                              />
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleCheckoutGuest(guest.id)}
                                className="flex items-center gap-2"
                              >
                                <DoorOpen className="h-4 w-4" />
                                Check-out
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

