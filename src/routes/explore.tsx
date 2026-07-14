import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { type Match } from "@/lib/matches";
import { fetchHomeMatches } from "@/lib/api";
import { UserMultiple02Icon, Award01Icon, Calendar01Icon, FootballIcon } from "hugeicons-react";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Pulse" },
      { name: "description", content: "Browse teams and fixtures." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHomeMatches()
      .then((data) => {
        if (cancelled) return;
        const combined = [
          ...(data?.live ?? []),
          ...(data?.upcoming ?? []),
          ...(data?.recent ?? []),
        ];
        setAllMatches(combined);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Derive unique teams from real match data
  const teamMap = new Map<string, { name: string; code: string }>();
  for (const m of allMatches) {
    if (!teamMap.has(m.home.short)) teamMap.set(m.home.short, { name: m.home.name, code: m.home.short });
    if (!teamMap.has(m.away.short)) teamMap.set(m.away.short, { name: m.away.name, code: m.away.short });
  }
  const teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totalFixtures = allMatches.length;

  return (
    <>
      <TopBar title="Explore" />
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-elevated)]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile icon={<UserMultiple02Icon size={16} strokeWidth={1.75} />} label="Teams" value={String(teams.length)} />
            <Tile icon={<Award01Icon size={16} strokeWidth={1.75} />} label="Competition" value={allMatches[0]?.competition ?? "—"} short />
            <Tile icon={<Calendar01Icon size={16} strokeWidth={1.75} />} label="Fixtures" value={String(totalFixtures)} />
          </div>
        )}

        <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Teams in competition
        </h2>

        {loading ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-elevated)]" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
            <FootballIcon size={28} strokeWidth={1.5} className="text-muted-foreground/40" />
            <p className="text-[13px] text-muted-foreground">No team data yet — backend connecting.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {teams.map(({ code, name }) => (
              <Link
                key={code}
                to="/live"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-foreground/20 transition-colors"
              >
                <Flag code={code} size={20} />
                <div>
                  <div className="text-[13px] font-semibold">{name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{code}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Tile({ icon, label, value, short }: { icon: React.ReactNode; label: string; value: string; short?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-widest">{label}</span>
      </div>
      <div className={`mt-2 font-bold ${short ? "text-[14px] font-semibold leading-tight" : "font-numeric text-[24px]"}`}>
        {value}
      </div>
    </div>
  );
}
