"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { createUser } from "@/lib/firestore";
import { toast as sonnerToast } from "sonner";
import { useForm } from "react-hook-form";

interface FormData {
  email: string;
  name: string;
  surname: string;
  phone: string;
  place_of_study: string;
  room_number: string;
  tenant_code: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();

  const validateForm = (data: FormData) => {
    // Email validation
    if (!data.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    // Password validation
    if (data.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmitForm = async (data: FormData) => {
    setLoading(true);
    setError(null);

    if (!validateForm(data)) {
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Create profile in Firestore using our function
      await createUser({
        id: user.uid,
        email: data.email,
        name: data.name,
        surname: data.surname,
        full_name: `${data.name} ${data.surname}`,
        phone: data.phone,
        place_of_study: data.place_of_study,
        room_number: data.room_number,
        tenant_code: data.tenant_code,
        role: "newbie",
        applicationStatus: "pending",
      });

      setSuccess(true);
      sonnerToast.success("Thank you for registering. Your application is being reviewed.");

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/portals/student");
      }, 3000);
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl">My Domain Student Living</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 bg-muted">
        <div className="container px-4 md:px-6">
          {success ? (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 animate-pulse-slow">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Registration Successful!</CardTitle>
                <CardDescription>
                  Your registration has been submitted and is pending approval by an administrator.
                  You can log in now to check your application status.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Link href="/portals/student">
                  <Button className="bg-primary hover:bg-primary/90">Go to Login</Button>
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>Fill in your details to sign up for My Domain Student Living.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(handleSubmitForm)}>
                <CardContent className="space-y-4">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...register('name', { required: 'First name is required' })}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...register('surname', { required: 'Last name is required' })}
                      />
                      {errors.surname && <p className="text-sm text-red-500">{errors.surname.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="0835673304"
                        {...register('phone', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9+\-\s()]*$/,
                            message: 'Invalid phone number'
                          }
                        })}
                      />
                      {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfStudy">Place of Study</Label>
                      <Input
                        id="placeOfStudy"
                        placeholder="University/College Name"
                        {...register('place_of_study', { required: 'Place of study is required' })}
                      />
                      {errors.place_of_study && <p className="text-sm text-red-500">{errors.place_of_study.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Input
                        id="roomNumber"
                        {...register('room_number', { required: 'Room number is required' })}
                      />
                      {errors.room_number && <p className="text-sm text-red-500">{errors.room_number.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenantCode">Tenant Code</Label>
                      <Input
                        id="tenantCode"
                        {...register('tenant_code', { required: 'Tenant code is required' })}
                      />
                      {errors.tenant_code && <p className="text-sm text-red-500">{errors.tenant_code.message}</p>}
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important Notice</AlertTitle>
                        <AlertDescription>
                          Your tenant code is very important as it will be used to make and receive requests. 
                          If you are not sure about your tenant code, please contact management immediately.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register('password', { required: 'Password is required' })}
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) => value === watch('password') || 'Passwords do not match'
                        })}
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </div>
                </CardContent>
              </form>
              <CardFooter className="flex justify-center border-t pt-4 text-sm">
                Already have an account?{" "}
                <Link href="/portals/student" className="ml-1 text-primary hover:underline">
                  Log in
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-6 md:py-0 bg-secondary text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose md:text-left">
            © 2025 My Domain Student Living. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}