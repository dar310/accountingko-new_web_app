// app/api/mobile/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if MobileUser already exists
    const existingMobileUser = await prisma.mobileUser.findUnique({ where: { email } });
    if (existingMobileUser) {
      return NextResponse.json({ error: "Mobile user already exists" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a web User exists with the same email
    let linkedUser = await prisma.user.findUnique({ where: { email } });

    // If no web user, create one
    if (!linkedUser) {
      linkedUser = await prisma.user.create({
        data: {
          email,
          // Optionally fill other User fields here
          // For example: firstName: name,
        },
      });
    }

    // Create MobileUser linked to the web User via userId
    const mobileUser = await prisma.mobileUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        userId: linkedUser.id,
      },
    });

    return NextResponse.json({
      message: "Mobile user registered successfully",
      mobileUserId: mobileUser.id,
      linkedUserId: linkedUser.id,
    });
  } catch (error) {
    console.error("Mobile registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
