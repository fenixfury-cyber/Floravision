import Link from "next/link";
import { notFound } from "next/navigation";
import { getMembershipForShop, requireShopAccess } from "@/lib/auth";
import {
  canHandleDeliveries,
  canManageOrders,
  canManageShop,
} from "@/lib/authorization";
import { getShopBySlug } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ShopWorkspaceData = NonNullable<Awaited<ReturnType<typeof getShopBySlug>>>;
type WorkspaceOrder = ShopWorkspaceData["orders"][number];
type WorkspaceStaffMember = ShopWorkspaceData["staffMembers"][number];
type WorkspaceInventoryItem = ShopWorkspaceData["inventoryItems"][number];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ShopWorkspacePage({ params }: PageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const membership = getMembershipForShop(access, slug);
  const accessRole =
    access.user.platformRole === "PLATFORM_ADMIN" ? "platform admin" : membership?.role.toLowerCase() ?? "member";
  const role = membership?.role;
  const showManagement = canManageShop(access.user.platformRole, role);
  const showOrders = canManageOrders(access.user.platformRole, role);
  const showDeliveries = canHandleDeliveries(access.user.platformRole, role);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbf6ef_0%,#f1e6d6_100%)] px-5 py-6 text-stone-900 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200">
            Platform
          </Link>
          <span>/</span>
          <span>{shop.name}</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Tenant Workspace</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                This workspace is scoped to one florist tenant. From here the owner can see current orders, staff coverage,
                and inventory signals without leaving the tenant boundary.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-stone-700">
                  Signed in as {access.user.name}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-stone-700">
                  Access role: {accessRole}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {showOrders ? (
                <>
                  <Link
                    href={`/shops/${shop.slug}/orders`}
                    className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
                  >
                    Open Orders Board
                  </Link>
                  <Link
                    href={`/shops/${shop.slug}/customers`}
                    className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
                  >
                    Open Customers
                  </Link>
                  {showManagement ? (
                    <Link
                      href={`/shops/${shop.slug}/time-clock`}
                      className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
                    >
                      Open Time Clock
                    </Link>
                  ) : null}
                  {showManagement ? (
                    <Link
                      href={`/shops/${shop.slug}/inventory`}
                      className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
                    >
                      Open Inventory
                    </Link>
                  ) : null}
                  {showManagement ? (
                    <Link
                      href={`/shops/${shop.slug}/procurement`}
                      className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
                    >
                      Open Procurement
                    </Link>
                  ) : null}
                  {showManagement ? (
                    <Link
                      href={`/shops/${shop.slug}/proposals`}
                      className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
                    >
                      Open Proposals
                    </Link>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Orders</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">{shop.orders.length}</h2>
            <p className="mt-2 text-sm text-stone-600">Shop-scoped order count.</p>
          </article>
          <article className="rounded-[24px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Staff</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">{shop.staffMembers.length}</h2>
            <p className="mt-2 text-sm text-stone-600">Owner, designers, drivers, and more.</p>
          </article>
          <article className="rounded-[24px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Timezone</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">{shop.timezone}</h2>
            <p className="mt-2 text-sm text-stone-600">Used for scheduling, routing, and reminders.</p>
          </article>
          <article className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-rose-700">Top Inventory Signal</p>
            <h2 className="mt-2 text-2xl font-semibold text-rose-950">
              {shop.inventoryItems[0]?.name ?? "None"}
            </h2>
            <p className="mt-2 text-sm text-rose-900/75">
              {shop.inventoryItems[0]?.freshnessNote ?? "No inventory alerts for this shop yet."}
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
          <div className="border-b border-stone-200 pb-4">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Role Capabilities</p>
            <h2 className="font-serif text-3xl text-stone-950">What this user can do</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-sm font-semibold text-stone-950">Shop management</p>
              <p className="mt-2 text-sm text-stone-600">
                {showManagement ? "Can manage shop-wide settings and staffing views." : "No shop-management access."}
              </p>
            </article>
            <article className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-sm font-semibold text-stone-950">Order operations</p>
              <p className="mt-2 text-sm text-stone-600">
                {showOrders ? "Can work with orders and design workflow." : "Read-only or limited order access."}
              </p>
            </article>
            <article className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-sm font-semibold text-stone-950">Delivery workflow</p>
              <p className="mt-2 text-sm text-stone-600">
                {showDeliveries ? "Can handle delivery-specific workflow." : "No delivery workflow access."}
              </p>
            </article>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Orders</p>
              <h2 className="font-serif text-3xl text-stone-950">Shop order board</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {showOrders ? (
                shop.orders.map((order: WorkspaceOrder) => (
                  <Link
                    key={order.id}
                    href={`/shops/${shop.slug}/orders/${order.orderNumber}`}
                    className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-stone-950">
                          #{order.orderNumber} • {order.occasion}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {order.customer.name} • {order.assignedDesigner?.displayName ?? "Unassigned"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-stone-900">{formatMoney(order.totalAmount)}</p>
                        <p className="mt-1 text-xs text-stone-500">Open to update status or assign designer</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  This role does not have active order-management access.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Staff</p>
                <h2 className="font-serif text-3xl text-stone-950">Current team</h2>
              </div>
              {showManagement ? (
                <div className="mt-4 space-y-3">
                  {shop.staffMembers.map((staffMember: WorkspaceStaffMember) => (
                    <article key={staffMember.id} className="rounded-[18px] border border-stone-200 bg-stone-50/80 p-4">
                      <p className="text-sm font-semibold text-stone-950">{staffMember.displayName}</p>
                      <p className="mt-1 text-sm text-stone-600">{staffMember.role.toLowerCase()}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  Staff management is limited to managers and owners.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">
                  {showDeliveries ? "Delivery / Inventory" : "Inventory"}
                </p>
                <h2 className="font-serif text-3xl text-stone-950">
                  {showDeliveries ? "Delivery-ready cooler highlights" : "Cooler highlights"}
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {shop.inventoryItems.map((item: WorkspaceInventoryItem) => (
                  <article key={item.id} className="rounded-[18px] border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-sm font-semibold text-stone-950">
                      {item.color ? `${item.color} ` : ""}
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {item.quantityOnHand} on hand • {item.freshnessNote ?? "No freshness note"}
                    </p>
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
