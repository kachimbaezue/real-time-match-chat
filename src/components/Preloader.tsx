import { useEffect, useState } from "react";

export function Preloader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fading"), 2000);
    const t2 = setTimeout(() => setPhase("gone"), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[999] transition-opacity duration-500 ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden
    >
      <video
        autoPlay
        muted
        playsInline
        loop
        className="h-full w-full object-cover"
        src="/preloader.mp4"
      />
    </div>
  );
}
