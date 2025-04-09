import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { SleepoverRequest, SleepoverStatus } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, ...requestData } = data;

    const docRef = await addDoc(collection(db, 'sleepover_requests'), {
      ...requestData,
      userId,
      status: SleepoverStatus.PENDING,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id 
    });
  } catch (error: any) {
    console.error('Error creating sleepover request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create sleepover request' 
    }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let q = query(
      collection(db, 'sleepover_requests'),
      orderBy('createdAt', 'desc')
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching sleepover requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch sleepover requests' 
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, adminResponse } = await request.json();

    await updateDoc(doc(db, 'sleepover_requests', id), {
      status,
      adminResponse,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating sleepover request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update sleepover request' 
    }, { status: 400 });
  }
} 