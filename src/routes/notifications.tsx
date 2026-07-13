import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/AppLayout";
import { FlashIcon, CircleIcon, Notification03Icon } from "hugeicons-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Pulse" },
      { name: "description", content: "Momentum shifts, goals, and AI updates from your matches." },
    ],
  }),
  component: Notifications,
});

const items = [
  {
    Icon: CircleIcon,
    tone: "var(--color-success)",
    title: "Goal — Argentina",
    text: "Álvarez scores. Argentina 2–1 Brazil, 74'",
    time: "2m ago",
  },
  {
    Icon: FlashIcon,
    tone: "var(--color-foreground)",
    title: "Momentum shift",
    text: "Argentina have taken control after the red card.",
    time: "12m ago",
  },
  {
    Icon: Notification03Icon,
    tone: "var(--color-warning)",
    title: "Match starting soon",
    text: "Portugal vs Netherlands kicks off in 30 minutes.",
    time: "30m ago",
  },
];

function Notifications() {
  return (
    <>
      <TopBar title="Notifications" />
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <div
                className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border"
                style={{ color: n.tone }}
              >
                <n.Icon size={14} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">{n.time}</div>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{n.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
