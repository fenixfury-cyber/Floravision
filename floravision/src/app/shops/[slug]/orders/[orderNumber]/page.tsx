import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addOrderPhoto,
  assignOrderDesigner,
  markDeliveryItemChecked,
  updateCustomerNotes,
  updateOrderNotes,
  updateOrderStatus,
} from "@/app/actions";
import { getMembershipForShop, requireShopAccess } from "@/lib/auth";
import { canHandleDeliveries, canManageOrders } from "@/lib/authorization";
import { getOrderDetail } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
    orderNumber: string;
  }>;
};

type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
type AssignableStaffMember = OrderDetail["shop"]["staffMembers"][number];
type OrderItem = OrderDetail["items"][number];
type CustomerPhoto = OrderDetail["customer"]["photos"][number];

function formatMoney(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents ?? 0) / 100);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function PhotoCard({
  photo,
}: {
  photo: {
    id: string;
    caption: string | null;
    kind: string;
    takenAt: Date;
    imageUrl: string;
  };
}) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-stone-200 bg-gradient-to-br from-rose-200 via-rose-100 to-stone-50">
      <div className="aspect-[4/3] bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.imageUrl} alt={photo.caption ?? "Floral order photo"} className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-stone-950">{photo.caption ?? "Photo history"}</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          {photo.kind.replaceAll("_", " ").toLowerCase()} • {formatDateTime(photo.takenAt)}
        </p>
        <a
          href={photo.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-rose-800 underline decoration-rose-300 underline-offset-4"
        >
          Open full image
        </a>
      </div>
    </article>
  );
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { slug, orderNumber } = await params;
  const access = await requireShopAccess(slug);
  const order = await getOrderDetail(slug, orderNumber);

  if (!order) {
    notFound();
  }

  const checkedItemIds = new Set(order.delivery?.checks.map((check) => check.orderItemId) ?? []);
  const missingItems = order.items.filter((item) => item.requiresScan && !checkedItemIds.has(item.id));
  const membership = getMembershipForShop(access, slug);
  const role = membership?.role;
  const showOrderOps = canManageOrders(access.user.platformRole, role);
  const showDeliveryOps = canHandleDeliveries(access.user.platformRole, role);
  const assignableStaff = order.shop.staffMembers.filter((staffMember: AssignableStaffMember) =>
    ["OWNER", "MANAGER", "DESIGNER"].includes(staffMember.role),
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbf6ef_0%,#f1e6d6_100%)] px-5 py-6 text-stone-900 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200">
            Home
          </Link>
          <span>/</span>
          <span>{order.shop.name}</span>
          <span>/</span>
          <Link
            href={`/shops/${slug}/customers/${order.customer.id}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200"
          >
            {order.customer.name}
          </Link>
          <span>/</span>
          <span>Order #{order.orderNumber}</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Shop-Scoped Order Detail</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">
                {order.occasion} for {order.customer.name}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                {order.notes ?? order.internalSummary ?? "No special notes on this order."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-stone-700">
                  Signed in as {access.user.name}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-stone-700">
                  Role {access.user.platformRole === "PLATFORM_ADMIN" ? "platform admin" : role?.toLowerCase() ?? "member"}
                </span>
              </div>
            </div>
            <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 px-5 py-4 text-sm text-stone-700">
              <p>
                <strong className="text-stone-950">Order #{order.orderNumber}</strong>
              </p>
              <p className="mt-1">Due {formatDateTime(order.dueAt)}</p>
              <p className="mt-1">Total {formatMoney(order.totalAmount)}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Order Controls</p>
                <h2 className="font-serif text-3xl text-stone-950">Editable workflow</h2>
              </div>
              {showOrderOps ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <form action={updateOrderStatus} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                    <input type="hidden" name="shopSlug" value={slug} />
                    <input type="hidden" name="orderNumber" value={order.orderNumber} />
                    <p className="text-sm font-semibold text-stone-950">Update order status</p>
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="DESIGNING">Designing</option>
                      <option value="READY_FOR_PICKUP">Ready for pickup</option>
                      <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                      Save Status
                    </button>
                  </form>

                  <form action={assignOrderDesigner} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                    <input type="hidden" name="shopSlug" value={slug} />
                    <input type="hidden" name="orderNumber" value={order.orderNumber} />
                    <p className="text-sm font-semibold text-stone-950">Assign designer</p>
                    <select
                      name="designerId"
                      defaultValue={order.assignedDesigner?.id ?? assignableStaff[0]?.id}
                      className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                    >
                      {assignableStaff.map((staffMember: AssignableStaffMember) => (
                        <option key={staffMember.id} value={staffMember.id}>
                          {staffMember.displayName} ({staffMember.role.toLowerCase()})
                        </option>
                      ))}
                    </select>
                    <button className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                      Assign Designer
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  This role cannot edit order status or assignment.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Components</p>
                <h2 className="font-serif text-3xl text-stone-950">What must go out the door</h2>
              </div>
              {showOrderOps ? (
                <div className="mt-4 grid gap-3">
                  {order.items.map((item: OrderItem) => {
                    const checked = checkedItemIds.has(item.id);

                    return (
                      <article
                        key={item.id}
                        className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-stone-950">{item.description}</p>
                            <p className="mt-1 text-sm text-stone-600">
                              Qty {item.quantity} • {formatMoney(item.unitPrice)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              checked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {item.requiresScan ? (checked ? "Scanned" : "Scan required") : "No scan required"}
                          </span>
                        </div>
                        {showDeliveryOps && item.requiresScan && !checked ? (
                          <form action={markDeliveryItemChecked} className="mt-3">
                            <input type="hidden" name="shopSlug" value={slug} />
                            <input type="hidden" name="orderNumber" value={order.orderNumber} />
                            <input type="hidden" name="orderItemId" value={item.id} />
                            <button className="rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-white">
                              Mark Checked
                            </button>
                          </form>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  This role does not have full order component management access.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Customer Memory</p>
                <h2 className="font-serif text-3xl text-stone-950">Arrangement and delivery history</h2>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {order.customer.photos.map((photo: CustomerPhoto) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Assignment</p>
                <h2 className="font-serif text-3xl text-stone-950">Execution snapshot</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm text-stone-700">
                <p>
                  <strong className="text-stone-950">Designer:</strong>{" "}
                  {order.assignedDesigner?.displayName ?? "Unassigned"}
                </p>
                <p>
                  <strong className="text-stone-950">Customer:</strong> {order.customer.name}
                </p>
                <p>
                  <strong className="text-stone-950">Card:</strong> {order.cardMessage ?? "No card message"}
                </p>
                <p>
                  <strong className="text-stone-950">Delivery address:</strong>{" "}
                  {order.deliveryAddress
                    ? `${order.deliveryAddress.line1}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`
                    : "Not set"}
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Customer Notes</p>
                <h2 className="font-serif text-3xl text-stone-950">Memory and preferences</h2>
              </div>
              {showOrderOps ? (
                <form action={updateCustomerNotes} className="mt-4">
                  <input type="hidden" name="shopSlug" value={slug} />
                  <input type="hidden" name="orderNumber" value={order.orderNumber} />
                  <input type="hidden" name="customerId" value={order.customer.id} />
                  <textarea
                    name="notes"
                    defaultValue={order.customer.notes ?? ""}
                    rows={5}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                  <button className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                    Save Customer Notes
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  This role cannot edit customer notes.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-amber-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-amber-700">Delivery Accountability</p>
                <h2 className="font-serif text-3xl text-amber-950">Driver load check</h2>
              </div>
              {showDeliveryOps ? (
                <div className="mt-4 space-y-3 text-sm text-amber-950">
                  <p>
                    <strong>Driver:</strong> {order.delivery?.driver?.displayName ?? "Not assigned"}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.delivery?.status.replaceAll("_", " ").toLowerCase() ?? "No delivery record"}
                  </p>
                  <p>
                    <strong>Handoff:</strong>{" "}
                    {order.delivery?.handoffType?.replaceAll("_", " ").toLowerCase() ?? "Not selected"}
                  </p>
                  {missingItems.length > 0 ? (
                    <div className="rounded-[20px] border border-amber-300 bg-white/70 p-4">
                      <p className="font-semibold">Missing scans:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {missingItems.map((item: OrderItem) => (
                          <li key={item.id}>{item.description}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      All required delivery components have been scanned.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-amber-300 bg-white/70 p-4 text-sm text-amber-950">
                  Delivery accountability details are limited to delivery-capable roles.
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Order Notes</p>
              <h2 className="font-serif text-3xl text-stone-950">Design and internal guidance</h2>
            </div>
            {showOrderOps ? (
              <form action={updateOrderNotes} className="mt-4 grid gap-4">
                <input type="hidden" name="shopSlug" value={slug} />
                <input type="hidden" name="orderNumber" value={order.orderNumber} />
                <input type="hidden" name="orderId" value={order.id} />
                <label className="grid gap-2 text-sm text-stone-700">
                  Customer-facing notes
                  <textarea
                    name="notes"
                    defaultValue={order.notes ?? ""}
                    rows={4}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Internal summary
                  <textarea
                    name="internalSummary"
                    defaultValue={order.internalSummary ?? ""}
                    rows={4}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <button className="w-fit rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                  Save Order Notes
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                This role cannot edit order notes.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Photo Attachments</p>
              <h2 className="font-serif text-3xl text-stone-950">Add arrangement memory</h2>
            </div>
            {showOrderOps ? (
              <form action={addOrderPhoto} className="mt-4 grid gap-4">
                <input type="hidden" name="shopSlug" value={slug} />
                <input type="hidden" name="orderNumber" value={order.orderNumber} />
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="customerId" value={order.customer.id} />
                <label className="grid gap-2 text-sm text-stone-700">
                  Upload image
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Or paste image URL
                  <input
                    name="imageUrl"
                    placeholder="https://..."
                    className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Caption
                  <input
                    name="caption"
                    placeholder="Soft romantic arrangement after substitutions"
                    className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Photo type
                  <select
                    name="kind"
                    defaultValue="ARRANGEMENT"
                    className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  >
                    <option value="ARRANGEMENT">Arrangement</option>
                    <option value="COMPONENT_PROOF">Component proof</option>
                    <option value="DELIVERY_PROOF">Delivery proof</option>
                  </select>
                </label>
                <button className="w-fit rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                  Attach Photo
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                This role cannot attach order photos.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
