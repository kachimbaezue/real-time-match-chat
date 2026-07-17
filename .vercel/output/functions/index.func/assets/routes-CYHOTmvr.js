import { n as fetchHomeMatches, t as Flag } from "./Flag-VIOBFtoO.js";
import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { a as onMomentumUpdated, i as onMatchPulseUpdated, o as onScoreUpdated, r as onMatchFinished, t as Scoreboard } from "./Scoreboard-D-PKXTn2.js";
import { i as SectionSkeleton, t as HeroSkeleton } from "./SkeletonLoader-BBMA5UuJ.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight01Icon, Calendar01Icon, CheckmarkCircle01Icon, Clock01Icon, FootballIcon } from "hugeicons-react";
//#region src/routes/index.tsx?tsr-split=component
function Home() {
	const [loading, setLoading] = useState(true);
	const [live, setLive] = useState([]);
	const [upcoming, setUpcoming] = useState([]);
	const [recent, setRecent] = useState([]);
	useEffect(() => {
		let cancelled = false;
		fetchHomeMatches().then((data) => {
			if (cancelled) return;
			if (Array.isArray(data?.live)) setLive(data.live);
			if (Array.isArray(data?.upcoming)) setUpcoming(data.upcoming);
			if (Array.isArray(data?.recent)) setRecent(data.recent);
		}).catch(() => {}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	useEffect(() => {
		const unsubScore = onScoreUpdated(({ matchId, homeScore, awayScore, minute }) => {
			setLive((prev) => prev.map((m) => m.id === matchId ? {
				...m,
				home: {
					...m.home,
					score: homeScore
				},
				away: {
					...m.away,
					score: awayScore
				},
				minute
			} : m));
		});
		const unsubMomentum = onMomentumUpdated(({ matchId, momentum }) => {
			setLive((prev) => prev.map((m) => m.id === matchId ? {
				...m,
				momentum
			} : m));
		});
		const unsubPulse = onMatchPulseUpdated(({ matchId, headline }) => {
			setLive((prev) => prev.map((m) => m.id === matchId ? {
				...m,
				headline
			} : m));
		});
		const unsubFinished = onMatchFinished(({ matchId, homeScore, awayScore, turningPoints }) => {
			setLive((prev) => {
				const finished = prev.find((m) => m.id === matchId);
				if (!finished) return prev;
				const updated = {
					...finished,
					status: "finished",
					home: {
						...finished.home,
						score: homeScore
					},
					away: {
						...finished.away,
						score: awayScore
					},
					turningPoints
				};
				setRecent((r) => [updated, ...r]);
				return prev.filter((m) => m.id !== matchId);
			});
		});
		return () => {
			unsubScore();
			unsubMomentum();
			unsubPulse();
			unsubFinished();
		};
	}, []);
	const featured = live[0];
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Pulse" }), /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8",
		children: [
			loading ? /* @__PURE__ */ jsx(HeroSkeleton, {}) : featured ? /* @__PURE__ */ jsx(FeaturedMatch, { match: featured }) : null,
			/* @__PURE__ */ jsxs("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ jsx(SectionHeader, {
					icon: /* @__PURE__ */ jsx(FootballIcon, {
						size: 15,
						strokeWidth: 1.75
					}),
					label: "Live now",
					count: loading ? void 0 : live.length
				}), loading ? /* @__PURE__ */ jsx(SectionSkeleton, { rows: 2 }) : live.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { message: "No live matches right now." }) : /* @__PURE__ */ jsx("div", {
					className: "mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2",
					children: live.map((m) => /* @__PURE__ */ jsx(MatchCard, { match: m }, m.id))
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ jsx(SectionHeader, {
					icon: /* @__PURE__ */ jsx(Calendar01Icon, {
						size: 15,
						strokeWidth: 1.75
					}),
					label: "Upcoming",
					count: loading ? void 0 : upcoming.length
				}), loading ? /* @__PURE__ */ jsx(SectionSkeleton, { rows: 2 }) : upcoming.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { message: "No upcoming matches scheduled." }) : /* @__PURE__ */ jsx("div", {
					className: "mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2",
					children: upcoming.map((m) => /* @__PURE__ */ jsx(MatchCard, { match: m }, m.id))
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ jsx(SectionHeader, {
					icon: /* @__PURE__ */ jsx(Clock01Icon, {
						size: 15,
						strokeWidth: 1.75
					}),
					label: "Recent",
					count: loading ? void 0 : recent.length
				}), loading ? /* @__PURE__ */ jsx(SectionSkeleton, { rows: 2 }) : recent.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { message: "No recent matches." }) : /* @__PURE__ */ jsx("div", {
					className: "mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2",
					children: recent.map((m) => /* @__PURE__ */ jsx(MatchCard, { match: m }, m.id))
				})]
			})
		]
	})] });
}
function SectionHeader({ icon, label, count }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2 text-muted-foreground",
		children: [
			icon,
			/* @__PURE__ */ jsx("span", {
				className: "font-display text-[11px] font-bold uppercase tracking-[0.16em]",
				children: label
			}),
			count !== void 0 && /* @__PURE__ */ jsx("span", {
				className: "rounded-full border border-border px-1.5 py-0.5 font-numeric text-[9px] font-semibold",
				children: count
			})
		]
	});
}
function EmptyState({ message }) {
	return /* @__PURE__ */ jsx("p", {
		className: "mt-3 text-[13px] text-muted-foreground",
		children: message
	});
}
function FeaturedMatch({ match }) {
	const [home = 0, draw = 0, away = 0] = match.winProbability ?? [
		0,
		0,
		0
	];
	const momentumLabel = Math.abs(match.momentum ?? 0) < 15 ? "Balanced" : (match.momentum ?? 0) > 0 ? match.home.name : match.away.name;
	return /* @__PURE__ */ jsx("div", {
		className: "rounded-2xl border border-border bg-card overflow-hidden",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col lg:flex-row",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex-1 p-4 lg:p-6",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx("span", { className: "live-dot" }),
								/* @__PURE__ */ jsxs("span", {
									className: "text-foreground",
									children: [
										"LIVE · ",
										match.minute,
										"'"
									]
								}),
								/* @__PURE__ */ jsx("span", { children: "·" }),
								/* @__PURE__ */ jsx("span", { children: match.stage })
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex justify-center lg:justify-start",
							children: /* @__PURE__ */ jsx(Scoreboard, {
								home: match.home,
								away: match.away,
								minute: match.minute,
								status: match.status,
								size: "lg"
							})
						}),
						match.headline && /* @__PURE__ */ jsx("p", {
							className: "mt-4 max-w-md text-[13px] leading-relaxed text-muted-foreground",
							children: match.headline
						}),
						/* @__PURE__ */ jsxs(Link, {
							to: "/match/$id",
							params: { id: match.id },
							className: "mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:underline",
							children: ["Open match", /* @__PURE__ */ jsx(ArrowRight01Icon, {
								size: 14,
								strokeWidth: 2
							})]
						})
					]
				}),
				/* @__PURE__ */ jsx("div", { className: "hidden lg:block w-px bg-border" }),
				/* @__PURE__ */ jsx("div", { className: "lg:hidden h-px bg-border mx-4" }),
				/* @__PURE__ */ jsxs("div", {
					className: "lg:w-[220px] shrink-0 p-4 lg:p-5 flex flex-col gap-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2",
								children: "Win probability"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex h-2 overflow-hidden rounded-full gap-0.5",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "bg-foreground rounded-l-full transition-[width] duration-700",
										style: { width: `${home}%` }
									}),
									/* @__PURE__ */ jsx("div", {
										className: "bg-muted-foreground/30 transition-[width] duration-700",
										style: { width: `${draw}%` }
									}),
									/* @__PURE__ */ jsx("div", {
										className: "bg-muted-foreground/60 rounded-r-full transition-[width] duration-700",
										style: { width: `${away}%` }
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-1.5 flex justify-between text-[10px] text-muted-foreground",
								children: [
									/* @__PURE__ */ jsxs("span", {
										className: "text-foreground font-medium",
										children: [home, "%"]
									}),
									/* @__PURE__ */ jsxs("span", { children: [draw, "% D"] }),
									/* @__PURE__ */ jsxs("span", { children: [away, "%"] })
								]
							})
						] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-2",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
								children: "Momentum"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-foreground font-medium",
								children: momentumLabel
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "relative h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]",
							children: [/* @__PURE__ */ jsx("div", {
								className: "absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700",
								style: { width: `${50 + (match.momentum ?? 0) / 2}%` }
							}), /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-1/2 w-px bg-border" })]
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
								children: "Stats"
							}), [
								{
									label: "Possession",
									home: `${match.stats?.possession?.[0] ?? 0}%`,
									away: `${match.stats?.possession?.[1] ?? 0}%`
								},
								{
									label: "Shots",
									home: String(match.stats?.shots?.[0] ?? 0),
									away: String(match.stats?.shots?.[1] ?? 0)
								},
								{
									label: "xG",
									home: String(match.stats?.xg?.[0] ?? 0),
									away: String(match.stats?.xg?.[1] ?? 0)
								}
							].map(({ label, home: h, away: a }) => /* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-[11px]",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "font-medium text-foreground w-6 text-left",
										children: h
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground flex-1 text-center",
										children: label
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground w-6 text-right",
										children: a
									})
								]
							}, label))]
						})
					]
				})
			]
		})
	});
}
function MatchCard({ match }) {
	const isLive = match.status === "live";
	const isFinished = match.status === "finished";
	const momentum = match.momentum ?? 0;
	const momentumLabel = Math.abs(momentum) < 15 ? "Balanced" : momentum > 0 ? match.home.short : match.away.short;
	return /* @__PURE__ */ jsxs(Link, {
		to: "/match/$id",
		params: { id: match.id },
		className: "group block rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-foreground/25",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: [/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: match.stage
				}), isLive ? /* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-1.5 text-foreground",
					children: [
						/* @__PURE__ */ jsx("span", { className: "live-dot" }),
						match.minute,
						"'"
					]
				}) : isFinished ? /* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-1 text-muted-foreground",
					children: [/* @__PURE__ */ jsx(CheckmarkCircle01Icon, {
						size: 10,
						strokeWidth: 2
					}), "FT"]
				}) : /* @__PURE__ */ jsx("span", { children: match.kickoff })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 space-y-2",
				children: [/* @__PURE__ */ jsx(TeamRow, {
					team: match.home,
					score: !match.status || match.status !== "upcoming" ? match.home.score : void 0
				}), /* @__PURE__ */ jsx(TeamRow, {
					team: match.away,
					score: !match.status || match.status !== "upcoming" ? match.away.score : void 0
				})]
			}),
			isLive && /* @__PURE__ */ jsxs("div", {
				className: "mt-3.5 space-y-1.5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between text-[10px] text-muted-foreground",
					children: [/* @__PURE__ */ jsx("span", {
						className: "uppercase tracking-widest",
						children: "Momentum"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-foreground",
						children: momentumLabel
					})]
				}), /* @__PURE__ */ jsx(MomentumBar, { value: momentum })]
			}),
			match.headline && !isLive && /* @__PURE__ */ jsx("p", {
				className: "mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground",
				children: match.headline
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground",
				children: [isFinished ? "View result" : "Open match", /* @__PURE__ */ jsx(ArrowRight01Icon, {
					size: 12,
					strokeWidth: 2
				})]
			})
		]
	});
}
function TeamRow({ team, score }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 items-center gap-2.5",
			children: [
				/* @__PURE__ */ jsx(Flag, {
					code: team.short,
					size: 14
				}),
				/* @__PURE__ */ jsx("span", {
					className: "truncate font-display text-[13px] font-semibold tracking-wide",
					children: team.name
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-[10px] uppercase tracking-widest text-muted-foreground",
					children: team.short
				})
			]
		}), /* @__PURE__ */ jsx("span", {
			className: "font-numeric text-[18px] font-bold leading-none",
			children: score !== void 0 ? score : /* @__PURE__ */ jsx("span", {
				className: "text-[12px] font-medium text-muted-foreground",
				children: "-"
			})
		})]
	});
}
function MomentumBar({ value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700 ease-out",
			style: { width: `${50 + (value ?? 0) / 2}%` }
		}), /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-1/2 w-px bg-border" })]
	});
}
//#endregion
export { MatchCard, MomentumBar, Home as component };
