import { SubmitButton } from "@/app/components/SubmitButtons";
import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { DeleteInvoice } from "@/app/actions";

async function Authorize(invoiceId: string, userId: string) {
    const data = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: userId,
      },
    });
  
    if (!data) {
      return redirect("/dashboard/invoices");
    }
}

type Params = Promise<{ invoiceId: string }>;

export default async function DeleteInvoiceRoute({params}: {params: Params}) {
    const session = await requireUser();
    const { invoiceId } = await params;
    await Authorize(invoiceId, session.user?.id as string);

    return (
        <div className="flex flex-1 justify-center items-center">
      <Card className="max-w-[500px]">
        <CardHeader>
          <CardTitle>Delete Invoice</CardTitle>
          <CardDescription>
            Are you sure that you want to delete this invoice?
          </CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/dashboard/invoices"
          >
            Cancel
          </Link>
          <form action={async () => {
              "use server";
              await DeleteInvoice(invoiceId);
            }}
          
          >
            
            <SubmitButton text="Delete Invoice" variant={"destructive"} />
          </form>
        </CardFooter>
      </Card>
    </div>
    )
}