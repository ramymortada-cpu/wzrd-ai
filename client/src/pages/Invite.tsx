import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toErrorString } from "@/lib/errorUtils";

export default function Invite() {
  const [loc, navigate] = useLocation();

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, [loc]);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("This invite link is invalid or has expired.");
  }, [token]);

  const acceptInvite = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!token) {
      setError("Invalid invite link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/trpc/workspaces.acceptInvite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { token, name: name.trim() } }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json ?? data?.result?.data;

      if (result?.success) {
        setDone(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const trpcErr = data?.error ?? (Array.isArray(data) ? data[0]?.error : undefined);
        setError(
          toErrorString(
            trpcErr,
            typeof result?.message === "string"
              ? result.message
              : "Failed to accept invite. The link may have expired.",
          ),
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border-[0.5px] border-zinc-200/80 bg-zinc-50/80 px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-500 outline-none backdrop-blur-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500";

  return (
    <div className="wzrd-auth-mesh relative grid min-h-screen text-white md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,440px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex lg:p-12">
        <a href="/app/tools" className="flex w-fit items-baseline gap-1 text-lg font-bold transition hover:text-white">
          <span className="font-display tracking-tight">WZZRD</span>
          <span className="wzrd-badge-cyan text-[10px]">AI</span>
        </a>
        <div>
          <p className="wzrd-badge-violet mb-4 w-fit text-[10px]">You&apos;re invited</p>
          <h1 className="max-w-md font-display text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            <span className="wzrd-gradient-text">Your workspace</span> is waiting for you.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            You&apos;ve been invited to collaborate. Enter your name to get started — it takes less than 10 seconds.
          </p>
        </div>
        <p className="text-xs text-white/40">WZZRD AI</p>
      </aside>

      <div className="relative flex min-h-screen flex-col justify-center px-4 pb-16 pt-24 md:px-8">
        <a
          href="/app/tools"
          className="absolute left-6 top-6 z-10 flex items-baseline gap-1 text-lg font-bold text-white/90 drop-shadow-md transition hover:text-white md:hidden"
        >
          <span className="font-display">WZZRD</span>
          <span className="wzrd-badge-cyan text-[10px]">AI</span>
        </a>

        <div className="mx-auto w-full max-w-md">
          <div className="wzrd-glass wzrd-auth-card rounded-3xl p-8 sm:p-10">
            {done ? (
              <div className="text-center">
                <div className="mb-4 text-5xl">🎉</div>
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">You&apos;re in!</h2>
                <p className="text-sm text-white/70">
                  Account created! Please log in with your email to access your workspace.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">Accept Invite</h2>
                <p className="mb-6 text-sm leading-relaxed text-white/70">
                  Enter your name to join the workspace. That&apos;s all we need.
                </p>

                {error ? (
                  <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && acceptInvite()}
                    placeholder="e.g. Sarah Ahmed"
                    autoFocus
                    className={inputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={acceptInvite}
                  disabled={loading || !name.trim() || !token}
                  className="wzrd-shimmer-btn w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? "Joining…" : "Join Workspace →"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
