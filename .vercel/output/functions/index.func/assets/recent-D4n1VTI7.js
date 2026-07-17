import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { r as RecentCardSkeleton } from "./SkeletonLoader-BBMA5UuJ.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight01Icon, CheckmarkCircle01Icon, Location01Icon, PlayCircle02Icon } from "hugeicons-react";
//#region src/routes/recent.tsx?tsr-split=component
function RecentPage() {
	const [loading, setLoading] = useState(true);
	const [recent, setRecent] = useState([]);
	useEffect(() => {
		let cancelled = false;
		fetchHomeMatches().then((data) => {
			if (cancelled) return;
			if (Array.isArray(data?.recent)) setRecent(data.recent);
		}).catch(() => {}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Recent" }), /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10",
		children: loading ? /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx(RecentCardSkeleton, {}, i))
		}) : recent.length === 0 ? /* @__PURE__ */ jsxs("div", {
			className: "mt-8 flex flex-col items-center gap-3 py-12 text-center",
			children: [
				/* @__PURE__ */ jsx(CheckmarkCircle01Icon, {
					size: 32,
					strokeWidth: 1.5,
					className: "text-muted-foreground"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] font-medium text-foreground",
					children: "No recent matches yet"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted-foreground",
					children: "Finished matches will appear here with full analysis."
				})
			]
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("p", {
			className: "text-[13px] text-muted-foreground",
			children: [
				recent.length,
				" finished ",
				recent.length === 1 ? "match" : "matches"
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: recent.map((m) => /* @__PURE__ */ jsx(RecentCard, { match: m }, m.id))
		})] })
	})] });
}
function RecentCard({ match }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: "/match/$id",
		params: { id: match.id },
		className: "group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors press",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex items-center justify-between text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ jsx(CheckmarkCircle01Icon, {
						size: 11,
						strokeWidth: 2
					}), /* @__PURE__ */ jsxs("span", {
						className: "uppercase tracking-widest",
						children: ["Full-time · ", match.stage]
					})]
				}), /* @__PURE__ */ jsx("span", { children: match.kickoff })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-4",
				children: [
					/* @__PURE__ */ jsx(TeamScore, {
						name: match.home.name,
						code: match.home.short,
						score: match.home.score
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-elevated)] text-[11px] font-bold text-muted-foreground",
						children: "FT"
					}),
					/* @__PURE__ */ jsx(TeamScore, {
						name: match.away.name,
						code: match.away.short,
						score: match.away.score,
						align: "right"
					})
				]
			}),
			match.venue && /* @__PURE__ */ jsxs("div", {
				className: "mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground",
				children: [/* @__PURE__ */ jsx(Location01Icon, {
					size: 10,
					strokeWidth: 2
				}), /* @__PURE__ */ jsx("span", { children: match.venue })]
			}),
			match.headline && /* @__PURE__ */ jsx("p", {
				className: "mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground",
				children: match.headline
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1.5 text-[11px] text-muted-foreground",
					children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
						size: 12,
						strokeWidth: 2
					}), /* @__PURE__ */ jsx("span", { children: "Replay available" })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground",
					children: ["Full analysis", /* @__PURE__ */ jsx(ArrowRight01Icon, {
						size: 12,
						strokeWidth: 2
					})]
				})]
			})
		]
	});
}
function TeamScore({ name, code, score, align = "left" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `flex flex-1 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`,
		children: [
			/* @__PURE__ */ jsx(Flag, {
				code,
				size: 18
			}),
			/* @__PURE__ */ jsxs("div", {
				className: `flex-1 ${align === "right" ? "text-right" : "text-left"}`,
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-[13px] font-semibold text-foreground",
					children: name
				}), /* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-widest text-muted-foreground",
					children: code
				})]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "font-numeric text-[22px] font-bold leading-none text-foreground",
				children: score
			})
		]
	});
}
//#endregion
export { RecentPage as component };
