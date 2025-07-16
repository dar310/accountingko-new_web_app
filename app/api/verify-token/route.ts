// app/api/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pendingVerifications } from '@/app/utils/auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
        return NextResponse.json({ valid: false, error: 'Missing token or email' });
    }
    
    const verification = pendingVerifications.get(token);
    
    if (!verification) {
        return NextResponse.json({ valid: false, error: 'Invalid or expired verification link' });
    }
    
    if (verification.email !== email) {
        return NextResponse.json({ valid: false, error: 'Email mismatch' });
    }
    
    // Check if token is expired (15 minutes)
    const tokenAge = Date.now() - verification.timestamp;
    if (tokenAge > 15 * 60 * 1000) {
        pendingVerifications.delete(token);
        return NextResponse.json({ valid: false, error: 'Verification link has expired' });
    }
    
    if (verification.verified) {
        return NextResponse.json({ valid: false, error: 'This link has already been used' });
    }
    
    return NextResponse.json({ valid: true });
}