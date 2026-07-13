import { cn } from "@/lib/utils";

/* ── Base primitive ─────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md animate-pulse",
        "bg-[color-mix(in_oklab,var(--color-elevated)_80%,var(--color-border)_20%)]",
        className,
      )}
    />
  );
}

/* ── Match card skeleton (used in Home / Live / Recent / Upcoming) ──────── */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
      {/* header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-12" />
      </div>
      {/* team rows */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-[14px] w-[20px] rounded-[3px]" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-[14px] w-[20px] rounded-[3px]" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      {/* momentum bar */}
      <Skeleton className="h-1.5 w-full rounded-full" />
      {/* footer link */}
      <div className="flex justify-end">
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}

/* ── Section skeleton: label + grid of cards ────────────────────────────── */
export function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="mt-3 space-y-3">
      {/* section label */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Home page hero skeleton ─────────────────────────────────────────────── */
export function HeroSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-6 space-y-4">
      {/* live badge */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2.5 w-28" />
      </div>
      {/* scoreboard */}
      <Skeleton className="h-14 w-64 rounded-md" />
      {/* headline */}
      <Skeleton className="h-3 w-full max-w-sm" />
      <Skeleton className="h-3 w-3/4 max-w-xs" />
    </div>
  );
}

/* ── Match detail page skeleton ─────────────────────────────────────────── */
export function MatchDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 pb-8 lg:px-8 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Scoreboard card */}
          <div className="rounded-xl border border-border bg-card p-5 lg:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-14 w-72 rounded-md" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {/* Pulse card */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-4/6" />
          </div>
          {/* Win probability card */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3">
            <Skeleton className="h-2.5 w-28" />
            {[100, 70, 55].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-20 shrink-0" />
                <Skeleton className={`h-2 rounded-full`} style={{ width: `${w}%` }} />
                <Skeleton className="h-3 w-8 shrink-0" />
              </div>
            ))}
          </div>
          {/* Stats card */}
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3">
            <Skeleton className="h-2.5 w-20" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        {/* Sidebar column */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3">
            <Skeleton className="h-2.5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-2.5">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-8 w-full rounded-md mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Recent page card skeleton ───────────────────────────────────────────── */
export function RecentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-2.5">
          <Skeleton className="h-[18px] w-[25px] rounded-[3px]" />
          <Skeleton className="h-3.5 w-20 flex-1" />
          <Skeleton className="h-6 w-6" />
        </div>
        <Skeleton className="h-10 w-10 rounded-md shrink-0" />
        <div className="flex flex-1 items-center gap-2.5 flex-row-reverse">
          <Skeleton className="h-[18px] w-[25px] rounded-[3px]" />
          <Skeleton className="h-3.5 w-20 flex-1" />
          <Skeleton className="h-6 w-6" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

/* ── Upcoming page card skeleton ─────────────────────────────────────────── */
export function UpcomingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2.5">
          <Skeleton className="h-[20px] w-[28px] rounded-[3px]" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-3 w-6 shrink-0" />
        <div className="flex flex-1 items-center gap-2.5 flex-row-reverse">
          <Skeleton className="h-[20px] w-[28px] rounded-[3px]" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-2.5 w-36" />
    </div>
  );
}
