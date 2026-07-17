import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import ReactDOM from "react-dom";
import { Calendar01Icon, Cancel01Icon, Clock01Icon, FlashIcon, FootballIcon, Home01Icon, Search01Icon, SidebarLeft01Icon } from "hugeicons-react";
//#region src/components/AppLayout.tsx
var NAV = [
	{
		to: "/",
		label: "Home",
		icon: Home01Icon
	},
	{
		to: "/live",
		label: "Live",
		icon: FootballIcon,
		dot: "live"
	},
	{
		to: "/hot",
		label: "Hot",
		icon: FlashIcon,
		dot: "hot"
	},
	{
		to: "/upcoming",
		label: "Upcoming",
		icon: Calendar01Icon
	},
	{
		to: "/recent",
		label: "Recent",
		icon: Clock01Icon
	}
];
var OPEN_W = 220;
var CLOSE_W = 56;
var _cachedMatches = null;
async function loadAllMatches() {
	if (_cachedMatches) return _cachedMatches;
	try {
		const data = await fetchHomeMatches();
		_cachedMatches = [
			...data?.live ?? [],
			...data?.upcoming ?? [],
			...data?.recent ?? []
		];
		return _cachedMatches;
	} catch {
		return [];
	}
}
function filterMatches(all, query) {
	if (!query.trim()) return [];
	const q = query.toLowerCase().trim();
	return all.filter((m) => m.home.name.toLowerCase().includes(q) || m.away.name.toLowerCase().includes(q) || m.home.short.toLowerCase().includes(q) || m.away.short.toLowerCase().includes(q) || m.competition.toLowerCase().includes(q) || m.stage.toLowerCase().includes(q) || (m.venue ?? "").toLowerCase().includes(q));
}
function StatusBadge({ status, minute }) {
	if (status === "live") return /* @__PURE__ */ jsxs("span", {
		className: "flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-foreground",
		children: [
			/* @__PURE__ */ jsx("span", { className: "live-dot" }),
			"LIVE ",
			minute ? `· ${minute}'` : ""
		]
	});
	if (status === "finished") return /* @__PURE__ */ jsx("span", {
		className: "text-[9px] font-semibold uppercase tracking-widest text-muted-foreground",
		children: "FT"
	});
	return null;
}
function SearchModal({ onClose }) {
	const [query, setQuery] = useState("");
	const [allMatches, setAllMatches] = useState(_cachedMatches ?? []);
	const inputRef = useRef(null);
	const results = filterMatches(allMatches, query);
	const hasQuery = query.trim().length > 0;
	useEffect(() => {
		loadAllMatches().then((m) => setAllMatches(m));
	}, []);
	useEffect(() => {
		const t = setTimeout(() => inputRef.current?.focus(), 50);
		return () => clearTimeout(t);
	}, []);
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-fade-in",
		style: {
			background: "rgba(0,0,0,0.55)",
			backdropFilter: "blur(4px)"
		},
		onClick: (e) => {
			if (e.target === e.currentTarget) onClose();
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-scale-in",
			style: { background: "var(--panel)" },
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3 px-4 py-3.5 border-b border-border",
				style: { background: "var(--panel)" },
				children: [
					/* @__PURE__ */ jsx(Search01Icon, {
						size: 17,
						strokeWidth: 1.75,
						className: "shrink-0 text-muted-foreground"
					}),
					/* @__PURE__ */ jsx("input", {
						ref: inputRef,
						type: "text",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search matches, teams, competitions…",
						className: "flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
					}),
					query && /* @__PURE__ */ jsx("button", {
						onClick: () => setQuery(""),
						className: "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
						children: /* @__PURE__ */ jsx(Cancel01Icon, {
							size: 16,
							strokeWidth: 1.75
						})
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: onClose,
						className: "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border hover:text-foreground transition-colors",
						children: "ESC"
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "max-h-[420px] overflow-y-auto",
				children: [
					!hasQuery && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-12 text-center",
						children: [/* @__PURE__ */ jsx(FootballIcon, {
							size: 28,
							strokeWidth: 1.5,
							className: "text-muted-foreground/40 mb-3"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[13px] text-muted-foreground",
							children: "Type to search for a match or team"
						})]
					}),
					hasQuery && results.length === 0 && /* @__PURE__ */ jsx("div", {
						className: "flex flex-col items-center justify-center py-12 text-center",
						children: /* @__PURE__ */ jsxs("p", {
							className: "text-[13px] text-muted-foreground",
							children: ["No matches found for ", /* @__PURE__ */ jsxs("span", {
								className: "text-foreground",
								children: [
									"\"",
									query,
									"\""
								]
							})]
						})
					}),
					hasQuery && results.length > 0 && /* @__PURE__ */ jsxs("div", {
						className: "p-3 space-y-1",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
							children: [
								results.length,
								" result",
								results.length !== 1 ? "s" : ""
							]
						}), results.map((m) => /* @__PURE__ */ jsxs(Link, {
							to: "/match/$id",
							params: { id: m.id },
							onClick: onClose,
							className: "flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/8 transition-colors group",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 min-w-0",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx(Flag, {
											code: m.home.short,
											size: 14
										}), /* @__PURE__ */ jsx("span", {
											className: "font-display text-[13px] font-semibold text-foreground",
											children: m.home.name
										})]
									}),
									/* @__PURE__ */ jsx("span", {
										className: "font-numeric text-[15px] font-bold text-foreground tabular-nums",
										children: m.status !== "upcoming" ? `${m.home.score} – ${m.away.score}` : "vs"
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "font-display text-[13px] font-semibold text-foreground",
											children: m.away.name
										}), /* @__PURE__ */ jsx(Flag, {
											code: m.away.short,
											size: 14
										})]
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 shrink-0 ml-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[10px] text-muted-foreground hidden sm:block",
									children: m.stage
								}), /* @__PURE__ */ jsx(StatusBadge, {
									status: m.status,
									minute: m.minute
								})]
							})]
						}, m.id))]
					})
				]
			})]
		})
	});
}
function AppLayout({ children }) {
	const { pathname } = useLocation();
	const [open, setOpen] = useState(true);
	const [searchOpen, setSearchOpen] = useState(false);
	const [hasLive, setHasLive] = useState(false);
	const sideW = open ? OPEN_W : CLOSE_W;
	useEffect(() => {
		let cancelled = false;
		const check = () => {
			fetchHomeMatches().then((data) => {
				if (!cancelled) setHasLive(Array.isArray(data?.live) && data.live.length > 0);
			}).catch(() => {});
		};
		check();
		const t = setInterval(check, 6e4);
		return () => {
			cancelled = true;
			clearInterval(t);
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen overflow-hidden",
		style: { background: "var(--shell)" },
		children: [
			/* @__PURE__ */ jsx("style", { children: `@media(min-width:1024px){.right-col{margin-left:${sideW}px}}` }),
			/* @__PURE__ */ jsxs("aside", {
				className: "hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 shrink-0 transition-[width] duration-200 overflow-hidden",
				style: {
					width: sideW,
					background: "var(--panel)"
				},
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex shrink-0 items-center px-4 pt-5 pb-4",
						children: /* @__PURE__ */ jsx("img", {
							src: "/logo.png",
							alt: "Pulse",
							className: "h-14 w-14 shrink-0 object-contain"
						})
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "flex-1 flex flex-col gap-0.5 px-2 pt-3",
						children: NAV.map(({ to, label, icon: Icon, dot }) => {
							const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
							const showDot = dot === "live" ? hasLive : dot === "hot" ? hasLive : false;
							return /* @__PURE__ */ jsxs(Link, {
								to,
								title: !open ? label : void 0,
								className: [
									"group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] font-medium",
									"transition-colors duration-100 select-none press",
									active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
								].join(" "),
								children: [/* @__PURE__ */ jsxs("span", {
									className: "relative shrink-0 flex h-5 w-5 items-center justify-center",
									children: [/* @__PURE__ */ jsx(Icon, {
										size: 17,
										strokeWidth: active ? 2 : 1.6
									}), showDot && /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" })]
								}), open && /* @__PURE__ */ jsx("span", {
									className: "whitespace-nowrap animate-slide-in-left",
									children: label
								})]
							}, to);
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "shrink-0 px-3 pb-4",
						children: [open && /* @__PURE__ */ jsxs("div", {
							className: "mb-3 space-y-1",
							children: [/* @__PURE__ */ jsx("a", {
								href: "https://superteam.fun",
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex items-center rounded-lg px-1 py-2 hover:bg-white/6 transition-colors",
								title: "Superteam",
								children: /* @__PURE__ */ jsx("img", {
									src: "/super-teamlogo.png",
									alt: "Superteam",
									className: "h-20 max-w-[180px] object-contain shrink-0"
								})
							}), /* @__PURE__ */ jsx("a", {
								href: "https://txline.io",
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex items-center rounded-lg px-1 py-2 hover:bg-white/6 transition-colors",
								title: "TxLine",
								children: /* @__PURE__ */ jsx("img", {
									src: "/txline-logo.svg",
									alt: "TxLine",
									className: "h-8 max-w-[140px] object-contain shrink-0"
								})
							})]
						}), /* @__PURE__ */ jsxs("button", {
							onClick: () => setOpen((v) => !v),
							title: open ? "Collapse" : "Expand",
							"aria-label": open ? "Collapse sidebar" : "Expand sidebar",
							className: "flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-[12px] text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors press",
							children: [/* @__PURE__ */ jsx("span", {
								className: "shrink-0 flex h-5 w-5 items-center justify-center",
								children: /* @__PURE__ */ jsx(SidebarLeft01Icon, {
									size: 16,
									strokeWidth: 1.75
								})
							}), open && /* @__PURE__ */ jsx("span", {
								className: "whitespace-nowrap",
								children: "Collapse"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "right-col flex flex-1 flex-col h-screen transition-[margin-left] duration-200",
				style: { background: "var(--panel)" },
				children: [/* @__PURE__ */ jsx("div", {
					id: "header-mount",
					className: "shrink-0"
				}), /* @__PURE__ */ jsx("div", {
					className: "flex-1 min-h-0 px-2 pb-2",
					children: /* @__PURE__ */ jsx("div", {
						className: "h-full rounded-xl overflow-hidden",
						style: { background: "var(--surface)" },
						children: /* @__PURE__ */ jsx("main", {
							className: "h-full overflow-y-auto overflow-x-hidden pb-20 lg:pb-6 animate-page-enter",
							children
						})
					})
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed bottom-4 left-1/2 z-40 lg:hidden -translate-x-1/2 rounded-2xl border border-border shadow-2xl",
				style: {
					background: "var(--panel)",
					width: "calc(100% - 2rem)"
				},
				children: /* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-around px-2 py-2",
					children: NAV.map(({ to, label, icon: Icon, dot }) => {
						const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
						const showDot = dot === "live" ? hasLive : dot === "hot" ? hasLive : false;
						return /* @__PURE__ */ jsxs(Link, {
							to,
							className: [
								"relative flex flex-1 flex-col items-center gap-0.5 rounded-md py-2",
								"text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors press",
								active ? "text-foreground" : "text-muted-foreground"
							].join(" "),
							children: [
								active && /* @__PURE__ */ jsx("span", { className: "absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-foreground" }),
								/* @__PURE__ */ jsxs("span", {
									className: "relative",
									children: [/* @__PURE__ */ jsx(Icon, {
										size: 20,
										strokeWidth: active ? 2 : 1.5
									}), showDot && /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" })]
								}),
								/* @__PURE__ */ jsx("span", { children: label })
							]
						}, to);
					})
				})
			}),
			searchOpen && ReactDOM.createPortal(/* @__PURE__ */ jsx(SearchModal, { onClose: () => setSearchOpen(false) }), document.body)
		]
	});
}
function TopBar({ title, action }) {
	const [mount, setMount] = useState(null);
	const [searchOpen, setSearchOpen] = useState(false);
	useEffect(() => {
		setMount(document.getElementById("header-mount"));
	}, []);
	const bar = /* @__PURE__ */ jsxs("div", {
		className: "flex h-13 items-center justify-between px-5 lg:px-6",
		style: { background: "var(--panel)" },
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ jsx("img", {
					src: "/logo.png",
					alt: "",
					className: "h-6 w-6 object-contain lg:hidden"
				}), /* @__PURE__ */ jsx("h1", {
					className: "font-display text-[15px] font-bold tracking-tight lg:hidden",
					children: title
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-1.5",
				children: action ?? /* @__PURE__ */ jsx("button", {
					"aria-label": "Search",
					onClick: () => setSearchOpen(true),
					className: "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--color-elevated)] hover:text-foreground transition-colors press",
					children: /* @__PURE__ */ jsx(Search01Icon, {
						size: 16,
						strokeWidth: 1.75
					})
				})
			}),
			searchOpen && ReactDOM.createPortal(/* @__PURE__ */ jsx(SearchModal, { onClose: () => setSearchOpen(false) }), document.body)
		]
	});
	if (!mount) return null;
	return ReactDOM.createPortal(bar, mount);
}
//#endregion
export { TopBar as n, AppLayout as t };
