import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId, userId, planType, planId } = await request.json();

    // Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Validate price ID exists
    if (!Object.values(PRICE_IDS).includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    const metadata = {
      userId: userId || 'unknown',
      planType: planType || 'unknown',
      priceId: priceId,
      planId: planId || 'unknown',
      timestamp: new Date().toISOString()
    };

    const session = await createCheckoutSession(priceId, customerId, metadata);

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      sessionUrl: session.url // Make sure this is returned
    });

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}