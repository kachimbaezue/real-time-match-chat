// Simple abstract flag markers (colored bars) - no emoji, no external assets.
const FLAGS: Record<string, { bars: string[]; dir?: "h" | "v" }> = {
  ARG: { bars: ["#75AADB", "#FFFFFF", "#75AADB"], dir: "h" },
  BRA: { bars: ["#009C3B", "#FFDF00", "#002776"], dir: "h" },
  ESP: { bars: ["#AA151B", "#F1BF00", "#AA151B"], dir: "h" },
  FRA: { bars: ["#0055A4", "#FFFFFF", "#EF4135"], dir: "v" },
  ENG: { bars: ["#FFFFFF", "#CE1124", "#FFFFFF"], dir: "h" },
  GER: { bars: ["#000000", "#DD0000", "#FFCE00"], dir: "h" },
  POR: { bars: ["#046A38", "#DA291C"], dir: "v" },
  NED: { bars: ["#AE1C28", "#FFFFFF", "#21468B"], dir: "h" },
  ITA: { bars: ["#008C45", "#FFFFFF", "#CD212A"], dir: "v" },
  BEL: { bars: ["#000000", "#FDDA24", "#EF3340"], dir: "v" },
  USA: { bars: ["#B22234", "#FFFFFF", "#3C3B6E"], dir: "h" },
  MEX: { bars: ["#006847", "#FFFFFF", "#CE1126"], dir: "v" },
  MAR: { bars: ["#C1272D", "#006233", "#C1272D"], dir: "h" },
  JPN: { bars: ["#FFFFFF", "#BC002D", "#FFFFFF"], dir: "h" },
  KOR: { bars: ["#FFFFFF", "#CD2E3A", "#003478"], dir: "h" },
  AUS: { bars: ["#00008B", "#CC142B", "#00008B"], dir: "h" },
  SEN: { bars: ["#00853F", "#FDEF42", "#E31B23"], dir: "v" },
  URU: { bars: ["#FFFFFF", "#5EB6E4", "#FFFFFF"], dir: "h" },
  COL: { bars: ["#FCD116", "#003087", "#CE1126"], dir: "h" },
  ECU: { bars: ["#FFD100", "#003893", "#CE1126"], dir: "h" },
};

interface Props {
  code: string;
  size?: number;
  className?: string;
}

export function Flag({ code, size = 20, className = "" }: Props) {
  const spec = FLAGS[code] ?? { bars: ["#3f3f46", "#52525b", "#71717a"], dir: "h" as const };
  const dir = spec.dir ?? "h";
  return (
    <div
      className={`overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/40 ${className}`}
      style={{
        width: size * 1.4,
        height: size,
        display: "flex",
        flexDirection: dir === "h" ? "column" : "row",
      }}
      aria-hidden
    >
      {spec.bars.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}
