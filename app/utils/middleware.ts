// middleware.ts
import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  console.log(`[${new Date().toISOString()}] ${req.method} ${nextUrl.pathname} - Auth: ${isLoggedIn}`)

  // Never interfere with NextAuth API routes
  if (nextUrl.pathname.startsWith('/api/auth/')) {
    console.log('NextAuth API route - allowing through')
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/verify',
    '/verify-request',
    '/auth/error',
    '/favicon.ico',
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
  )

  // Allow access to public routes
  if (isPublicRoute) {
    console.log('Public route - allowing access')
    return NextResponse.next()
  }

  // Protect dashboard and other private routes
  if (!isLoggedIn && nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Protected route accessed without auth - redirecting to login')
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow all other requests
  return NextResponse.next()
})

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}