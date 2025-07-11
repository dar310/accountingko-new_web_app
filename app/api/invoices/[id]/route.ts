export async function PUT(request: Request, { params }: { params: { invoiceId: string } }) {
  const user = await requireUser();
  const { invoiceId } = params;
  const data = await request.json();

  // Optionally verify the invoice belongs to the user here

  const updatedInvoice = await prisma.invoice.updateMany({
    where: { id: invoiceId, userId: user.id },
    data,
  });

  if (updatedInvoice.count === 0) {
    return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
  }

  return NextResponse.json(updatedInvoice);
}

export async function DELETE(request: Request, { params }: { params: { invoiceId: string } }) {
  const user = await requireUser();
  const { invoiceId } = params;

  const deleted = await prisma.invoice.deleteMany({
    where: { id: invoiceId, userId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Invoice not found or no permission" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
