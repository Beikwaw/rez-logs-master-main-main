"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Clock, X, Check, Plus, Trash, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { getCheckoutCode, createGuestRequest, getUserActiveGuests, updateGuestCheckout } from "@/lib/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { useAuth } from '@/lib/auth'

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

export default function GuestRegistrationPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeGuests, setActiveGuests] = useState<GuestData[]>([])
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [currentGuest, setCurrentGuest] = useState<GuestData | null>(null)
  const [checkoutCode, setCheckoutCode] = useState<string | null>(null)
  const [checkoutCodeInput, setCheckoutCodeInput] = useState<string>('')
  const [formData, setFormData] = useState<Omit<GuestData, 'id' | 'status' | 'createdAt' | 'userId'>>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roomNumber: '',
    purpose: '',
    fromDate: new Date().toISOString().split('T')[0],
    tenantCode: ''
  })

  useEffect(() => {
    if (user) {
      fetchCheckoutCode()
      fetchActiveGuests()
    }
  }, [user])

  const fetchActiveGuests = async () => {
    try {
      if (!user) return
      const guests = await getUserActiveGuests(user.uid)
      setActiveGuests(guests)
    } catch (error) {
      console.error('Error fetching active guests:', error)
      toast.error("Failed to fetch active guests")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create the guest request with status 'active'
      const guestData = {
        ...formData,
        userId: user.uid,
        createdAt: new Date(),
        status: 'active' // Set status as active immediately
      }

      await createGuestRequest(guestData)
      toast.success("Guest registered successfully")
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roomNumber: '',
        purpose: '',
        fromDate: new Date().toISOString().split('T')[0],
        tenantCode: ''
      })

      // Refresh active guests list immediately
      await fetchActiveGuests()
    } catch (error) {
      console.error('Error submitting guest registration:', error)
      toast.error("Failed to register guest")
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckoutCode = async () => {
    try {
      const code = await getCheckoutCode()
      setCheckoutCode(code ? code.code : null)
    } catch (error) {
      console.error('Error fetching checkout code:', error)
      toast.error('Failed to fetch checkout code')
    }
  }

  const confirmGuest = (): void => {
    if (currentGuest) {
      // Add main guest
      setActiveGuests([...activeGuests, currentGuest])

      // Reset form and state
      const form = document.getElementById("guestForm") as HTMLFormElement
      if (form) form.reset()

      setCurrentGuest(null)
      setShowConfirmationDialog(false)

      toast.success("Guest registered successfully")
    }
  }

  const handleCheckoutGuest = async (guestId: string) => {
    if (checkoutCodeInput === '1005') {
      try {
        const guest = activeGuests.find(g => g.id === guestId);
        if (!guest) {
          throw new Error('Guest not found');
        }
        
        await updateGuestCheckout(guestId);
        toast.success(`${guest.firstName} ${guest.lastName} has been checked out successfully`);
        setCheckoutCodeInput('');
        // Refresh the active guests list after checkout
        await fetchActiveGuests();
      } catch (error) {
        console.error('Error checking out guest:', error);
        toast.error("Failed to check out guest");
      }
    } else {
      toast.error("Invalid security PIN");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenantCode">Tenant Code</Label>
                    <Input
                      id="tenantCode"
                      name="tenantCode"
                      value={formData.tenantCode}
                      onChange={handleInputChange}
                      required
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register Guest"}
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
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1">
                                <Input
                                  type="password"
                                  placeholder="Security PIN"
                                  value={checkoutCodeInput}
                                  onChange={(e) => setCheckoutCodeInput(e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-xs text-muted-foreground">Enter security PIN to check out</span>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleCheckoutGuest(guest.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
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

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="relative">
            <Image
              src="/my-domain-logo.png"
              alt="My Domain Logo"
              width={200}
              height={100}
              className="absolute top-4 right-4"
              priority
            />
            <DialogHeader className="mb-16 pr-16">
              <DialogTitle>Confirm Guest Registration</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3">Guest Details</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Full Name:</span> {currentGuest?.firstName} {currentGuest?.lastName}</p>
                <p><span className="font-semibold">Phone Number:</span> {currentGuest?.phoneNumber}</p>
                <p><span className="font-semibold">Room Number:</span> {currentGuest?.roomNumber}</p>
                <p><span className="font-semibold">Date:</span> {currentGuest?.fromDate ? new Date(currentGuest.fromDate).toLocaleDateString() : 'Not specified'}</p>
                <p><span className="font-semibold">Purpose:</span> {currentGuest?.purpose}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                confirmGuest()
                setShowConfirmationDialog(false)
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

