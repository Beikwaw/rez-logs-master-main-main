"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { MaintenanceRequestForm } from "@/components/forms/MaintenanceRequestForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getUserMaintenanceRequests, MaintenanceStatus, Timestamp } from "@/lib/firestore"
import { format } from "date-fns"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: MaintenanceStatus
  createdAt: Timestamp | Date
  category: 'bedroom' | 'bathroom' | 'kitchen' | 'other'
  roomNumber: string
  preferredDate: string
  timeSlot: string
  adminComment?: string
  tenantCode: string
}

export default function MaintenancePage() {
  const { user, userData } = useAuth()
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

  if (!user || !userData) {
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
              userData={{
                room_number: userData.room_number,
                tenant_code: userData.tenant_code
              }}
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
    <div key={request.id} className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold mb-2">{request.title}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Room Number</p>
              <p>{request.roomNumber}</p>
            </div>
            <div>
              <p className="font-medium">Tenant Code</p>
              <p>{request.tenantCode}</p>
            </div>
            <div>
              <p className="font-medium">Category</p>
              <p>{request.category}</p>
            </div>
            <div>
              <p className="font-medium">Priority</p>
              <p className={`text-sm font-medium ${
                request.priority === 'high'
                  ? 'text-red-600'
                  : request.priority === 'medium'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {(request.priority || 'low').charAt(0).toUpperCase() + (request.priority || 'low').slice(1)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-600">{request.description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            request.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : request.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {request.status.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </span>
        </div>
      </div>
      {request.adminComment && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Admin Response:</span> {request.adminComment}
          </p>
        </div>
      )}
    </div>
  );
} 