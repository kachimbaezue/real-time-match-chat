import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { t as MomentumBar } from "./routes-DkPkRuVB.js";
import { i as SectionSkeleton } from "./SkeletonLoader-BBMA5UuJ.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight01Icon, FootballIcon } from "hugeicons-react";
//#region src/routes/live.tsx?tsr-split=component
function LivePage() {
	const [loading, setLoading] = useState(true);
	const [live, setLive] = useState([]);
	useEffect(() => {
		let cancelled = false;
		fetchHomeMatches().then((data) => {
			if (cancelled) return;
			if (Array.isArray(data?.live)) setLive(data.live);
		}).catch(() => {}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Live" }), /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10",
		children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", { className: "h-4 w-40 animate-pulse rounded bg-[var(--color-elevated)]" }), /* @__PURE__ */ jsx(SectionSkeleton, { rows: 3 })] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("p", {
			className: "text-[13px] text-muted-foreground",
			children: [
				live.length,
				" ",
				live.length === 1 ? "match" : "matches",
				" happening right now"
			]
		}), live.length === 0 ? /* @__PURE__ */ jsxs("div", {
			className: "mt-8 flex flex-col items-center gap-3 py-12 text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[32px]",
					children: /* @__PURE__ */ jsx(FootballIcon, {
						size: 32,
						strokeWidth: 1.5,
						className: "text-muted-foreground"
					})
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] font-medium text-foreground",
					children: "No live matches right now"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted-foreground",
					children: "Check back when the next match kicks off."
				})
			]
		}) : /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: live.map((m) => /* @__PURE__ */ jsx(LiveMatchCard, { match: m }, m.id))
		})] })
	})] });
}
function LiveMatchCard({ match }) {
	const momentumLabel = Math.abs(match.momentum) < 15 ? "Balanced" : match.momentum > 0 ? match.home.short : match.away.short;
	return /* @__PURE__ */ jsxs(Link, {
		to: "/match/$id",
		params: { id: match.id },
		className: "group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex items-center justify-between text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ jsxs("span", { children: [
					match.stage,
					" · ",
					match.competition
				] }), /* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-1.5 font-semibold text-foreground",
					children: [
						/* @__PURE__ */ jsx("span", { className: "live-dot" }),
						" ",
						match.minute,
						"'"
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-2.5",
				children: [/* @__PURE__ */ jsx(TeamLine, {
					name: match.home.name,
					code: match.home.short,
					score: match.home.score
				}), /* @__PURE__ */ jsx(TeamLine, {
					name: match.away.name,
					code: match.away.short,
					score: match.away.score
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 space-y-1.5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between text-[10px] text-muted-foreground",
					children: [/* @__PURE__ */ jsx("span", {
						className: "uppercase tracking-widest",
						children: "Momentum"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-foreground",
						children: momentumLabel
					})]
				}), /* @__PURE__ */ jsx(MomentumBar, { value: match.momentum })]
			}),
			match.headline && /* @__PURE__ */ jsx("p", {
				className: "mt-3 line-clamp-2 text-[13px] text-muted-foreground",
				children: match.headline
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground",
				children: ["Open match", /* @__PURE__ */ jsx(ArrowRight01Icon, {
					size: 12,
					strokeWidth: 2
				})]
			})
		]
	});
}
function TeamLine({ name, code, score }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2.5",
			children: [
				/* @__PURE__ */ jsx(Flag, {
					code,
					size: 18
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-[14px] font-medium",
					children: name
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-[10px] uppercase tracking-widest text-muted-foreground",
					children: code
				})
			]
		}), /* @__PURE__ */ jsx("span", {
			className: "font-numeric text-[20px] font-bold",
			children: score
		})]
	});
}
//#endregion
export { LivePage as component };
