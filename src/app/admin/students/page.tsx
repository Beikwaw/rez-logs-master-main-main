'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getAllStudents, deactivateStudent } from '@/lib/firestore';
import { toast } from 'sonner';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive';
  room_number: string;
  tenant_code: string;
  phoneNumber: string;
  placeOfStudy: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const fetchedStudents = await getAllStudents();
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student: Student) => {
    // Implement view details functionality
    console.log('View details:', student);
  };

  const handleDeactivate = async (studentId: string) => {
    try {
      await deactivateStudent(studentId);
      toast.success('Student deactivated successfully');
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('Error deactivating student:', error);
      toast.error('Failed to deactivate student');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Students</h1>
      {students.map((student) => (
        <Card key={student.id} className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{student.firstName} {student.lastName}</CardTitle>
                <CardDescription>{student.email}</CardDescription>
              </div>
              <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                {student.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Room Number</Label>
                <p className="text-lg font-semibold">{student.room_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tenant Code</Label>
                <p className="text-lg font-semibold">{student.tenant_code}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <p>{student.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Place of Study</Label>
                <p>{student.placeOfStudy}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(student)}
            >
              View Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeactivate(student.id)}
              disabled={student.status !== 'active'}
            >
              Deactivate
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 