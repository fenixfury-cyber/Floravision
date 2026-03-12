import Link from "next/link";
import { notFound } from "next/navigation";
import { createPurchaseOrder, receivePurchaseOrderLine } from "@/app/actions";
import { requireShopAccess } from "@/lib/auth";
import { canManageShop } from "@/lib/authorization";
import { getShopProcurement } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatMoney(cents: number | null) {
  if (cents == null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ShopProcurementPage({ params }: PageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === slug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopProcurement(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbf6ef_0%,#f1e6d6_100%)] px-5 py-6 text-stone-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200">
            Platform
          </Link>
          <span>/</span>
          <Link
            href={`/shops/${data.shop.slug}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200"
          >
            {data.shop.name}
          </Link>
          <span>/</span>
          <span>Procurement</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Procurement</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Create purchase orders and receive product against PO lines so procurement feeds inventory instead of living outside it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.totalPurchaseOrders} recent POs
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.openPurchaseOrders} open
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.partiallyReceived} partial
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">New Purchase Order</p>
              <h2 className="font-serif text-3xl text-stone-950">Create PO</h2>
            </div>
            <form action={createPurchaseOrder} className="mt-4 grid gap-4">
              <input type="hidden" name="shopSlug" value={slug} />
              <label className="grid gap-2 text-sm text-stone-700">
                PO number
                <input
                  name="poNumber"
                  placeholder="PO-2026-001"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                Vendor
                <input
                  name="vendorName"
                  placeholder="DVFlora, Mayesh, local grower"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                Expected date
                <input
                  name="expectedAt"
                  type="datetime-local"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                Inventory item
                <select name="itemId" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  {data.shop.inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.color ? `${item.color} ` : ""}
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-stone-700">
                  Ordered quantity
                  <input
                    name="orderedQuantity"
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Unit cost (cents)
                  <input
                    name="unitCostCents"
                    type="number"
                    min="0"
                    step="1"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-stone-700">
                Notes
                <input
                  name="notes"
                  placeholder="Holiday preload, cooler refill, hydrangea restock"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <button className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                Create Purchase Order
              </button>
            </form>
          </section>

          <section className="grid gap-4">
            {data.shop.purchaseOrders.map((purchaseOrder) => (
              <article
                key={purchaseOrder.id}
                className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">{purchaseOrder.vendorName}</p>
                    <h2 className="mt-1 font-serif text-3xl text-stone-950">{purchaseOrder.poNumber}</h2>
                    <p className="mt-2 text-sm text-stone-600">
                      {purchaseOrder.status.replaceAll("_", " ").toLowerCase()}
                      {purchaseOrder.expectedAt ? ` • expected ${purchaseOrder.expectedAt.toLocaleString()}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-stone-700">{purchaseOrder.notes ?? "No notes."}</p>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                    {purchaseOrder.lines.length} lines
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {purchaseOrder.lines.map((line) => (
                    <div key={line.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            {line.inventoryItem.color ? `${line.inventoryItem.color} ` : ""}
                            {line.inventoryItem.name}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            Ordered {line.orderedQuantity} • Received {line.receivedQuantity} • {formatMoney(line.unitCostCents)}
                          </p>
                        </div>
                        <form action={receivePurchaseOrderLine} className="grid gap-2 lg:min-w-[260px]">
                          <input type="hidden" name="shopSlug" value={slug} />
                          <input type="hidden" name="purchaseOrderId" value={purchaseOrder.id} />
                          <input type="hidden" name="purchaseOrderLineId" value={line.id} />
                          <input
                            name="receivedQuantity"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Qty received"
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                          />
                          <input
                            name="note"
                            placeholder={`Receive against ${purchaseOrder.poNumber}`}
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                          />
                          <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                            Receive Line
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {data.shop.purchaseOrders.length === 0 ? (
              <div className="rounded-[28px] border border-stone-200/70 bg-white/80 p-6 text-sm text-stone-600 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
                No purchase orders yet.
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
