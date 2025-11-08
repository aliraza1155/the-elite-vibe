import { NextRequest, NextResponse } from 'next/server';
import { createOneTimeCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      modelName, 
      modelId, 
      buyerId, 
      sellerId, 
      customerId 
    } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!modelName || !modelId || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: modelName, modelId, buyerId, sellerId' },
        { status: 400 }
      );
    }

    const metadata = {
      modelId,
      modelName,
      buyerId,
      sellerId,
      amount,
      timestamp: new Date().toISOString()
    };

    const session = await createOneTimeCheckoutSession(
      amount,
      modelName,
      modelId,
      buyerId,
      sellerId,
      customerId,
      metadata
    );

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      sessionUrl: session.url
    });

  } catch (error: any) {
    console.error('Model checkout API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}