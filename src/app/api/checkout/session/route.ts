import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await getCheckoutSession(sessionId);

    return NextResponse.json({ 
      success: true,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
        amount_total: session.amount_total,
        metadata: session.metadata,
        subscription: session.subscription
      }
    });
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to retrieve session' 
      },
      { status: 500 }
    );
  }
}