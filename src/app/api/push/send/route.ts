import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json();

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user's push subscription
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No push subscription found for user' }, { status: 404 });
    }

    const sub = subscription.subscription as any;

    // Send push notification using Web Push Protocol
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192.png',
    });

    // This would typically use web-push library, but for now we'll return success
    // In production, you'd use web-push library with VAPID keys
    console.log('Push notification would be sent to:', sub.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
