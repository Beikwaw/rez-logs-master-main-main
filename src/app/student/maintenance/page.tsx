"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { MaintenanceRequestForm } from "@/components/forms/MaintenanceRequestForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getUserMaintenanceRequests, MaintenanceStatus } from "@/lib/firestore"
import { format } from "date-fns"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: MaintenanceStatus
  createdAt: Date
  category: 'bedroom' | 'bathroom' | 'kitchen' | 'other'
  roomNumber: string
  preferredDate: string
  timeSlot: string
  adminComment?: string
}

export default function MaintenancePage() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const userRequests = await getUserMaintenanceRequests(user.uid)
      setRequests(userRequests)
    } catch (error) {
      console.error('Error fetching maintenance requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchRequests()
    }
  }, [user?.uid])

  const handleSuccess = () => {
    setShowForm(false)
    fetchRequests()
  }

  if (!user) {
    return <div>Please log in to submit maintenance requests.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Maintenance Request</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceRequestForm
              userId={user.uid}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div>No maintenance requests found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Requests */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Active Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests
                      .filter(request => ['pending', 'in_progress'].includes(request.status))
                      .map((request) => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Completed Requests */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests
                      .filter(request => request.status === 'completed')
                      .map((request) => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RequestCard({ request }: { request: MaintenanceRequest }) {
  const formatCategory = (category?: string) => {
    if (!category) return 'Not specified';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not specified';
    try {
      return format(new Date(date), 'PP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Submitted on {format(new Date(request.createdAt), 'PPP')}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-sm ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            request.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1).replace('_', ' ')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Room:</span> {request.roomNumber || 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Category:</span> {formatCategory(request.category)}
            </div>
            <div>
              <span className="font-medium">Priority:</span>{' '}
              <span className={
                request.priority === 'high' ? 'text-red-600' :
                request.priority === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }>
                {(request.priority || 'low').charAt(0).toUpperCase() + (request.priority || 'low').slice(1)}
              </span>
            </div>
            <div>
              <span className="font-medium">Preferred Time:</span>{' '}
              {formatDate(request.preferredDate)} {request.timeSlot ? `at ${request.timeSlot}` : ''}
            </div>
          </div>
          
          <p className="text-sm mt-2">{request.description}</p>
          
          {request.adminComment && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Staff Response:</p>
              <p className="text-sm">{request.adminComment}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 