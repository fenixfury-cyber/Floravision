import { createShop } from "@/app/actions";

const timezoneOptions = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
];

export function ShopOnboardingForm() {
  return (
    <form
      action={createShop}
      className="rounded-[28px] border border-stone-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]"
    >
      <div className="border-b border-stone-200 pb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">New Shop</p>
        <h2 className="font-serif text-3xl text-stone-950">Create a florist tenant</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          This is the first onboarding pass: enough to create an isolated shop and give it an owner record.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-stone-700">
          Shop name
          <input
            name="name"
            required
            placeholder="Petals & Post"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Shop email
          <input
            name="email"
            type="email"
            placeholder="hello@shop.com"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Shop phone
          <input
            name="phone"
            placeholder="(555) 000-0000"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Timezone
          <select
            name="timezone"
            defaultValue="America/Chicago"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Owner name
          <input
            name="ownerName"
            required
            placeholder="Tasha Carr"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Owner email
          <input
            name="ownerEmail"
            type="email"
            placeholder="owner@shop.com"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none ring-0 focus:border-rose-300"
          />
        </label>
      </div>

      <button className="mt-5 rounded-full bg-gradient-to-br from-rose-700 to-rose-950 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(96,46,55,0.22)]">
        Create Shop
      </button>
    </form>
  );
}
