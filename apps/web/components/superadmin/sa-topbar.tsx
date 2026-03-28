"use client";

import { ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
};

export default function SATopBar({ title, subtitle }: Props) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-violet-400 bg-violet-600/10 px-3 py-1.5 rounded-full border border-violet-600/30">
        <ShieldCheck className="h-3.5 w-3.5" />
        Super Admin
      </div>
    </header>
  );
}
