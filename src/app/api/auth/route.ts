import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { UserData } from '@/lib/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    // Create session cookie using Firebase Admin SDK
    const auth = getAuth();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    // Set the session cookie
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create session cookie' },
      { status: 401 }
    );
  }
}

export async function GET() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const auth = getAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    
    return NextResponse.json({ 
      isAuthenticated: true,
      uid: decodedClaims.uid
    });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}

export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to delete session cookie' },
      { status: 500 }
    );
  }
} 