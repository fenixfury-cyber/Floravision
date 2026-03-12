import Link from "next/link";
import { notFound } from "next/navigation";
import { logInventoryAdjustment, receiveInventory } from "@/app/actions";
import { requireShopAccess } from "@/lib/auth";
import { canManageShop } from "@/lib/authorization";
import { getShopInventory } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatMovementType(type: string) {
  return type.replaceAll("_", " ").toLowerCase();
}

export default async function ShopInventoryPage({ params }: PageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === slug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopInventory(slug);

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
          <span>Inventory</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Inventory Control</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Receive stems, log waste, and keep a running movement ledger for daily inventory truth.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.totalItems} inventory items
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.lowStockItems} low stock
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.useTodayItems} use today
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Receive Stock</p>
                <h2 className="font-serif text-3xl text-stone-950">Add new inventory</h2>
              </div>
              <form action={receiveInventory} className="mt-4 grid gap-4">
                <input type="hidden" name="shopSlug" value={slug} />
                <label className="grid gap-2 text-sm text-stone-700">
                  Inventory item
                  <select name="itemId" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    {data.shop.inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.color ? `${item.color} ` : ""}
                        {item.name} ({item.quantityOnHand} on hand)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Quantity received
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Freshness note
                  <input
                    name="freshnessNote"
                    placeholder="Peak bloom, use today, strong cooler stock"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Note
                  <input
                    name="note"
                    placeholder="DVFlora receipt or local grower delivery"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <button className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                  Receive Inventory
                </button>
              </form>
            </section>

            <section className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-amber-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-amber-700">Adjustments</p>
                <h2 className="font-serif text-3xl text-amber-950">Waste or manual correction</h2>
              </div>
              <form action={logInventoryAdjustment} className="mt-4 grid gap-4">
                <input type="hidden" name="shopSlug" value={slug} />
                <label className="grid gap-2 text-sm text-amber-950">
                  Inventory item
                  <select name="itemId" className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700">
                    {data.shop.inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.color ? `${item.color} ` : ""}
                        {item.name} ({item.quantityOnHand} on hand)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-amber-950">
                  Change type
                  <select name="type" defaultValue="WASTE" className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700">
                    <option value="WASTE">Waste</option>
                    <option value="MANUAL_ADJUSTMENT">Manual adjustment</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-amber-950">
                  Quantity
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700"
                  />
                </label>
                <label className="grid gap-2 text-sm text-amber-950">
                  Note
                  <input
                    name="note"
                    placeholder="Spoilage, overnight loss, recount correction"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700"
                  />
                </label>
                <button className="w-fit rounded-full bg-amber-900 px-5 py-3 text-sm font-medium text-white">
                  Log Change
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">On Hand</p>
                <h2 className="font-serif text-3xl text-stone-950">Current cooler stock</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {data.shop.inventoryItems.map((item) => (
                  <article key={item.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {item.color ? `${item.color} ` : ""}
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {item.category} • {item.unit.toLowerCase()}
                        </p>
                        <p className="mt-2 text-sm text-stone-700">{item.freshnessNote ?? "No freshness note."}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-stone-950">{item.quantityOnHand}</p>
                        <p className="mt-1 text-sm text-stone-600">on hand</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Recent Movements</p>
                <h2 className="font-serif text-3xl text-stone-950">Inventory ledger</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {data.movements.map((movement) => (
                  <article key={movement.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {movement.item.color ? `${movement.item.color} ` : ""}
                          {movement.item.name}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {formatMovementType(movement.type)} • {movement.note ?? "No note"}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {movement.createdBy?.displayName ?? "System"} • {movement.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${movement.quantity < 0 ? "text-amber-900" : "text-stone-950"}`}>
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </p>
                        {movement.order ? (
                          <p className="mt-1 text-sm text-stone-600">Order #{movement.order.orderNumber}</p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
