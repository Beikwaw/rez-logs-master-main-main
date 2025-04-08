"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { getAllGuestRequests } from "@/lib/firestore"

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
  checkoutTime?: Date
}

export default function AdminGuestsPage() {
  const [loading, setLoading] = useState(false)
  const [guestRequests, setGuestRequests] = useState<GuestData[]>([])

  useEffect(() => {
    fetchGuestRequests()
  }, [])

  const fetchGuestRequests = async () => {
    setLoading(true)
    try {
      const requests = await getAllGuestRequests()
      setGuestRequests(requests)
    } catch (error) {
      console.error('Error fetching guest requests:', error)
      toast.error('Failed to fetch guest requests')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Guest Records</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchGuestRequests}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Guests</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="checked_out">Checked Out</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4">
                {guestRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">{request.firstName} {request.lastName}</p>
                          <p className="text-sm text-gray-500">Room: {request.roomNumber}</p>
                          <p className="text-sm text-gray-500">Tenant Code: {request.tenantCode}</p>
                        </div>
                        <div>
                          <p className="text-sm">Phone: {request.phoneNumber}</p>
                          <p className="text-sm">Purpose: {request.purpose}</p>
                          <p className="text-sm">Status: {request.status === 'active' ? 'Active' : 'Checked Out'}</p>
                          {request.checkoutTime && (
                            <p className="text-sm">Checked Out: {formatDate(request.checkoutTime)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid gap-4">
                {guestRequests
                  .filter(request => request.status === 'active')
                  .map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold">{request.firstName} {request.lastName}</p>
                            <p className="text-sm text-gray-500">Room: {request.roomNumber}</p>
                            <p className="text-sm text-gray-500">Tenant Code: {request.tenantCode}</p>
                          </div>
                          <div>
                            <p className="text-sm">Phone: {request.phoneNumber}</p>
                            <p className="text-sm">Purpose: {request.purpose}</p>
                            <p className="text-sm">Status: Active</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="checked_out">
              <div className="grid gap-4">
                {guestRequests
                  .filter(request => request.status === 'checked_out')
                  .map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold">{request.firstName} {request.lastName}</p>
                            <p className="text-sm text-gray-500">Room: {request.roomNumber}</p>
                            <p className="text-sm text-gray-500">Tenant Code: {request.tenantCode}</p>
                          </div>
                          <div>
                            <p className="text-sm">Phone: {request.phoneNumber}</p>
                            <p className="text-sm">Purpose: {request.purpose}</p>
                            <p className="text-sm">Status: Checked Out</p>
                            {request.checkoutTime && (
                              <p className="text-sm">Checked Out: {formatDate(request.checkoutTime)}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}