import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SiteFooter, SiteNav, apiPost } from "@/components/hkc/chrome";
import { Field, Notice, Panel, inputClass } from "@/components/hkc/ui";

export const Route = createFileRoute("/signin")({
  component: SignIn,
  head: () => ({ meta: [{ title: "Sign in to HomeKey Clean" }] }),
});

function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"client" | "cleaner">("client");
  const [form, setForm] = useState({ email: "", name: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiPost<{ role: string }>("/api/auth", { action: mode, ...form, role });
      window.location.href = res.role === "cleaner" ? "/work" : "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto grid min-h-[70dvh] max-w-[1180px] gap-14 px-5 py-20 lg:grid-cols-[1fr_460px] lg:items-start">
        <div>
          <h1 className="max-w-[15ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
            {mode === "signin" ? "Welcome back" : "Make an account"}
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-hk-muted">
            One account holds your addresses, your requests, and the cleaners you want again.
          </p>
          <div className="mt-10 rounded-hk-lg border border-hk-line bg-hk-paper p-6">
            <h2 className="font-hk-display text-base font-medium tracking-tight text-hk-ink">
              Want to look around as a cleaner first?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-hk-muted">
              Sign in as marisol@homekeyclean.com, danielle@homekeyclean.com, aurora@homekeyclean.com,
              kenji@homekeyclean.com, diego@homekeyclean.com, or irena@homekeyclean.com with the
              password demo1234. Each one sets a different rate and sits on a different plan.
            </p>
          </div>
        </div>

        <Panel>
          <div className="mb-6 flex gap-1 rounded-full border border-hk-line p-1">
            {(["signin", "signup"] as const).map((option) => (
              <button className={`flex-1 rounded-full py-2 font-hk-display text-sm font-medium transition-colors ${mode === option ? "bg-hk-ink text-hk-ground" : "text-hk-muted hover:text-hk-ink"}`}
                key={option} onClick={() => { setMode(option); setError(""); }} type="button">
                {option === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" ? (
              <>
                <Field label="Full name">
                  <input autoComplete="name" className={inputClass} onChange={set("name")}
                    required value={form.name} />
                </Field>
                <Field label="Phone" hint="So your cleaner can reach you on the day.">
                  <input autoComplete="tel" className={inputClass} onChange={set("phone")}
                    type="tel" value={form.phone} />
                </Field>
                <fieldset>
                  <legend className="mb-1.5 font-hk-display text-sm font-medium text-hk-ink">I am here to</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["client", "cleaner"] as const).map((option) => (
                      <button className={`rounded-hk border px-3 py-2.5 text-sm transition-colors ${role === option ? "border-hk-accent bg-hk-accent-wash text-hk-accent-deep" : "border-hk-line text-hk-muted hover:border-hk-ink"}`}
                        key={option} onClick={() => setRole(option)} type="button">
                        {option === "client" ? "Book cleans" : "Take jobs"}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : null}
            <Field label="Email">
              <input autoComplete="email" className={inputClass} onChange={set("email")} required
                type="email" value={form.email} />
            </Field>
            <Field label="Password" hint={mode === "signup" ? "At least eight characters." : undefined}>
              <input autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputClass} minLength={8} onChange={set("password")} required
                type="password" value={form.password} />
            </Field>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <button className="w-full rounded-full bg-hk-accent px-6 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors duration-200 hover:bg-hk-accent-deep active:scale-[0.99] disabled:opacity-60"
              disabled={busy} type="submit">
              {busy ? "One moment" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </Panel>
      </main>
      <SiteFooter />
    </>
  );
}
