// app/api/invoices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Load public key for JWT verification
const publicKey = fs.readFileSync(path.join(process.cwd(), "public.key"), "utf8");

async function requireUserFromAPI(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header missing or invalid");
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, publicKey, { 
      algorithms: ["RS256"] 
    }) as any;

    console.log("Decoded token:", decoded);

    return {
      id: decoded.id,
      email: decoded.email,
      userId: decoded.userId, // This is the link to User table
      type: decoded.type || 'mobile'
    };
    
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Invalid or expired token");
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUserFromAPI(request);
    
    console.log("Fetching invoices for user:", user);
    
    // Based on your schema, invoices can be linked via userId OR mobileUserId
    // For mobile users, we need to check both possibilities
    
    let invoices;
    
    if (user.type === 'mobile') {
      // Option 1: Try to find invoices using mobileUserId (direct mobile user link)
      const mobileInvoices = await prisma.invoice.findMany({
        where: { mobileUserId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          mobileUser: {
            select: { id: true, email: true, name: true }
          }
        }
      });
      
      // Option 2: If mobile user is linked to a User, also check userId
      let linkedInvoices = [];
      if (user.userId) {
        linkedInvoices = await prisma.invoice.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        });
      }
      
      // Combine both sets of invoices and remove duplicates
      const allInvoices = [...mobileInvoices, ...linkedInvoices];
      const uniqueInvoices = allInvoices.filter((invoice, index, self) => 
        index === self.findIndex(i => i.id === invoice.id)
      );
      
      invoices = uniqueInvoices;
      
    } else {
      // Web user - only check userId
      invoices = await prisma.invoice.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          User: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      });
    }

    console.log(`Found ${invoices.length} invoices for user:`, {
      mobileUserId: user.id,
      linkedUserId: user.userId,
      userType: user.type
    });

    return NextResponse.json({
      success: true,
      data: invoices,
      meta: {
        count: invoices.length,
        user: {
          id: user.id,
          linkedUserId: user.userId,
          type: user.type
        }
      }
    });
    
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserFromAPI(request);
    const data = await request.json();
    
    console.log("Creating invoice for user:", user);
    
    // Create invoice and link it properly based on user type
    const invoiceData = {
      ...data,
      // For mobile users, set mobileUserId
      ...(user.type === 'mobile' && { mobileUserId: user.id }),
      // If mobile user is linked to a User, also set userId
      ...(user.userId && { userId: user.userId })
    };
    
    const newInvoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        mobileUser: {
          select: { id: true, email: true, name: true }
        },
        User: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: newInvoice
    }, { status: 201 });
    
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Alternative simpler approach - just use mobileUserId for mobile users
export async function GET_SIMPLE(request: Request) {
  try {
    const user = await requireUserFromAPI(request);
    
    // For mobile users, search by mobileUserId
    const invoices = await prisma.invoice.findMany({
      where: { 
        mobileUserId: user.id  // Use mobile user ID directly
      },
      orderBy: { createdAt: "desc" },
      include: {
        mobileUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log(`Found ${invoices.length} invoices for mobileUserId: ${user.id}`);

    return NextResponse.json({
      success: true,
      data: invoices
    });
    
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 401 });
  }
}