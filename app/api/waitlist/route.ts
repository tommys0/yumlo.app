import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';
import { waitlistConfirmationEmail } from '@/lib/emails/waitlist-confirmation';

export async function POST(req: NextRequest) {
  try {
    const { name, email, referralCode } = await req.json();

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already on waitlist' },
        { status: 400 }
      );
    }

    // Look up referrer if referral code provided
    let invitedBy = null;
    if (referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('waitlist')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrer) {
        invitedBy = referrer.id;
        console.log('Waitlist referral detected:', referralCode, 'Referrer ID:', invitedBy);
      } else {
        console.warn('Invalid referral code provided:', referralCode);
      }
    }

    // Add to waitlist
    const { data: newEntry, error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        name: name.trim(),
        email: email.toLowerCase(),
        invited_by: invitedBy,
      })
      .select('id, referral_code')
      .single();

    if (error) {
      console.error('Error adding to waitlist:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // Increment referrer's count if applicable
    if (invitedBy) {
      const { data: referrer } = await supabaseAdmin
        .from('waitlist')
        .select('referrals_count')
        .eq('id', invitedBy)
        .single();

      if (referrer) {
        await supabaseAdmin
          .from('waitlist')
          .update({ referrals_count: (referrer.referrals_count || 0) + 1 })
          .eq('id', invitedBy);

        console.log('Waitlist referral count incremented for:', invitedBy);
      }
    }

    // Get position in line
    const { count } = await supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const position = count || 0;

    console.log('Added to waitlist:', email, 'Position:', position);

    // Send confirmation email
    try {
      const emailTemplate = waitlistConfirmationEmail(name.trim(), position);

      await resend.emails.send({
        from: 'Yumlo <no-reply@mail.yumlo.app>',
        to: email.toLowerCase(),
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log('Confirmation email sent to:', email);
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Failed to send confirmation email:', emailError);
      // User is still added to waitlist, just no email sent
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position,
      referralCode: newEntry?.referral_code,
    });
  } catch (error: any) {
    console.error('Error in waitlist API:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
