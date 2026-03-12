import Link from "next/link";
import { logout } from "@/app/actions";
import { LoginForm } from "@/components/login-form";
import { ShopOnboardingForm } from "@/components/shop-onboarding-form";
import { getCurrentSession } from "@/lib/auth";
import { type DashboardOrderStatus } from "@/lib/dashboard-data";
import { getHomePageData, listAccessibleShops } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

function statusClassName(status: DashboardOrderStatus) {
  switch (status) {
    case "Ready for pickup":
      return "bg-emerald-100 text-emerald-800";
    case "Out for delivery":
      return "bg-amber-100 text-amber-900";
    case "Awaiting assignment":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-stone-200 text-stone-800";
  }
}

export default async function Home() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(199,154,90,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(140,62,79,0.18),transparent_28%),linear-gradient(180deg,#fbf6ef_0%,#f3e8d9_100%)] px-5 py-8 text-stone-900 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-stone-200/70 bg-white/75 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.1)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">FloraVision</p>
            <h1 className="mt-2 font-serif text-5xl leading-tight text-stone-950">
              Multi-tenant florist operations software.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Sign in as a platform admin or shop owner to enter the tenant-aware workspace. This build already supports
              shop onboarding, tenant routing, seeded data, and shop-scoped order detail views.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-[24px] border border-stone-200/70 bg-stone-50/80 p-5">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Platform Admin</p>
                <p className="mt-2 text-sm text-stone-700">admin@floravision.local</p>
                <p className="mt-1 text-sm text-stone-700">admin1234</p>
              </article>
              <article className="rounded-[24px] border border-stone-200/70 bg-stone-50/80 p-5">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Shop Owner</p>
                <p className="mt-2 text-sm text-stone-700">tasha@petalsandpost.com</p>
                <p className="mt-1 text-sm text-stone-700">petals123</p>
              </article>
              <article className="rounded-[24px] border border-stone-200/70 bg-stone-50/80 p-5">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Seeded Tenant</p>
                <p className="mt-2 text-sm text-stone-700">petals-and-post</p>
                <p className="mt-1 text-sm text-stone-700">Workspace ready</p>
              </article>
            </div>
          </section>

          <LoginForm />
        </div>
      </main>
    );
  }

  const visibleShops = await listAccessibleShops(session.user.id, session.user.platformRole);
  const activeShopSlug =
    session.defaultMembership?.shop.slug ??
    visibleShops[0]?.slug;
  const data = activeShopSlug ? await getHomePageData(activeShopSlug) : await getHomePageData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(199,154,90,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(140,62,79,0.18),transparent_28%),linear-gradient(180deg,#fbf6ef_0%,#f3e8d9_100%)] text-stone-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200/70 bg-white/60 p-5 backdrop-blur lg:border-r lg:border-b-0 lg:p-7">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-700 to-rose-950 text-sm font-semibold tracking-[0.24em] text-white shadow-[0_18px_40px_rgba(96,46,55,0.24)]">
              FV
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Floral Operating System</p>
              <h1 className="font-serif text-3xl text-stone-950">FloraVision</h1>
            </div>
          </div>

          <section className="mb-6 rounded-[24px] border border-stone-200/80 bg-white/80 p-4 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Signed In</p>
            <h2 className="mt-2 font-serif text-2xl text-stone-950">{session.user.name}</h2>
            <p className="mt-2 text-sm text-stone-600">{session.user.email}</p>
            <p className="mt-2 text-sm text-stone-700">
              Role: <span className="font-medium">{session.user.platformRole.toLowerCase()}</span>
            </p>
          </section>

          <section className="mb-6 rounded-[24px] border border-stone-200/80 bg-white/80 p-4 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Search Everything</p>
            <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm text-stone-500">
              Ctrl K
              <span className="ml-3 text-stone-700">Try: {data.quickSearch[0]}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.quickSearch.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-stone-200/80 bg-white/80 p-4 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Quick Signals</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li>
                <strong className="mr-2 text-stone-950">{visibleShops.length}</strong>
                accessible shops
              </li>
              <li>
                <strong className="mr-2 text-stone-950">{data.orders.length}</strong>
                sample tracked orders
              </li>
              <li>
                <strong className="mr-2 text-stone-950">{data.openTimeEntries}</strong>
                open clock-ins for seeded tenant
              </li>
              <li>
                <strong className="mr-2 text-stone-950">{data.inventoryWatch}</strong>
                {data.inventoryNote}
              </li>
            </ul>
          </section>
        </aside>

        <div className="p-5 lg:p-8">
          <section className="rounded-[32px] border border-stone-200/70 bg-white/65 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.1)] backdrop-blur">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Platform Landing</p>
                <h2 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                  Multi-tenant florist SaaS with authenticated tenant access.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  Platform admins can create new florist tenants. Shop owners only see and enter the shops they belong to.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={logout}>
                  <button className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700">
                    Sign Out
                  </button>
                </form>
                {data.mode === "database" ? (
                  <Link
                    href={`/shops/${activeShopSlug ?? data.shopSlug}`}
                    className="rounded-full bg-gradient-to-br from-rose-700 to-rose-950 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(96,46,55,0.22)]"
                  >
                    Open Active Shop
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <article className="rounded-[24px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Accessible Shops</p>
              <h3 className="mt-3 text-3xl font-semibold text-stone-950">{visibleShops.length}</h3>
              <p className="mt-2 text-sm text-stone-600">Scoped from session membership.</p>
            </article>
            <article className="rounded-[24px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Active Shop</p>
              <h3 className="mt-3 text-3xl font-semibold text-stone-950">{data.shopName}</h3>
              <p className="mt-2 text-sm text-stone-600">Derived from the signed-in user’s accessible tenant scope.</p>
            </article>
            <article className="rounded-[24px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Shop Routing</p>
              <h3 className="mt-3 text-3xl font-semibold text-stone-950">Membership Based</h3>
              <p className="mt-2 text-sm text-stone-600">Tenant access is checked against the session.</p>
            </article>
            <article className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-rose-700">Auth Layer</p>
              <h3 className="mt-3 text-3xl font-semibold text-rose-950">Active</h3>
              <p className="mt-2 text-sm text-rose-900/75">Passwords, sessions, and tenant scoping are live.</p>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-6">
              {session.user.platformRole === "PLATFORM_ADMIN" ? <ShopOnboardingForm /> : null}

              <section className="rounded-[28px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Accessible Shops</p>
                  <h3 className="font-serif text-3xl text-stone-950">Tenant directory</h3>
                </div>

                <div className="mt-4 grid gap-3">
                  {visibleShops.map((shop) => (
                    <Link
                      key={shop.id}
                      href={`/shops/${shop.slug}`}
                      className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-stone-950">{shop.name}</p>
                          <p className="mt-1 text-sm text-stone-600">{shop.slug}</p>
                        </div>
                        <p className="text-sm text-stone-700">
                          {shop._count.orders} orders • {shop._count.staffMembers} staff
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-6">
              <section className="rounded-[28px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Active Tenant Orders</p>
                  <h3 className="font-serif text-3xl text-stone-950">Workspace snapshot</h3>
                </div>

                <div className="mt-4 space-y-4">
                  {data.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={order.href}
                      className="block rounded-[22px] border border-stone-200 bg-stone-50/70 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold text-stone-950">#{order.id}</h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-stone-800">
                        {order.occasion} for {order.customer}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">{order.note}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-stone-200/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Customer Memory</p>
                  <h3 className="font-serif text-3xl text-stone-950">{data.customerName}</h3>
                  <p className="mt-2 text-sm text-stone-600">{data.customerSummary}</p>
                </div>

                <div className="mt-4 grid gap-3">
                  {data.customerPhotos.map((photo) => (
                    <article
                      key={photo.title}
                      className="rounded-[20px] border border-stone-200 bg-gradient-to-br from-rose-200 via-rose-100 to-stone-50 p-4"
                    >
                      <p className="text-sm font-semibold text-stone-950">{photo.title}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">{photo.detail}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
