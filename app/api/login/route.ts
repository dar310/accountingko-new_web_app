import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { linkAccountsByEmail } from "@/app/utils/linkAccounts";
import fs from "fs";
import path from "path";

// Load private RSA key with error handling
let privateKey;
try {
  privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf8");
  
  // Validate key format
  if (!privateKey.includes("-----BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error("Invalid private key format");
  }
} catch (error) {
  console.error("Error loading private key:", error);
  throw error;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find mobile user
    const mobileUser = await prisma.mobileUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        userId: true, // This will be used to link to invoices later
        createdAt: true,
        updatedAt: true
      }
    });

    if (!mobileUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, mobileUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Link accounts by email (for future web user integration)
    try {
      await linkAccountsByEmail(email);
    } catch (linkError) {
      console.warn("Account linking failed:", linkError);
      // Don't fail login if linking fails
    }

    // Create JWT payload
    const payload = {
      id: mobileUser.id,
      email: mobileUser.email,
      userId: mobileUser.userId, // This will be used for invoice access
      type: 'mobile',
      iat: Math.floor(Date.now() / 1000)
    };

    // Sign JWT token
    const token = jwt.sign(
      payload,
      privateKey,
      {
        algorithm: "RS256",
        expiresIn: "7d"
      }
    );

    console.log("Mobile user logged in:", {
      id: mobileUser.id,
      email: mobileUser.email,
      hasUserId: !!mobileUser.userId
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: mobileUser.id,
        email: mobileUser.email,
        userId: mobileUser.userId
      }
    });

  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}