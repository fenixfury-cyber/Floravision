import { login } from "@/app/actions";

export function LoginForm() {
  return (
    <form
      action={login}
      className="rounded-[28px] border border-stone-200/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(90,67,49,0.08)]"
    >
      <div className="border-b border-stone-200 pb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">Sign In</p>
        <h2 className="font-serif text-3xl text-stone-950">Access the platform</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Use a platform admin or shop owner account to enter FloraVision.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm text-stone-700">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-rose-300"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-700">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-rose-300"
          />
        </label>
      </div>

      <button className="mt-5 rounded-full bg-gradient-to-br from-rose-700 to-rose-950 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(96,46,55,0.22)]">
        Sign In
      </button>
    </form>
  );
}
