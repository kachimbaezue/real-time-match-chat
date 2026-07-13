import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/AppLayout";
import { Flag } from "@/components/Flag";
import { UserMultiple02Icon, Award01Icon, Calendar01Icon } from "hugeicons-react";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Pulse" },
      { name: "description", content: "Browse teams and upcoming World Cup 2026 fixtures." },
    ],
  }),
  component: Explore,
});

const teams = ["ARG", "BRA", "ESP", "FRA", "ENG", "GER", "POR", "NED", "ITA", "BEL", "USA", "MEX"];

const teamNames: Record<string, string> = {
  ARG: "Argentina", BRA: "Brazil", ESP: "Spain", FRA: "France",
  ENG: "England", GER: "Germany", POR: "Portugal", NED: "Netherlands",
  ITA: "Italy", BEL: "Belgium", USA: "United States", MEX: "Mexico",
};

function Explore() {
  return (
    <>
      <TopBar title="Explore" />
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile icon={<UserMultiple02Icon size={16} strokeWidth={1.75} />} label="Teams" value="32" />
          <Tile icon={<Award01Icon size={16} strokeWidth={1.75} />} label="Tournament" value="WC26" />
          <Tile icon={<Calendar01Icon size={16} strokeWidth={1.75} />} label="Fixtures" value="64" />
        </div>

        <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Qualified teams
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {teams.map((code) => (
            <div
              key={code}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-foreground/20 transition-colors"
            >
              <Flag code={code} size={20} />
              <div>
                <div className="text-[13px] font-semibold">{teamNames[code] ?? code}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{code}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-numeric text-[24px] font-bold">{value}</div>
    </div>
  );
}
