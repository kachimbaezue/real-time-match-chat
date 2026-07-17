import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { a as UpcomingCardSkeleton } from "./SkeletonLoader-BBMA5UuJ.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight01Icon, Calendar01Icon, Location01Icon } from "hugeicons-react";
//#region src/routes/upcoming.tsx?tsr-split=component
function UpcomingPage() {
	const [loading, setLoading] = useState(true);
	const [upcoming, setUpcoming] = useState([]);
	useEffect(() => {
		let cancelled = false;
		fetchHomeMatches().then((data) => {
			if (cancelled) return;
			if (Array.isArray(data?.upcoming)) setUpcoming(data.upcoming);
		}).catch(() => {}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Upcoming" }), /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10",
		children: loading ? /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx(UpcomingCardSkeleton, {}, i))
		}) : upcoming.length === 0 ? /* @__PURE__ */ jsxs("div", {
			className: "mt-8 flex flex-col items-center gap-3 py-12 text-center",
			children: [
				/* @__PURE__ */ jsx(Calendar01Icon, {
					size: 32,
					strokeWidth: 1.5,
					className: "text-muted-foreground"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] font-medium text-foreground",
					children: "No upcoming matches"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted-foreground",
					children: "Check back soon for the next fixtures."
				})
			]
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("p", {
			className: "text-[13px] text-muted-foreground",
			children: [
				upcoming.length,
				" ",
				upcoming.length === 1 ? "match" : "matches",
				" scheduled"
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: upcoming.map((m) => /* @__PURE__ */ jsx(UpcomingCard, { match: m }, m.id))
		})] })
	})] });
}
function UpcomingCard({ match }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: "/match/$id",
		params: { id: match.id },
		className: "group block rounded-xl border border-border bg-card p-4 hover:border-foreground/25 transition-colors press",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex items-center justify-between text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-semibold text-foreground",
					children: match.kickoff
				}), /* @__PURE__ */ jsx("span", {
					className: "uppercase tracking-widest",
					children: match.stage
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-4",
				children: [
					/* @__PURE__ */ jsx(TeamBlock, {
						name: match.home.name,
						code: match.home.short
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex flex-col items-center gap-0.5",
						children: /* @__PURE__ */ jsx("span", {
							className: "font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground",
							children: "vs"
						})
					}),
					/* @__PURE__ */ jsx(TeamBlock, {
						name: match.away.name,
						code: match.away.short,
						align: "right"
					})
				]
			}),
			match.venue && /* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground",
				children: [/* @__PURE__ */ jsx(Location01Icon, {
					size: 10,
					strokeWidth: 2
				}), /* @__PURE__ */ jsx("span", { children: match.venue })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground",
				children: ["Match preview", /* @__PURE__ */ jsx(ArrowRight01Icon, {
					size: 12,
					strokeWidth: 2
				})]
			})
		]
	});
}
function TeamBlock({ name, code, align = "left" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `flex flex-1 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`,
		children: [/* @__PURE__ */ jsx(Flag, {
			code,
			size: 20
		}), /* @__PURE__ */ jsxs("div", {
			className: align === "right" ? "text-right" : "text-left",
			children: [/* @__PURE__ */ jsx("div", {
				className: "text-[14px] font-semibold text-foreground",
				children: name
			}), /* @__PURE__ */ jsx("div", {
				className: "text-[10px] uppercase tracking-widest text-muted-foreground",
				children: code
			})]
		})]
	});
}
//#endregion
export { UpcomingPage as component };
