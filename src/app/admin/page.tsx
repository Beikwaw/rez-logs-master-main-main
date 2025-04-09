'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserData, 
  getPendingApplications, 
  processRequest,
  getComplaints,
  getSleepoverRequests,
  getMaintenanceRequests,
  Complaint,
  SleepoverRequest,
  MaintenanceRequest,
  getAllGuestRequests,
  getAllComplaints,
  getAllSleepoverRequests,
  getAllMaintenanceRequests
} from '../../lib/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Calendar, Wrench, CheckCircle, XCircle, RefreshCw, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { LatestRequests } from '@/components/admin/LatestRequests';
import { Analytics } from "@/components/admin/Analytics";
import DailyReport from '@/components/DailyReport';
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface GuestData {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roomNumber: string;
  purpose: string;
  fromDate: string;
  status: 'active' | 'checked_out';
  tenantCode: string;
  createdAt: Date;
  checkoutTime?: Date;
}

interface SleepoverRequest {
  id: string;
  studentName: string;
  roomNumber: string;
  status: string;
  createdAt: Date;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingApplications, setPendingApplications] = useState<UserData[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [sleepoverRequests, setSleepoverRequests] = useState<SleepoverRequest[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestRequests, setGuestRequests] = useState<GuestData[]>([]);
  const [dailyStats, setDailyStats] = useState({
    totalGuests: 0,
    activeGuests: 0,
    checkedOutGuests: 0,
    totalComplaints: 0,
    totalSleepovers: 0,
    totalMaintenance: 0
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [guests, complaintsData, sleepovers, maintenance] = await Promise.all([
        getAllGuestRequests(),
        getAllComplaints(),
        getAllSleepoverRequests(),
        getAllMaintenanceRequests()
      ]);
      
      setGuestRequests(guests);
      setComplaints(complaintsData);
      setSleepoverRequests(sleepovers);
      setMaintenanceRequests(maintenance);
      updateDailyStats(guests, complaintsData, sleepovers, maintenance);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const updateDailyStats = (
    guests: GuestData[],
    complaints: Complaint[],
    sleepovers: SleepoverRequest[],
    maintenance: MaintenanceRequest[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayGuests = guests.filter(guest => 
      guest.fromDate === today || 
      (guest.checkoutTime && new Date(guest.checkoutTime).toISOString().split('T')[0] === today)
    );

    const todayComplaints = complaints.filter(complaint => 
      new Date(complaint.createdAt).toISOString().split('T')[0] === today
    );

    const todaySleepovers = sleepovers.filter(request => 
      new Date(request.createdAt).toISOString().split('T')[0] === today
    );

    const todayMaintenance = maintenance.filter(request => 
      new Date(request.createdAt).toISOString().split('T')[0] === today
    );

    setDailyStats({
      totalGuests: todayGuests.length,
      activeGuests: todayGuests.filter(guest => guest.status === 'active').length,
      checkedOutGuests: todayGuests.filter(guest => guest.status === 'checked_out').length,
      totalComplaints: todayComplaints.length,
      totalSleepovers: todaySleepovers.length,
      totalMaintenance: todayMaintenance.length
    });
  };

  const handleProcessApplication = async (
    userId: string,
    status: 'accepted' | 'denied',
    message: string
  ) => {
    try {
      await processRequest(userId, status, message, user?.uid || '');
      setPendingApplications(prev => prev.filter(app => app.id !== userId));
    } catch (err) {
      setError('Failed to process application');
      console.error(err);
    }
  };

  const generateDailyReport = () => {
    try {
      const doc = new jsPDF();
      const today = format(new Date(), 'PPP');
      
      // Add title
      doc.setFontSize(20);
      doc.text('Daily Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(today, 105, 30, { align: 'center' });

      // Guest Statistics
      doc.setFontSize(16);
      doc.text('Guest Statistics', 20, 45);
      doc.setFontSize(12);
      doc.text(`Total Guests: ${dailyStats.totalGuests}`, 20, 55);
      doc.text(`Active Guests: ${dailyStats.activeGuests}`, 20, 65);
      doc.text(`Checked Out Guests: ${dailyStats.checkedOutGuests}`, 20, 75);

      // Guest Details Table
      const guestData = guestRequests.filter(guest => 
        guest.fromDate === format(new Date(), 'yyyy-MM-dd') || 
        (guest.checkoutTime && format(new Date(guest.checkoutTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
      ).map(guest => [
        `${guest.firstName} ${guest.lastName}`,
        guest.roomNumber,
        guest.status,
        format(new Date(guest.createdAt), 'p'),
        guest.checkoutTime ? format(new Date(guest.checkoutTime), 'p') : 'N/A'
      ]);

      autoTable(doc, {
        startY: 85,
        head: [['Name', 'Room', 'Status', 'Check-in', 'Check-out']],
        body: guestData
      });

      // Complaints Section
      const complaintsY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Complaints', 20, complaintsY);
      doc.setFontSize(12);
      doc.text(`Total Complaints: ${dailyStats.totalComplaints}`, 20, complaintsY + 10);

      const complaintData = complaints.filter(complaint => 
        format(new Date(complaint.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).map(complaint => [
        complaint.title,
        complaint.status,
        format(new Date(complaint.createdAt), 'p')
      ]);

      autoTable(doc, {
        startY: complaintsY + 15,
        head: [['Title', 'Status', 'Time']],
        body: complaintData
      });

      // Sleepover Requests Section
      const sleepoverY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Sleepover Requests', 20, sleepoverY);
      doc.setFontSize(12);
      doc.text(`Total Requests: ${dailyStats.totalSleepovers}`, 20, sleepoverY + 10);

      const sleepoverData = sleepoverRequests.filter(request => 
        format(new Date(request.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).map(request => [
        request.studentName,
        request.roomNumber,
        request.status,
        format(new Date(request.createdAt), 'p')
      ]);

      autoTable(doc, {
        startY: sleepoverY + 15,
        head: [['Student', 'Room', 'Status', 'Time']],
        body: sleepoverData
      });

      // Maintenance Requests Section
      const maintenanceY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Maintenance Requests', 20, maintenanceY);
      doc.setFontSize(12);
      doc.text(`Total Requests: ${dailyStats.totalMaintenance}`, 20, maintenanceY + 10);

      const maintenanceData = maintenanceRequests.filter(request => 
        format(new Date(request.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).map(request => [
        request.title,
        request.status,
        format(new Date(request.createdAt), 'p')
      ]);

      autoTable(doc, {
        startY: maintenanceY + 15,
        head: [['Title', 'Status', 'Time']],
        body: maintenanceData
      });

      // Save the PDF
      doc.save(`daily-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Daily report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate daily report');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const applicationsPending = pendingApplications.length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const pendingSleepovers = sleepoverRequests.filter(r => r.status === 'pending').length;
  const pendingMaintenance = maintenanceRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateDailyReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Daily Report
          </Button>
        </div>
      </div>

      <Analytics dailyStats={dailyStats} />

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsPending}</div>
            <p className="text-xs text-muted-foreground">
              New student applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Complaints
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              {complaints.length} total complaints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Sleepovers
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSleepovers}</div>
            <p className="text-xs text-muted-foreground">
              {sleepoverRequests.length} total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Tasks
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              {maintenanceRequests.length} total tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Requests */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Latest Requests</h2>
        <LatestRequests
          pendingApplications={pendingApplications}
          complaints={complaints}
          sleepoverRequests={sleepoverRequests}
          maintenanceRequests={maintenanceRequests}
        />
      </div>

      {/* Latest Content Tabs */}
      <Tabs defaultValue="sleepover" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sleepover">Sleepover Requests</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="sleepover" className="space-y-4">
          {/* <SleepoverManagement /> */}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {/* <AnnouncementManagement /> */}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          {/* <ComplaintManagement /> */}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* <UserManagement /> */}
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalGuests}</div>
            <p className="text-xs text-muted-foreground">
              Total number of guests for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.activeGuests}</div>
            <p className="text-xs text-muted-foreground">
              Currently active guests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.checkedOutGuests}</div>
            <p className="text-xs text-muted-foreground">
              Guests checked out today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Complaints received today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleepover Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalSleepovers}</div>
            <p className="text-xs text-muted-foreground">
              Sleepover requests today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Maintenance requests today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}