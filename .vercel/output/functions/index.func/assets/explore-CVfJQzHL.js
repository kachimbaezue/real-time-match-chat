import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Award01Icon, Calendar01Icon, FootballIcon, UserMultiple02Icon } from "hugeicons-react";
//#region src/routes/explore.tsx?tsr-split=component
function Explore() {
	const [allMatches, setAllMatches] = useState([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		let cancelled = false;
		fetchHomeMatches().then((data) => {
			if (cancelled) return;
			const combined = [
				...data?.live ?? [],
				...data?.upcoming ?? [],
				...data?.recent ?? []
			];
			setAllMatches(combined);
		}).catch(() => {}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const teamMap = /* @__PURE__ */ new Map();
	for (const m of allMatches) {
		if (!teamMap.has(m.home.short)) teamMap.set(m.home.short, {
			name: m.home.name,
			code: m.home.short
		});
		if (!teamMap.has(m.away.short)) teamMap.set(m.away.short, {
			name: m.away.name,
			code: m.away.short
		});
	}
	const teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
	const totalFixtures = allMatches.length;
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Explore" }), /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10",
		children: [
			loading ? /* @__PURE__ */ jsx("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-20 animate-pulse rounded-xl bg-[var(--color-elevated)]" }, i))
			}) : /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ jsx(Tile, {
						icon: /* @__PURE__ */ jsx(UserMultiple02Icon, {
							size: 16,
							strokeWidth: 1.75
						}),
						label: "Teams",
						value: String(teams.length)
					}),
					/* @__PURE__ */ jsx(Tile, {
						icon: /* @__PURE__ */ jsx(Award01Icon, {
							size: 16,
							strokeWidth: 1.75
						}),
						label: "Competition",
						value: allMatches[0]?.competition ?? "—",
						short: true
					}),
					/* @__PURE__ */ jsx(Tile, {
						icon: /* @__PURE__ */ jsx(Calendar01Icon, {
							size: 16,
							strokeWidth: 1.75
						}),
						label: "Fixtures",
						value: String(totalFixtures)
					})
				]
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
				children: "Teams in competition"
			}),
			loading ? /* @__PURE__ */ jsx("div", {
				className: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
				children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-16 animate-pulse rounded-xl bg-[var(--color-elevated)]" }, i))
			}) : teams.length === 0 ? /* @__PURE__ */ jsxs("div", {
				className: "mt-6 flex flex-col items-center gap-3 py-10 text-center",
				children: [/* @__PURE__ */ jsx(FootballIcon, {
					size: 28,
					strokeWidth: 1.5,
					className: "text-muted-foreground/40"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted-foreground",
					children: "No team data yet — backend connecting."
				})]
			}) : /* @__PURE__ */ jsx("div", {
				className: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
				children: teams.map(({ code, name }) => /* @__PURE__ */ jsxs(Link, {
					to: "/live",
					className: "flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-foreground/20 transition-colors",
					children: [/* @__PURE__ */ jsx(Flag, {
						code,
						size: 20
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[13px] font-semibold",
						children: name
					}), /* @__PURE__ */ jsx("div", {
						className: "text-[10px] uppercase tracking-widest text-muted-foreground",
						children: code
					})] })]
				}, code))
			})
		]
	})] });
}
function Tile({ icon, label, value, short }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 text-muted-foreground",
			children: [icon, /* @__PURE__ */ jsx("span", {
				className: "text-[11px] font-medium uppercase tracking-widest",
				children: label
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: `mt-2 font-bold ${short ? "text-[14px] font-semibold leading-tight" : "font-numeric text-[24px]"}`,
			children: value
		})]
	});
}
//#endregion
export { Explore as component };
