import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/AppLayout";
import { Notification03Icon } from "hugeicons-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Pulse" },
      { name: "description", content: "Momentum shifts, goals, and AI updates from your matches." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  return (
    <>
      <TopBar title="Notifications" />
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
            <Notification03Icon size={20} strokeWidth={1.75} className="text-muted-foreground" />
          </div>
          <p className="text-[14px] font-medium text-foreground">No notifications yet</p>
          <p className="text-[13px] text-muted-foreground max-w-xs">
            Goal alerts, momentum shifts, and AI updates from live matches will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
