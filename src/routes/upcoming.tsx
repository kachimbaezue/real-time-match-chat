import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/AppLayout";
import { getUpcomingMatches, type Match } from "@/lib/matches";
import { Flag } from "@/components/Flag";
import {
  Calendar01Icon,
  ArrowRight01Icon,
  Location01Icon,
} from "hugeicons-react";
import { UpcomingCardSkeleton } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming — Pulse" },
      { name: "description", content: "Upcoming FIFA World Cup 2026 matches." },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<Match[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setUpcoming(getUpcomingMatches());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <TopBar title="Upcoming" />
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <UpcomingCardSkeleton key={i} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
            <Calendar01Icon size={32} strokeWidth={1.5} className="text-muted-foreground" />
            <p className="text-[14px] font-medium text-foreground">No upcoming matches</p>
            <p className="text-[13px] text-muted-foreground">Check back soon for the next fixtures.</p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              {upcoming.length} {upcoming.length === 1 ? "match" : "matches"} scheduled
            </p>
            <div className="mt-4 space-y-3">
              {upcoming.map((m) => (
                <UpcomingCard key={m.id} match={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function UpcomingCard({ match }: { match: Match }) {
  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">{match.kickoff}</span>
        <span className="uppercase tracking-widest">{match.stage}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <TeamBlock name={match.home.name} code={match.home.short} />
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
        </div>
        <TeamBlock name={match.away.name} code={match.away.short} align="right" />
      </div>

      {match.venue && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Location01Icon size={10} strokeWidth={2} />
          <span>{match.venue}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
        Match preview
        <ArrowRight01Icon size={12} strokeWidth={2} />
      </div>
    </Link>
  );
}

function TeamBlock({
  name,
  code,
  align = "left",
}: {
  name: string;
  code: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <Flag code={code} size={20} />
      <div className={align === "right" ? "text-right" : "text-left"}>
        <div className="text-[14px] font-semibold text-foreground">{name}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{code}</div>
      </div>
    </div>
  );
}
