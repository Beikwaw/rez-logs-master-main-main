import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { UserData } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const { email, password, action, userData } = await request.json();

    if (action === 'register') {
      // Register new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: userData.role || 'student',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        roomNumber: userData.roomNumber,
        tenantCode: userData.tenantCode,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, userId: user.uid });
    } else if (action === 'login') {
      // Login existing user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() as UserData;

      // Set session cookie
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const idToken = await userCredential.user.getIdToken();
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      
      const cookieStore = cookies();
      await cookieStore.set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.uid,
          ...userData
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      error: error.message || 'Authentication failed' 
    }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 400 });
  }
} 