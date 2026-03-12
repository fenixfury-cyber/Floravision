import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { canManageOrders } from "@/lib/authorization";
import { getShopCustomers } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    query?: string;
  }>;
};

export default async function ShopCustomersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const access = await requireShopAccess(slug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === slug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopCustomers(slug, filters.query || undefined);

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
          <span>Customers</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Customer Lookup</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Search repeat buyers, find order history, and reopen customer memory during intake.
              </p>
            </div>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
              {data.customers.length} matching customers
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
          <form className="flex flex-col gap-4 md:flex-row md:items-end">
            <label className="grid flex-1 gap-2 text-sm text-stone-700">
              Search customers
              <input
                name="query"
                defaultValue={filters.query ?? ""}
                placeholder="Name, email, phone, note, reminder"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              />
            </label>
            <div className="flex gap-3">
              <button className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                Search
              </button>
              <Link
                href={`/shops/${slug}/customers`}
                className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-4">
          {data.customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/shops/${slug}/customers/${customer.id}`}
              className="rounded-[24px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)] transition hover:-translate-y-0.5 hover:border-rose-200"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">{customer.name}</h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {customer.email ?? "No email"} • {customer.phone ?? "No phone"}
                  </p>
                  <p className="mt-2 text-sm text-stone-700">
                    {customer.notes ?? customer.reminders ?? "No memory notes yet."}
                  </p>
                </div>
                <div className="text-right text-sm text-stone-600">
                  <p>{customer._count.orders} orders</p>
                  <p className="mt-1">{customer._count.photos} photos</p>
                </div>
              </div>
            </Link>
          ))}
          {data.customers.length === 0 ? (
            <div className="rounded-[24px] border border-stone-200/70 bg-white/80 p-6 text-sm text-stone-600 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              No customers matched the current search.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
