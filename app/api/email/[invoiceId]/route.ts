import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { emailClient } from "@/app/utils/resend";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string }>;
  }
) {
  try {
    const session = await requireUser();

    const { invoiceId } = await params;

    const invoiceData = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user?.id,
      },
    });

    if (!invoiceData) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const sender = {
      email: "dardex999@gmail.com",
      name: "Accounting Ko",
    };

    const recipients = [
        {
          email: invoiceData.clientEmail,
        }
      ];

    emailClient.send({
      from: sender,
      to: [{ email: invoiceData.clientEmail }],
      template_uuid: "5ce0aaf9-d7a3-40b5-b267-92fc39974074",
        template_variables: {
        "first_name": invoiceData.clientName,
        "company_info_name": "Mapua University",
        "company_info_address": "Fake Address",
        "company_info_city": "Pasig City",
        "company_info_zip_code": "1800",
        "company_info_country": "Philippines"
    }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
}