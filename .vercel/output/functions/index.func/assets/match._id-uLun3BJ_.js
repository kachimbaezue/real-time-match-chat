import { t as Flag } from "./Flag-VIOBFtoO.js";
import { t as MomentumBar } from "./routes-DkPkRuVB.js";
import { t as Route } from "./match._id-Yy9XdpjW.js";
import { a as onMomentumUpdated, c as onTimelineUpdated, i as onMatchPulseUpdated, l as onWinProbabilityUpdated, n as onJoinedNowUpdated, o as onScoreUpdated, r as onMatchFinished, s as onStatsUpdated, t as Scoreboard } from "./Scoreboard-D-PKXTn2.js";
import { n as MatchDetailSkeleton } from "./SkeletonLoader-BBMA5UuJ.js";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import ReactDOM from "react-dom";
import { ArrowDataTransferHorizontalIcon, ArrowLeft01Icon, ArrowRight01Icon, ChartLineData02Icon, CheckmarkCircle01Icon, CircleIcon, Clock01Icon, Flag01Icon, FlashIcon, FootballIcon, Location01Icon, PlayCircle02Icon, Share01Icon, Square01Icon, StopCircleIcon } from "hugeicons-react";
//#region src/components/PredictionRow.tsx
var tones = {
	primary: {
		bg: "bg-[color-mix(in_oklab,var(--color-success)_18%,var(--color-card))]",
		fg: "text-[color-mix(in_oklab,var(--color-success)_85%,white)]",
		bar: "bg-[color-mix(in_oklab,var(--color-success)_28%,transparent)]"
	},
	accent: {
		bg: "bg-[color-mix(in_oklab,#a78bfa_18%,var(--color-card))]",
		fg: "text-[#c9b6ff]",
		bar: "bg-[color-mix(in_oklab,#a78bfa_28%,transparent)]"
	},
	muted: {
		bg: "bg-[var(--color-elevated)]",
		fg: "text-foreground",
		bar: "bg-[color-mix(in_oklab,var(--color-foreground)_10%,transparent)]"
	},
	danger: {
		bg: "bg-[color-mix(in_oklab,var(--color-danger)_16%,var(--color-card))]",
		fg: "text-[color-mix(in_oklab,var(--color-danger)_80%,white)]",
		bar: "bg-[color-mix(in_oklab,var(--color-danger)_26%,transparent)]"
	},
	warning: {
		bg: "bg-[color-mix(in_oklab,var(--color-warning)_14%,var(--color-card))]",
		fg: "text-[color-mix(in_oklab,var(--color-warning)_85%,white)]",
		bar: "bg-[color-mix(in_oklab,var(--color-warning)_26%,transparent)]"
	}
};
function PredictionRow({ label, flagCode, percent, tone = "muted", onClick, suffix = "%" }) {
	const t = tones[tone];
	const clamped = Math.max(0, Math.min(100, percent));
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick,
		className: `relative flex w-full items-center justify-between overflow-hidden rounded-lg ${t.bg} px-3 py-2.5 text-left transition-transform hover:scale-[1.005] active:scale-[0.995]`,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: `absolute inset-y-0 left-0 ${t.bar} transition-[width] duration-700 ease-out`,
				style: { width: `${clamped}%` }
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative flex min-w-0 items-center gap-2",
				children: [flagCode && /* @__PURE__ */ jsx(Flag, {
					code: flagCode,
					size: 14
				}), /* @__PURE__ */ jsx("span", {
					className: "truncate text-[13px] font-medium text-foreground",
					children: label
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative flex items-center gap-1.5",
				children: [/* @__PURE__ */ jsxs("span", {
					className: `font-numeric text-[13px] font-semibold ${t.fg}`,
					children: [clamped.toFixed(0), suffix]
				}), /* @__PURE__ */ jsx(ArrowRight01Icon, {
					size: 14,
					strokeWidth: 2,
					className: t.fg
				})]
			})
		]
	});
}
//#endregion
//#region src/routes/match.$id.tsx?tsr-split=component
function MatchPage() {
	const loaderMatch = Route.useLoaderData();
	const [match, setMatch] = useState(loaderMatch);
	const isFinished = match.status === "finished";
	const [ready, setReady] = useState(false);
	useEffect(() => {
		setMatch(loaderMatch);
	}, [loaderMatch.id]);
	useEffect(() => {
		const t = setTimeout(() => setReady(true), 300);
		return () => clearTimeout(t);
	}, [match.id]);
	useEffect(() => {
		const id = match.id;
		const unsubs = [
			onScoreUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					home: {
						...m.home,
						score: p.homeScore
					},
					away: {
						...m.away,
						score: p.awayScore
					},
					minute: p.minute
				}));
			}),
			onStatsUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					stats: p.stats
				}));
			}),
			onTimelineUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					timeline: [p.event, ...m.timeline]
				}));
			}),
			onMomentumUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					momentum: p.momentum
				}));
			}),
			onMatchPulseUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					pulse: p.pulse,
					headline: p.headline
				}));
			}),
			onWinProbabilityUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					winProbability: p.winProbability
				}));
			}),
			onJoinedNowUpdated((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					joinedNow: p.joinedNow
				}));
			}),
			onMatchFinished((p) => {
				if (p.matchId !== id) return;
				setMatch((m) => ({
					...m,
					status: "finished",
					home: {
						...m.home,
						score: p.homeScore
					},
					away: {
						...m.away,
						score: p.awayScore
					},
					turningPoints: p.turningPoints
				}));
			})
		];
		return () => unsubs.forEach((fn) => fn());
	}, [match.id]);
	if (!ready) return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(MatchHeader, { match }), /* @__PURE__ */ jsx(MatchDetailSkeleton, {})] });
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(MatchHeader, { match }), /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-6xl px-4 py-4 pb-8 lg:px-8 lg:py-6",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-4 lg:grid-cols-[1fr_340px]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsx(ScoreboardCard, { match }),
					match.pulse.length > 0 && /* @__PURE__ */ jsx(MatchPulseCard, { match }),
					!isFinished && /* @__PURE__ */ jsx(WinProbabilityCard, { match }),
					match.momentum !== 0 && /* @__PURE__ */ jsx(MomentumCard, { match }),
					/* @__PURE__ */ jsx(StatsCard, { match }),
					isFinished && match.turningPoints && /* @__PURE__ */ jsx(TurningPointsCard, { match }),
					isFinished && /* @__PURE__ */ jsx(WinProbabilityCard, { match }),
					match.timeline.length > 0 && /* @__PURE__ */ jsx(TimelineCard, {
						events: match.timeline,
						match
					})
				]
			}), /* @__PURE__ */ jsxs("aside", {
				className: "space-y-4 lg:sticky lg:top-16 lg:h-fit",
				children: [match.joinedNow.length > 0 && /* @__PURE__ */ jsx(JoinedNowCard, { match }), /* @__PURE__ */ jsx(ReplayCard, { match })]
			})]
		})
	})] });
}
function MatchHeader({ match }) {
	const [mount, setMount] = useState(null);
	useEffect(() => {
		setMount(document.getElementById("header-mount"));
	}, []);
	const bar = /* @__PURE__ */ jsxs("div", {
		className: "flex h-13 items-center justify-between px-5 lg:px-6",
		style: { background: "var(--panel)" },
		children: [
			/* @__PURE__ */ jsxs(Link, {
				to: "/",
				className: "flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors",
				children: [/* @__PURE__ */ jsx(ArrowLeft01Icon, {
					size: 16,
					strokeWidth: 1.75
				}), "Matches"]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block",
				children: [
					match.stage,
					" · ",
					match.competition
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-1",
				children: /* @__PURE__ */ jsx(IconButton, {
					label: "Share",
					children: /* @__PURE__ */ jsx(Share01Icon, {
						size: 16,
						strokeWidth: 1.75
					})
				})
			})
		]
	});
	if (!mount) return null;
	return ReactDOM.createPortal(bar, mount);
}
function IconButton({ children, label }) {
	return /* @__PURE__ */ jsx("button", {
		"aria-label": label,
		className: "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--color-elevated)] hover:text-foreground transition-colors",
		children
	});
}
function ScoreboardCard({ match }) {
	const isLive = match.status === "live";
	const isFinished = match.status === "finished";
	return /* @__PURE__ */ jsxs("section", {
		className: "relative overflow-hidden rounded-2xl border border-border bg-card p-5 lg:p-8",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-5 flex items-center justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("img", {
						src: "/logo.png",
						alt: "",
						className: "h-5 w-5 object-contain opacity-80"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
						children: match.competition
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
					children: isLive ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", { className: "live-dot" }), /* @__PURE__ */ jsxs("span", {
						className: "text-foreground",
						children: [
							"LIVE · ",
							match.minute,
							"'"
						]
					})] }) : isFinished ? /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(CheckmarkCircle01Icon, {
							size: 11,
							strokeWidth: 2
						}), "Full-time"]
					}) : /* @__PURE__ */ jsx("span", { children: match.kickoff })
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex justify-center py-2",
				children: /* @__PURE__ */ jsx(Scoreboard, {
					home: match.home,
					away: match.away,
					minute: match.minute,
					status: match.status,
					size: "lg"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-5 flex items-center justify-between text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ jsx(TeamName, {
					team: match.home,
					align: "left"
				}), /* @__PURE__ */ jsx(TeamName, {
					team: match.away,
					align: "right"
				})]
			}),
			match.venue && /* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground",
				children: [/* @__PURE__ */ jsx(Location01Icon, {
					size: 10,
					strokeWidth: 2
				}), /* @__PURE__ */ jsx("span", { children: match.venue })]
			}),
			match.headline && /* @__PURE__ */ jsx("p", {
				className: "mx-auto mt-5 max-w-xl text-center text-[13px] leading-relaxed text-muted-foreground",
				children: match.headline
			})
		]
	});
}
function TeamName({ team, align }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`,
		children: [/* @__PURE__ */ jsx(Flag, {
			code: team.short,
			size: 12
		}), /* @__PURE__ */ jsx("span", {
			className: "font-display text-[12px] font-semibold uppercase tracking-wider text-foreground",
			children: team.name
		})]
	});
}
function MatchPulseCard({ match }) {
	const [activeIdx, setActiveIdx] = useState(0);
	const isFinished = match.status === "finished";
	useEffect(() => {
		if (match.pulse.length <= 1) return;
		const id = setInterval(() => setActiveIdx((i) => (i + 1) % match.pulse.length), 5e3);
		return () => clearInterval(id);
	}, [match.pulse.length]);
	return /* @__PURE__ */ jsxs("section", {
		className: "rounded-2xl border p-4 lg:p-5 relative overflow-hidden",
		style: {
			borderColor: "color-mix(in oklab, var(--color-border) 50%, var(--color-foreground) 25%)",
			background: "color-mix(in oklab, var(--color-card) 85%, var(--color-foreground) 4%)"
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10",
				style: { background: "radial-gradient(circle, var(--color-foreground), transparent 70%)" }
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative flex items-center justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "flex h-7 w-7 items-center justify-center rounded-lg",
						style: { background: "color-mix(in oklab, var(--color-foreground) 12%, transparent)" },
						children: /* @__PURE__ */ jsx(FootballIcon, {
							size: 14,
							strokeWidth: 1.75,
							className: "text-foreground"
						})
					}), /* @__PURE__ */ jsx("span", {
						className: "font-display text-[11px] font-bold uppercase tracking-[0.14em] text-foreground",
						children: "Match Pulse"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [!isFinished && /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/60",
						children: [/* @__PURE__ */ jsx("span", {
							className: "live-dot",
							style: {
								width: 5,
								height: 5
							}
						}), "Live"]
					}), /* @__PURE__ */ jsxs("span", {
						className: "rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
						children: ["AI · ", isFinished ? "final" : `${match.minute}'`]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "relative mt-4",
				children: /* @__PURE__ */ jsx("p", {
					className: "text-[15px] font-medium leading-relaxed text-foreground lg:text-[16px]",
					children: match.pulse[activeIdx]
				})
			}),
			match.pulse.length > 1 && /* @__PURE__ */ jsxs("div", {
				className: "mt-4 space-y-2 border-t border-border/60 pt-3",
				children: [match.pulse.map((line, i) => {
					if (i === activeIdx) return null;
					return /* @__PURE__ */ jsx("button", {
						onClick: () => setActiveIdx(i),
						className: "block w-full text-left text-[12px] leading-relaxed text-muted-foreground/70 hover:text-muted-foreground transition-colors",
						children: line
					}, i);
				}), /* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-1.5 pt-1",
					children: match.pulse.map((_, i) => /* @__PURE__ */ jsx("button", {
						onClick: () => setActiveIdx(i),
						className: "transition-all duration-300",
						"aria-label": `View insight ${i + 1}`,
						children: /* @__PURE__ */ jsx("span", {
							className: "block rounded-full transition-all duration-300",
							style: {
								width: i === activeIdx ? 16 : 5,
								height: 5,
								background: i === activeIdx ? "var(--color-foreground)" : "color-mix(in oklab, var(--color-foreground) 25%, transparent)"
							}
						})
					}, i))
				})]
			})
		]
	});
}
function MomentumCard({ match }) {
	const label = Math.abs(match.momentum) < 15 ? "Balanced" : match.momentum > 0 ? match.home.name : match.away.name;
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ jsx(SectionLabel, { children: "Momentum" }), /* @__PURE__ */ jsx("span", {
				className: "text-[12px] text-foreground",
				children: label
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-4",
			children: /* @__PURE__ */ jsx(Waveform, { value: match.momentum })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-2 flex items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground",
			children: [
				/* @__PURE__ */ jsx("span", { children: match.home.short }),
				/* @__PURE__ */ jsx(MomentumBar, { value: match.momentum }),
				/* @__PURE__ */ jsx("span", { children: match.away.short })
			]
		})
	] });
}
function Waveform({ value }) {
	const bars = 48;
	const bias = value / 100;
	return /* @__PURE__ */ jsx("div", {
		className: "flex h-12 items-center gap-[2px]",
		children: Array.from({ length: bars }, (_, i) => {
			const noise = .5 + .5 * (Math.sin(i * 1.3) * .5 + Math.cos(i * .7) * .3);
			const homeSide = 1 - i / (bars - 1);
			const emphasis = bias > 0 ? homeSide * bias : (1 - homeSide) * -bias;
			return Math.max(.15, Math.min(1, noise * .7 + emphasis * .9));
		}).map((h, i) => {
			const mid = bars / 2;
			const isHome = i < mid;
			const highlighted = value > 0 && isHome && i > mid - 16 || value < 0 && !isHome && i < 40;
			return /* @__PURE__ */ jsx("div", {
				className: "flex-1 rounded-full transition-all duration-500",
				style: {
					height: `${h * 100}%`,
					background: highlighted ? "var(--color-foreground)" : "color-mix(in oklab, var(--color-foreground) 22%, transparent)"
				}
			}, i);
		})
	});
}
function WinProbabilityCard({ match }) {
	const [home, draw, away] = match.winProbability;
	const sorted = [...[
		{
			label: `${match.home.name} win`,
			flagCode: match.home.short,
			pct: home,
			tone: "primary"
		},
		{
			label: "Draw",
			pct: draw,
			tone: "muted",
			flagCode: void 0
		},
		{
			label: `${match.away.name} win`,
			flagCode: match.away.short,
			pct: away,
			tone: "accent"
		}
	]].sort((a, b) => b.pct - a.pct);
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ jsx(ChartLineData02Icon, {
				size: 14,
				strokeWidth: 1.75
			}), /* @__PURE__ */ jsx(SectionLabel, { children: "Win probability" })]
		}), /* @__PURE__ */ jsx("span", {
			className: "text-[10px] text-muted-foreground",
			children: match.status === "finished" ? "Final model" : "Live model"
		})]
	}), /* @__PURE__ */ jsx("div", {
		className: "mt-3 space-y-1.5",
		children: sorted.map((r) => /* @__PURE__ */ jsx(PredictionRow, {
			label: r.label,
			flagCode: r.flagCode,
			percent: r.pct,
			tone: r.tone
		}, r.label))
	})] });
}
function StatsCard({ match }) {
	const rows = [
		{
			label: "Possession",
			values: match.stats.possession,
			format: (n) => `${n}%`
		},
		{
			label: "Shots",
			values: match.stats.shots
		},
		{
			label: "Shots on target",
			values: match.stats.shotsOnTarget
		},
		{
			label: "Corners",
			values: match.stats.corners
		},
		{
			label: "Fouls",
			values: match.stats.fouls
		},
		{
			label: "Expected goals",
			values: match.stats.xg,
			format: (n) => n.toFixed(1)
		}
	];
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsx(SectionLabel, { children: "Statistics" }),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
			children: [/* @__PURE__ */ jsx("span", { children: match.home.short }), /* @__PURE__ */ jsx("span", { children: match.away.short })]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-2 space-y-3",
			children: rows.map((r) => /* @__PURE__ */ jsx(StatRow, {
				label: r.label,
				values: r.values,
				format: r.format
			}, r.label))
		})
	] });
}
function StatRow({ label, values, format }) {
	const [a, b] = values;
	const aPct = a / (a + b || 1) * 100;
	const fmt = format ?? ((n) => String(n));
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		className: "mb-1 flex items-center justify-between font-numeric text-[12px]",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-foreground",
				children: fmt(a)
			}),
			/* @__PURE__ */ jsx("span", {
				className: "text-[9px] font-semibold uppercase tracking-widest text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ jsx("span", {
				className: "text-foreground",
				children: fmt(b)
			})
		]
	}), /* @__PURE__ */ jsxs("div", {
		className: "flex h-1 gap-1",
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]",
			children: /* @__PURE__ */ jsx("div", {
				className: "ml-auto h-full bg-foreground transition-[width] duration-500",
				style: { width: `${aPct}%` }
			})
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 overflow-hidden rounded-full bg-[var(--color-elevated)]",
			children: /* @__PURE__ */ jsx("div", {
				className: "h-full bg-foreground transition-[width] duration-500",
				style: { width: `${100 - aPct}%` }
			})
		})]
	})] });
}
function TurningPointsCard({ match }) {
	if (!match.turningPoints?.length) return null;
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-1.5",
		children: [/* @__PURE__ */ jsx(FlashIcon, {
			size: 14,
			strokeWidth: 1.75
		}), /* @__PURE__ */ jsx(SectionLabel, { children: "How the match changed" })]
	}), /* @__PURE__ */ jsx("ol", {
		className: "mt-3 space-y-3",
		children: match.turningPoints.map((point, i) => /* @__PURE__ */ jsxs("li", {
			className: "flex gap-3 text-[13px] leading-relaxed",
			children: [/* @__PURE__ */ jsx("span", {
				className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] font-numeric text-[10px] font-bold text-muted-foreground",
				children: i + 1
			}), /* @__PURE__ */ jsx("span", {
				className: "text-foreground/90",
				children: point
			})]
		}, i))
	})] });
}
function JoinedNowCard({ match }) {
	const isFinished = match.status === "finished";
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ jsx(Clock01Icon, {
				size: 14,
				strokeWidth: 1.75
			}), /* @__PURE__ */ jsx(SectionLabel, { children: isFinished ? "Match summary" : "If you joined now" })]
		}),
		!isFinished && /* @__PURE__ */ jsxs("p", {
			className: "mt-2 text-[11px] text-muted-foreground",
			children: [
				"You joined in the ",
				match.minute,
				/* @__PURE__ */ jsx("sup", { children: "th" }),
				" minute. Here's what you missed."
			]
		}),
		/* @__PURE__ */ jsx("ul", {
			className: "mt-3 space-y-2.5",
			children: match.joinedNow.map((line, i) => /* @__PURE__ */ jsxs("li", {
				className: "flex gap-2.5 text-[12px] leading-relaxed",
				children: [/* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1 w-1 flex-none rounded-full bg-muted-foreground" }), /* @__PURE__ */ jsx("span", {
					className: "text-foreground/90",
					children: line
				})]
			}, i))
		})
	] });
}
function TimelineCard({ events, match }) {
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(SectionLabel, { children: "Timeline" }), /* @__PURE__ */ jsx("ol", {
		className: "mt-4 space-y-3.5",
		children: events.map((e, i) => /* @__PURE__ */ jsx(TimelineRow, {
			event: e,
			match,
			isLast: i === events.length - 1
		}, i))
	})] });
}
function TimelineRow({ event, match, isLast }) {
	const teamName = event.team === "home" ? match.home.name : event.team === "away" ? match.away.name : "";
	const Icon = eventIcon(event.type);
	const tone = eventTone(event.type);
	return /* @__PURE__ */ jsxs("li", {
		className: "animate-fade-up grid grid-cols-[48px_24px_1fr] items-start gap-2.5",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "pt-0.5 font-numeric text-[12px] text-muted-foreground",
				children: event.type === "kickoff" && event.minute === 0 ? "KO" : `${event.minute}'`
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative flex flex-col items-center",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background",
					style: { color: tone },
					children: /* @__PURE__ */ jsx(Icon, {
						size: 10,
						strokeWidth: 2
					})
				}), !isLast && /* @__PURE__ */ jsx("div", {
					className: "mt-1 w-px flex-1 bg-border",
					style: { minHeight: 18 }
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "pb-1.5",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-[12px] font-semibold",
					children: event.label
				}), /* @__PURE__ */ jsx("div", {
					className: "text-[10px] text-muted-foreground",
					children: [teamName, event.detail].filter(Boolean).join(" · ")
				})]
			})
		]
	});
}
function eventIcon(type) {
	switch (type) {
		case "goal": return CircleIcon;
		case "yellow":
		case "red": return Square01Icon;
		case "sub": return ArrowDataTransferHorizontalIcon;
		case "momentum": return FlashIcon;
		case "penalty": return Flag01Icon;
		case "fulltime": return CheckmarkCircle01Icon;
		default: return PlayCircle02Icon;
	}
}
function eventTone(type) {
	switch (type) {
		case "goal": return "var(--color-success)";
		case "yellow": return "var(--color-warning)";
		case "red": return "var(--color-danger)";
		case "fulltime": return "var(--color-success)";
		case "momentum": return "var(--color-foreground)";
		default: return "var(--color-muted-foreground)";
	}
}
function ReplayCard({ match }) {
	const isFinished = match.status === "finished";
	const [replayState, setReplayState] = useState("idle");
	const [replayMinute, setReplayMinute] = useState(0);
	const [replayHomeScore, setReplayHomeScore] = useState(0);
	const [replayAwayScore, setReplayAwayScore] = useState(0);
	const [replayEvents, setReplayEvents] = useState([]);
	const intervalRef = useRef(null);
	const sortedTimeline = [...match.timeline].reverse();
	const finalMinute = sortedTimeline[sortedTimeline.length - 1]?.minute ?? 90;
	function startReplay() {
		setReplayMinute(0);
		setReplayHomeScore(0);
		setReplayAwayScore(0);
		setReplayEvents([]);
		setReplayState("playing");
		let currentMinute = 0;
		let homeScore = 0;
		let awayScore = 0;
		const capturedEvents = [];
		intervalRef.current = setInterval(() => {
			currentMinute += 1;
			const fired = sortedTimeline.filter((e) => e.minute === currentMinute);
			for (const e of fired) {
				capturedEvents.push(e);
				if (e.type === "goal") {
					if (e.team === "home") homeScore += 1;
					else if (e.team === "away") awayScore += 1;
				}
			}
			setReplayMinute(currentMinute);
			setReplayHomeScore(homeScore);
			setReplayAwayScore(awayScore);
			setReplayEvents([...capturedEvents]);
			if (currentMinute >= finalMinute) {
				clearInterval(intervalRef.current);
				setReplayState("done");
			}
		}, Math.max(30, Math.round(1500 / Math.max(finalMinute, 1))));
	}
	function stopReplay() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setReplayState("idle");
	}
	useEffect(() => () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
	}, []);
	if (!isFinished) return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
				size: 14,
				strokeWidth: 1.75
			}), /* @__PURE__ */ jsx(SectionLabel, { children: "Match replay" })]
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-2 text-[12px] leading-relaxed text-muted-foreground",
			children: "Available after full-time. Watch the entire match unfold in 60 seconds with live score, events, and AI insights."
		}),
		/* @__PURE__ */ jsxs("button", {
			disabled: true,
			className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground opacity-50 cursor-not-allowed",
			children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
				size: 13,
				strokeWidth: 2
			}), "Replay unlocks at full-time"]
		})
	] });
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
					size: 14,
					strokeWidth: 1.75
				}), /* @__PURE__ */ jsx(SectionLabel, { children: "Match replay" })]
			}), replayState === "playing" && /* @__PURE__ */ jsxs("span", {
				className: "flex items-center gap-1 text-[10px] font-semibold text-foreground",
				children: [
					/* @__PURE__ */ jsx("span", { className: "live-dot" }),
					replayMinute,
					"'"
				]
			})]
		}),
		replayState === "idle" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
			className: "mt-2 text-[12px] leading-relaxed text-muted-foreground",
			children: "Watch the entire match story unfold in 90 seconds — goals, cards, and momentum shifts play out in real time."
		}), /* @__PURE__ */ jsxs("button", {
			onClick: startReplay,
			className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90",
			children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
				size: 13,
				strokeWidth: 2
			}), "Watch replay"]
		})] }),
		(replayState === "playing" || replayState === "done") && /* @__PURE__ */ jsxs("div", {
			className: "mt-3 space-y-3",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between rounded-xl bg-[var(--color-elevated)] px-4 py-3",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Flag, {
								code: match.home.short,
								size: 14
							}), /* @__PURE__ */ jsx("span", {
								className: "font-display text-[13px] font-bold",
								children: match.home.short
							})]
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "font-numeric text-[24px] font-bold tabular-nums",
							children: [
								replayHomeScore,
								" – ",
								replayAwayScore
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-[13px] font-bold",
								children: match.away.short
							}), /* @__PURE__ */ jsx(Flag, {
								code: match.away.short,
								size: 14
							})]
						})
					]
				}),
				replayEvents.length > 0 && /* @__PURE__ */ jsx("div", {
					className: "max-h-40 space-y-1.5 overflow-y-auto",
					children: [...replayEvents].reverse().slice(0, 6).map((e, i) => {
						const tone = eventTone(e.type);
						const Icon = eventIcon(e.type);
						return /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 text-[11px]",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "w-8 shrink-0 font-numeric text-muted-foreground",
									children: [e.minute, "'"]
								}),
								/* @__PURE__ */ jsx(Icon, {
									size: 10,
									strokeWidth: 2,
									style: {
										color: tone,
										flexShrink: 0
									}
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-foreground",
									children: e.label
								}),
								e.detail && /* @__PURE__ */ jsxs("span", {
									className: "text-muted-foreground",
									children: ["· ", e.detail]
								})
							]
						}, i);
					})
				}),
				replayState === "done" ? /* @__PURE__ */ jsxs("button", {
					onClick: startReplay,
					className: "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-foreground hover:bg-[var(--color-elevated)] transition-colors",
					children: [/* @__PURE__ */ jsx(PlayCircle02Icon, {
						size: 13,
						strokeWidth: 2
					}), "Watch again"]
				}) : /* @__PURE__ */ jsxs("button", {
					onClick: stopReplay,
					className: "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-[var(--color-elevated)] transition-colors",
					children: [/* @__PURE__ */ jsx(StopCircleIcon, {
						size: 13,
						strokeWidth: 2
					}), "Stop replay"]
				})
			]
		})
	] });
}
function Card({ children, highlight }) {
	return /* @__PURE__ */ jsx("section", {
		className: `rounded-2xl border bg-card p-4 lg:p-5 ${highlight ? "border-[color-mix(in_oklab,var(--color-border)_60%,var(--color-foreground)_30%)]" : "border-border"}`,
		children
	});
}
function SectionLabel({ children }) {
	return /* @__PURE__ */ jsx("span", {
		className: "font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
		children
	});
}
//#endregion
export { MatchPage as component };
