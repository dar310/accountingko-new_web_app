// api/auth/[...nextauth]/route.ts
import { handlers } from "@/app/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
    const url = new URL(request.url);
    
    // Check if this is a nodemailer callback
    if (url.pathname.includes('/callback/nodemailer')) {
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');
        
        console.log('🔐 NextAuth callback accessed:', {
            token: token?.substring(0, 8) + '...',
            email,
            timestamp: new Date().toISOString()
        });
        
        // At this point, the token should have been verified through /api/verify-email
        // NextAuth will handle the final authentication
    }
    
    // For the initial sign-in request that redirects to /verify
    if (url.pathname.includes('/signin') || url.pathname.includes('/verify-request')) {
        console.log('📝 Initial sign-in request, will redirect to /verify');
    }
    
    return handlers.GET(request);
}

export const { POST } = handlers;