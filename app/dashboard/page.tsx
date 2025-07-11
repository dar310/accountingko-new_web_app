
import { Suspense } from "react";
import { DashboardBlocks } from "../components/DashboardBlocks";
import { InvoiceGraph } from "../components/InvoiceGraph";
import { RecentInvoices } from "../components/RecentInvoices";
import { requireUser } from "../utils/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceList } from "../components/InvoiceList";

export default async function DashboardRoute({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  await requireUser(); // Ensure the user is authenticated

  return (
    <>
      <Suspense fallback={<Skeleton className="w-full h-full flex-1" />}>
        <DashboardBlocks />
        <div className="grid gap-4 lg:grid-cols-3 md:gap-8">
          <InvoiceGraph />
          <RecentInvoices />
        </div>
      </Suspense>

      {/* Invoice list handles both search and empty state */}
      <InvoiceList searchParams={searchParams} />
    </>
  );
}
