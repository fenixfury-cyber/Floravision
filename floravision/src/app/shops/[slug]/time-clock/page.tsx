import Link from "next/link";
import { notFound } from "next/navigation";
import {
  clockInStaff,
  clockOutStaff,
  resolveTimeEntryOverride,
} from "@/app/actions";
import { getMembershipForShop, requireShopAccess } from "@/lib/auth";
import { canManageShop } from "@/lib/authorization";
import { getShopTimeClock } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ShopTimeClockData = NonNullable<Awaited<ReturnType<typeof getShopTimeClock>>>;
type TimeClockStaffMember = ShopTimeClockData["shop"]["staffMembers"][number];
type OverrideEntry = ShopTimeClockData["openOverrides"][number];
type ActiveEntry = ShopTimeClockData["activeEntries"][number];
type TodayEntry = ShopTimeClockData["todayEntries"][number];

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function ShopTimeClockPage({ params }: PageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  const membership = getMembershipForShop(access, slug);

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopTimeClock(slug);

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
          <span>Time Clock</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Time Clock</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Track active shifts, close missed punches, and keep attendance cleanup out of the back office.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.activeEntries.length} active shifts
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.openOverrides.length} exceptions
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Clock In</p>
                <h2 className="font-serif text-3xl text-stone-950">Start a shift</h2>
              </div>
              <form action={clockInStaff} className="mt-4 grid gap-4">
                <input type="hidden" name="shopSlug" value={slug} />
                <label className="grid gap-2 text-sm text-stone-700">
                  Staff member
                  <select
                    name="staffMemberId"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  >
                    {data.shop.staffMembers.map((staffMember: TimeClockStaffMember) => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.displayName} ({staffMember.role.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </label>
                <button className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                  Clock In
                </button>
              </form>
            </section>

            <section className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-amber-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-amber-700">Exceptions</p>
                <h2 className="font-serif text-3xl text-amber-950">Missed punch cleanup</h2>
              </div>
              <div className="mt-4 grid gap-4">
                {data.openOverrides.length === 0 ? (
                  <div className="rounded-[20px] border border-amber-300 bg-white/70 p-4 text-sm text-amber-950">
                    No active override exceptions right now.
                  </div>
                ) : (
                  data.openOverrides.map((entry: OverrideEntry) => (
                    <form
                      key={entry.id}
                      action={resolveTimeEntryOverride}
                      className="rounded-[20px] border border-amber-300 bg-white/70 p-4"
                    >
                      <input type="hidden" name="shopSlug" value={slug} />
                      <input type="hidden" name="timeEntryId" value={entry.id} />
                      <p className="text-sm font-semibold text-amber-950">{entry.staffMember.displayName}</p>
                      <p className="mt-1 text-sm text-amber-900">
                        Started {formatDateTime(entry.startedAt)}
                      </p>
                      <label className="mt-3 grid gap-2 text-sm text-amber-950">
                        Correct clock-out time
                        <input
                          name="endedAt"
                          type="datetime-local"
                          className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700"
                        />
                      </label>
                      <label className="mt-3 grid gap-2 text-sm text-amber-950">
                        Override note
                        <input
                          name="overrideReason"
                          defaultValue={entry.overrideReason ?? "Manager override"}
                          className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-stone-700"
                        />
                      </label>
                      <button className="mt-3 rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-white">
                        Resolve Exception
                      </button>
                    </form>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Active Shifts</p>
                <h2 className="font-serif text-3xl text-stone-950">Who is clocked in now</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {data.activeEntries.length === 0 ? (
                  <div className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                    No active shifts at the moment.
                  </div>
                ) : (
                  data.activeEntries.map((entry: ActiveEntry) => (
                    <article key={entry.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">{entry.staffMember.displayName}</p>
                          <p className="mt-1 text-sm text-stone-600">Clocked in {formatDateTime(entry.startedAt)}</p>
                        </div>
                        <form action={clockOutStaff}>
                          <input type="hidden" name="shopSlug" value={slug} />
                          <input type="hidden" name="timeEntryId" value={entry.id} />
                          <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                            Clock Out
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
              <div className="border-b border-stone-200 pb-4">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Today</p>
                <h2 className="font-serif text-3xl text-stone-950">Attendance log</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {data.todayEntries.map((entry: TodayEntry) => (
                  <article key={entry.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">{entry.staffMember.displayName}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          In: {formatDateTime(entry.startedAt)}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          Out: {entry.endedAt ? formatDateTime(entry.endedAt) : "Still active"}
                        </p>
                      </div>
                      {entry.overrideReason ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
                          {entry.overrideReason}
                        </span>
                      ) : null}
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
