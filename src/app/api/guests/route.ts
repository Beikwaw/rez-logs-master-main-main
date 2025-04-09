import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { GuestData } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, ...guestData } = data;

    const docRef = await addDoc(collection(db, 'guests'), {
      ...guestData,
      userId,
      status: 'active',
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id 
    });
  } catch (error: any) {
    console.error('Error creating guest record:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create guest record' 
    }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let q = query(
      collection(db, 'guests'),
      orderBy('createdAt', 'desc')
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const guests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      checkoutTime: doc.data().checkoutTime?.toDate(),
    }));

    return NextResponse.json({ guests });
  } catch (error: any) {
    console.error('Error fetching guest records:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch guest records' 
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, checkoutTime } = await request.json();

    await updateDoc(doc(db, 'guests', id), {
      status,
      checkoutTime: checkoutTime ? Timestamp.fromDate(new Date(checkoutTime)) : null,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating guest record:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update guest record' 
    }, { status: 400 });
  }
} 