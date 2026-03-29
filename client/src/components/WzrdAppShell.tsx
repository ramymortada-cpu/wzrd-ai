import type { ReactNode } from "react";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wzrdnoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wzrdnoise)'/%3E%3C/svg%3E")`;

/** Ambient shell for WZZRD funnel routes (orbs + noise). Dashboard stays unchanged. */
export default function WzrdAppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#050505]"
      data-wzrd-premium-shell="true"
    >
      <div
        className="wzrd-glow-orb -left-[200px] -top-[200px] h-[600px] w-[600px] bg-brand-cyan/10"
        aria-hidden
      />
      <div
        className="wzrd-glow-orb -bottom-[100px] -right-[100px] h-[500px] w-[500px] bg-brand-violet/12"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.028]"
        style={{ backgroundImage: NOISE_SVG }}
        aria-hidden
      />
      <div className="relative z-[2] min-h-screen">{children}</div>
    </div>
  );
}
