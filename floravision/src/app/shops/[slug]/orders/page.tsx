import Link from "next/link";
import { notFound } from "next/navigation";
import type { FulfillmentType, OrderStatus } from "@prisma/client";
import { assignOrderDesigner, updateOrderStatus } from "@/app/actions";
import { getMembershipForShop, requireShopAccess } from "@/lib/auth";
import { canManageOrders } from "@/lib/authorization";
import { getShopOrders } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    status?: string;
    fulfillmentType?: string;
    designerId?: string;
    query?: string;
  }>;
};

const statusOptions: Array<{ label: string; value: OrderStatus | "" }> = [
  { label: "All statuses", value: "" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Designing", value: "DESIGNING" },
  { label: "Ready for pickup", value: "READY_FOR_PICKUP" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const fulfillmentOptions: Array<{ label: string; value: FulfillmentType | "" }> = [
  { label: "All fulfillment", value: "" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "Event", value: "EVENT" },
];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function prettyStatus(status: OrderStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function ShopOrdersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const access = await requireShopAccess(slug);
  const membership = getMembershipForShop(access, slug);

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopOrders(slug, {
    status: (filters.status as OrderStatus | undefined) || undefined,
    fulfillmentType: (filters.fulfillmentType as FulfillmentType | undefined) || undefined,
    designerId: filters.designerId || undefined,
    query: filters.query || undefined,
  });

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
          <span>Orders</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Orders Board</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Shop-scoped order triage with server-side filtering for daily production management.
              </p>
            </div>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
              {data.orders.length} matching orders
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-500">All Orders</p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">{data.summary.totalOrders}</p>
            </article>
            <article className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-500">Unassigned</p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">{data.summary.unassignedOrders}</p>
            </article>
            <article className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-500">Deliveries</p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">{data.summary.deliveryOrders}</p>
            </article>
            <article className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-500">Ready Pickup</p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">{data.summary.readyOrders}</p>
            </article>
          </div>

          <form className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm text-stone-700 md:col-span-4 xl:col-span-1">
              Search
              <input
                name="query"
                defaultValue={filters.query ?? ""}
                placeholder="Order #, customer, occasion, note"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-700">
              Status
              <select
                name="status"
                defaultValue={filters.status ?? ""}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                {statusOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-stone-700">
              Fulfillment
              <select
                name="fulfillmentType"
                defaultValue={filters.fulfillmentType ?? ""}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                {fulfillmentOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-stone-700">
              Designer
              <select
                name="designerId"
                defaultValue={filters.designerId ?? ""}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <option value="">All designers</option>
                {data.shop.staffMembers.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.displayName}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                Apply Filters
              </button>
              <Link
                href={`/shops/${slug}/orders`}
                className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-4">
          {data.orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[24px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/shops/${slug}/orders/${order.orderNumber}`}
                      className="text-xl font-semibold text-stone-950 hover:text-rose-800"
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                      {prettyStatus(order.status)}
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                      {order.fulfillmentType.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-stone-800">
                    {order.occasion} for {order.customer.name}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Designer: {order.assignedDesigner?.displayName ?? "Unassigned"} • Due {formatTime(order.dueAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700"
                      >
                        {item.description}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="xl:w-[360px]">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-950">{formatMoney(order.totalAmount)}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {order.delivery ? `Delivery status: ${order.delivery.status.toLowerCase()}` : "No delivery record"}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <form action={updateOrderStatus} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-3">
                      <input type="hidden" name="shopSlug" value={slug} />
                      <input type="hidden" name="orderNumber" value={order.orderNumber} />
                      <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                        Quick Status
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-700"
                        >
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="DESIGNING">Designing</option>
                          <option value="READY_FOR_PICKUP">Ready for pickup</option>
                          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </label>
                      <button className="mt-3 w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                        Save
                      </button>
                    </form>

                    <form action={assignOrderDesigner} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-3">
                      <input type="hidden" name="shopSlug" value={slug} />
                      <input type="hidden" name="orderNumber" value={order.orderNumber} />
                      <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                        Quick Assign
                        <select
                          name="designerId"
                          defaultValue={order.assignedDesigner?.id ?? data.shop.staffMembers[0]?.id}
                          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-700"
                        >
                          {data.shop.staffMembers.map((staffMember) => (
                            <option key={staffMember.id} value={staffMember.id}>
                              {staffMember.displayName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="mt-3 w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                        Assign
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {data.orders.length === 0 ? (
            <div className="rounded-[24px] border border-stone-200/70 bg-white/80 p-6 text-sm text-stone-600 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              No orders matched the current filters.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
