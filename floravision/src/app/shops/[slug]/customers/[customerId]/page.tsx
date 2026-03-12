import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { canManageOrders } from "@/lib/authorization";
import { getCustomerDetail } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
    customerId: string;
  }>;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
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
        <img
          src={photo.imageUrl}
          alt={photo.caption ?? "Customer floral history photo"}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-stone-950">{photo.caption ?? "Photo memory"}</p>
        <p className="mt-2 text-sm text-stone-700">
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

export default async function CustomerDetailPage({ params }: PageProps) {
  const { slug, customerId } = await params;
  const access = await requireShopAccess(slug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === slug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const customer = await getCustomerDetail(slug, customerId);

  if (!customer) {
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
            href={`/shops/${customer.shop.slug}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200"
          >
            {customer.shop.name}
          </Link>
          <span>/</span>
          <Link
            href={`/shops/${customer.shop.slug}/customers`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-rose-200"
          >
            Customers
          </Link>
          <span>/</span>
          <span>{customer.name}</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Customer Detail</p>
          <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{customer.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
            {customer.notes ?? customer.reminders ?? "No notes recorded yet for this customer."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-700">
            <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2">
              {customer.email ?? "No email"}
            </span>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2">
              {customer.phone ?? "No phone"}
            </span>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Addresses</p>
                <h2 className="font-serif text-3xl text-stone-950">Delivery memory</h2>
              </div>
              <div className="mt-4 space-y-3">
                {customer.addresses.map((address) => (
                  <article key={address.id} className="rounded-[18px] border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-sm font-semibold text-stone-950">{address.label ?? "Address"}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="mt-2 text-sm text-stone-700">{address.deliveryNotes ?? "No delivery notes."}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Photo Memory</p>
                <h2 className="font-serif text-3xl text-stone-950">Arrangement history</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {customer.photos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Order History</p>
              <h2 className="font-serif text-3xl text-stone-950">Past transactions</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {customer.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/shops/${slug}/orders/${order.orderNumber}`}
                  className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-950">
                        #{order.orderNumber} • {order.occasion}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {order.assignedDesigner?.displayName ?? "Unassigned"} • {formatDateTime(order.dueAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700"
                          >
                            {item.description}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-950">{formatMoney(order.totalAmount)}</p>
                      <p className="mt-1 text-sm text-stone-600">{order.status.replaceAll("_", " ").toLowerCase()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
