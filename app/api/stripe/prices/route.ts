import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
    const ultraPriceId = process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID;

    if (!basicPriceId || !ultraPriceId) {
      return NextResponse.json(
        { error: 'Price IDs not configured' },
        { status: 500 }
      );
    }

    // Fetch both prices from Stripe
    const [basicPrice, ultraPrice] = await Promise.all([
      stripe.prices.retrieve(basicPriceId, { expand: ['product'] }),
      stripe.prices.retrieve(ultraPriceId, { expand: ['product'] }),
    ]);

    return NextResponse.json({
      basic: {
        id: basicPrice.id,
        amount: basicPrice.unit_amount,
        currency: basicPrice.currency,
        interval: basicPrice.recurring?.interval,
      },
      ultra: {
        id: ultraPrice.id,
        amount: ultraPrice.unit_amount,
        currency: ultraPrice.currency,
        interval: ultraPrice.recurring?.interval,
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
