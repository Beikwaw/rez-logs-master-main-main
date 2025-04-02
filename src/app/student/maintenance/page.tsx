"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Wrench, Trash, AlertTriangle, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface MaintenanceRequest {
  id: string
  category: string
  roomNumber: string
  description: string
  date: string
  timeSlot: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  createdAt: Date
  userId: string
}

export default function MaintenanceRequestPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const maintenanceRef = collection(db, "maintenance")
      const q = query(maintenanceRef, where("userId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      
      const fetchedRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as MaintenanceRequest[]

      setRequests(fetchedRequests)
    } catch (err) {
      console.error("Error fetching requests:", err)
      setError("Failed to fetch maintenance requests. Please try again.")
      toast.error("Failed to fetch maintenance requests")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (formData: FormData): boolean => {
    const errors: Record<string, string> = {}
    const date = new Date(formData.get("date") as string)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) {
      errors.date = "Preferred date cannot be in the past"
    }

    if ((formData.get("description") as string).length < 10) {
      errors.description = "Description must be at least 10 characters long"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Please sign in to submit a request")
      return
    }

    const formData = new FormData(e.target as HTMLFormElement)
    if (!validateForm(formData)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newRequest: Omit<MaintenanceRequest, "id"> = {
        category: formData.get("category") as string,
        roomNumber: formData.get("roomNumber") as string,
        description: formData.get("description") as string,
        date: formData.get("date") as string,
        timeSlot: formData.get("timeSlot") as string,
        priority: formData.get("priority") as "low" | "medium" | "high",
        status: "pending",
        createdAt: new Date(),
        userId: user.uid
      }

      const docRef = await addDoc(collection(db, "maintenance"), newRequest)
      const requestWithId = { ...newRequest, id: docRef.id }
      
      setRequests(prev => [...prev, requestWithId])
      const form = document.getElementById("maintenanceForm") as HTMLFormElement
      if (form) form.reset()
      setFormErrors({})
      toast.success("Maintenance request submitted successfully")
    } catch (err) {
      console.error("Error submitting request:", err)
      setError("Failed to submit maintenance request. Please try again.")
      toast.error("Failed to submit maintenance request")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setRequestToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!requestToDelete || !user) return

    try {
      setLoading(true)
      setError(null)
      
      await deleteDoc(doc(db, "maintenance", requestToDelete))
      setRequests(prev => prev.filter(request => request.id !== requestToDelete))
      toast.success("Maintenance request deleted successfully")
    } catch (err) {
      console.error("Error deleting request:", err)
      setError("Failed to delete maintenance request. Please try again.")
      toast.error("Failed to delete maintenance request")
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600 mt-1">Submit and track your maintenance requests</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchRequests}
          disabled={loading}
          className="hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-xl text-gray-900">Submit Request</CardTitle>
                <CardDescription className="text-gray-600">Fill in the details of your maintenance request.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form id="maintenanceForm" onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-900 font-medium">Maintenance Category</Label>
                <Select name="category" required>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="bedroom">Bedroom</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-gray-900 font-medium">Room Number</Label>
                <Input
                  id="roomNumber"
                  name="roomNumber"
                  placeholder="Enter your room number"
                  required
                  className="bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900 font-medium">Describe the Issue</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide details about the maintenance request"
                  required
                  className="bg-white border-gray-200 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-900 font-medium">Preferred Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot" className="text-gray-900 font-medium">Preferred Time Slot</Label>
                <Select name="timeSlot" required>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00-10:30">09:00 - 10:30</SelectItem>
                    <SelectItem value="10:30-12:00">10:30 - 12:00</SelectItem>
                    <SelectItem value="12:00-13:30">12:00 - 13:30</SelectItem>
                    <SelectItem value="13:30-15:00">13:30 - 15:00</SelectItem>
                    <SelectItem value="15:00-16:30">15:00 - 16:30</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Priority Level</Label>
                <RadioGroup name="priority" required className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="text-gray-900">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-gray-900">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="text-gray-900">High</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Service Availability Notice</h4>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Service delivery is dependent on staff availability. Weekend requests are subject to change.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Your Requests</CardTitle>
            <CardDescription className="text-gray-600">View and manage your maintenance requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No maintenance requests submitted</p>
                <p className="text-sm text-gray-500 mt-2">Submit a request to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{request.category}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Room: {request.roomNumber}</p>
                          <p>Date: {request.date}</p>
                          <p>Time: {request.timeSlot}</p>
                          <p className="mt-2">{request.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          <span className="text-gray-500">
                            Submitted on {request.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(request.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 