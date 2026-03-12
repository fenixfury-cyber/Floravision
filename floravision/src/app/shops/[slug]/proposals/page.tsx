import Link from "next/link";
import { notFound } from "next/navigation";
import { createProposal } from "@/app/actions";
import { getMembershipForShop, requireShopAccess } from "@/lib/auth";
import { canManageShop } from "@/lib/authorization";
import { getShopProposals } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ShopProposalsData = NonNullable<Awaited<ReturnType<typeof getShopProposals>>>;
type ProposalCustomer = ShopProposalsData["shop"]["customers"][number];
type Proposal = ShopProposalsData["shop"]["proposals"][number];
type ProposalLine = Proposal["lines"][number];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ShopProposalsPage({ params }: PageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  const membership = getMembershipForShop(access, slug);

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    notFound();
  }

  const data = await getShopProposals(slug);

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
          <span>Proposals</span>
        </div>

        <section className="mt-5 rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(90,67,49,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Proposals & Events</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">{data.shop.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                Create polished florist proposals for weddings, funerals, parties, and events with itemized pricing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.totalProposals} recent proposals
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.draftProposals} drafts
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                {data.summary.approvedProposals} approved
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">New Proposal</p>
              <h2 className="font-serif text-3xl text-stone-950">Create event quote</h2>
            </div>
            <form action={createProposal} className="mt-4 grid gap-4">
              <input type="hidden" name="shopSlug" value={slug} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-stone-700">
                  Proposal number
                  <input
                    name="proposalNumber"
                    placeholder="PROP-2026-001"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Type
                  <select name="type" defaultValue="WEDDING" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <option value="WEDDING">Wedding</option>
                    <option value="FUNERAL">Funeral</option>
                    <option value="PARTY">Party</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm text-stone-700">
                Title
                <input
                  name="title"
                  placeholder="Whitmore Wedding Floral Proposal"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                Customer
                <select name="customerId" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <option value="">No linked customer</option>
                  {data.shop.customers.map((customer: ProposalCustomer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-stone-700">
                  Event date
                  <input
                    name="eventDate"
                    type="datetime-local"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Venue
                  <input
                    name="venue"
                    placeholder="The Grand Conservatory"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-stone-700">
                  Contact name
                  <input
                    name="contactName"
                    placeholder="Bride, family contact, planner"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  Contact email
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="contact@example.com"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-stone-700">
                Notes
                <input
                  name="notes"
                  placeholder="Elegant garden palette, soft blush and ivory"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                />
              </label>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-semibold text-stone-950">Initial line item</p>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm text-stone-700 md:col-span-2">
                    Description
                    <input
                      name="lineDescription"
                      placeholder="Bridal bouquet, casket spray, centerpiece package"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-stone-700">
                    Quantity
                    <input
                      name="lineQuantity"
                      type="number"
                      min="1"
                      step="1"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-stone-700 md:col-span-3">
                    Unit price (cents)
                    <input
                      name="lineUnitPrice"
                      type="number"
                      min="0"
                      step="1"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                    />
                  </label>
                </div>
              </div>
              <button className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                Create Proposal
              </button>
            </form>
          </section>

          <section className="grid gap-4">
            {data.shop.proposals.map((proposal: Proposal) => {
              const total = proposal.lines.reduce(
                (sum: number, line: ProposalLine) => sum + line.unitPrice * line.quantity,
                0,
              );

              return (
                <article
                  key={proposal.id}
                  className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">
                        {proposal.type.toLowerCase()} • {proposal.status.toLowerCase()}
                      </p>
                      <h2 className="mt-1 font-serif text-3xl text-stone-950">{proposal.title}</h2>
                      <p className="mt-2 text-sm text-stone-600">
                        {proposal.proposalNumber}
                        {proposal.customer ? ` • ${proposal.customer.name}` : ""}
                        {proposal.venue ? ` • ${proposal.venue}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-stone-700">{proposal.notes ?? "No notes."}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-stone-950">{formatMoney(total)}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {proposal.eventDate ? proposal.eventDate.toLocaleString() : "No event date"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {proposal.lines.map((line: ProposalLine) => (
                      <div key={line.id} className="rounded-[20px] border border-stone-200 bg-stone-50/80 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-stone-950">{line.description}</p>
                            <p className="mt-1 text-sm text-stone-600">
                              Qty {line.quantity} • {formatMoney(line.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-stone-950">
                            {formatMoney(line.unitPrice * line.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
            {data.shop.proposals.length === 0 ? (
              <div className="rounded-[28px] border border-stone-200/70 bg-white/80 p-6 text-sm text-stone-600 shadow-[0_18px_45px_rgba(90,67,49,0.08)]">
                No proposals yet.
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
