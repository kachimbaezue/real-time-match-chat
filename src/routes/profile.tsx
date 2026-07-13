import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "hugeicons-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Pulse" }],
  }),
  component: ProfileRedirect,
});

// Profile is not part of the MVP — redirect to home
function ProfileRedirect() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground">Not available</div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">Profile coming soon</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Focus on the matches for now.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background"
        >
          <ArrowLeft01Icon size={14} strokeWidth={2} />
          Back to matches
        </Link>
      </div>
    </div>
  );
}
