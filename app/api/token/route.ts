import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { prisma } from "@/app/utils/db";

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf8");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: "1d" });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
