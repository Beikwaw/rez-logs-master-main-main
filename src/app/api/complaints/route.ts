import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Complaint, ComplaintStatus } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, ...complaintData } = data;

    const docRef = await addDoc(collection(db, 'complaints'), {
      ...complaintData,
      userId,
      status: ComplaintStatus.PENDING,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id 
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create complaint' 
    }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc')
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const complaints = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    return NextResponse.json({ complaints });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch complaints' 
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, adminResponse } = await request.json();

    await updateDoc(doc(db, 'complaints', id), {
      status,
      adminResponse,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update complaint' 
    }, { status: 400 });
  }
} 