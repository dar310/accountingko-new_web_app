import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

// Load public key once (or reuse from your route.ts)
const publicKey = fs.readFileSync(path.join(process.cwd(), "public.key"), "utf8");

async function requireUserFromAPI(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header missing or invalid");
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      userId: decoded.userId,
      type: decoded.type || 'mobile',
    };
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const user = await requireUserFromAPI(request);
    const { invoiceId } = await params;
    const data = await request.json();

    if (!data.invoiceName) {
      return NextResponse.json({ error: "invoiceName is required" }, { status: 400 });
    }

    // Validate and transform fields (add your full validation as needed)
    const total = parseFloat(data.total);
    if (isNaN(total)) {
      return NextResponse.json({ error: "Invalid total value" }, { status: 400 });
    }
    const transformedData = {
      invoiceName: data.invoiceName,
      total,
      status: data.status,
      date: new Date(data.date),
      dueDate: parseInt(data.dueDate),
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      fromAddress: data.fromAddress,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientAddress: data.clientAddress,
      currency: data.currency,
      invoiceNumber: parseInt(data.invoiceNumber),
      note: data.note,
      invoiceItemDescription: data.invoiceItemDescription,
      invoiceItemQuantity: parseInt(data.invoiceItemQuantity),
      invoiceItemRate: parseFloat(data.invoiceItemRate),
    };

    // Find invoice where either mobileUserId or userId matches
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { mobileUserId: user.id },
          { userId: user.userId }
        ],
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
    }

    // Now update by unique id
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: transformedData,
    });

    return NextResponse.json(updatedInvoice);

  } catch (error: any) {
    if (error.message === "Authorization header missing or invalid" || error.message === "Invalid or expired token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
    }
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const user = await requireUserFromAPI(request);
    const { invoiceId } = await params;
    
    // Find invoice where either mobileUserId or userId matches
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { mobileUserId: user.id },
          { userId: user.userId }
        ],
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
    }

    // Now delete by unique id
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    if (error.message === "Authorization header missing or invalid" || error.message === "Invalid or expired token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
    }
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}