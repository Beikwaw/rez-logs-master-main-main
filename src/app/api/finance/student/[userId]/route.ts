import { NextRequest, NextResponse } from 'next/server';
import { getStudentFinanceData } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const data = await getStudentFinanceData(params.userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
} 