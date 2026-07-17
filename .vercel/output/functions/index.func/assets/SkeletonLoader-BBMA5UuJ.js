import { jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/SkeletonLoader.tsx
function Skeleton({ className }) {
	return /* @__PURE__ */ jsx("div", {
		"aria-hidden": true,
		className: cn("rounded-md animate-pulse", "bg-[color-mix(in_oklab,var(--color-elevated)_80%,var(--color-border)_20%)]", className)
	});
}
function MatchCardSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-3.5 space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-24" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-12" })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-2.5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-[14px] w-[20px] rounded-[3px]" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20" })]
					}), /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-5" })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-[14px] w-[20px] rounded-[3px]" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24" })]
					}), /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-5" })]
				})]
			}),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-1.5 w-full rounded-full" }),
			/* @__PURE__ */ jsx("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-16" })
			})
		]
	});
}
function SectionSkeleton({ rows = 2 }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-3 space-y-3",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-3 rounded" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-16" })]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-1 gap-2.5 md:grid-cols-2",
			children: Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsx(MatchCardSkeleton, {}, i))
		})]
	});
}
function HeroSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-4 lg:p-6 space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2 w-2 rounded-full" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-28" })]
			}),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-14 w-64 rounded-md" }),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full max-w-sm" }),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-3/4 max-w-xs" })
		]
	});
}
function MatchDetailSkeleton() {
	return /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-6xl px-4 py-4 pb-8 lg:px-8 lg:py-6",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-4 lg:grid-cols-[1fr_340px]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "rounded-xl border border-border bg-card p-5 lg:p-8 space-y-5",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-36 rounded-full" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20" })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex justify-center",
								children: /* @__PURE__ */ jsx(Skeleton, { className: "h-14 w-72 rounded-md" })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24" })]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-24" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-20" })]
							}),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-full" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-5/6" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-4/6" })
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-28" }), [
							100,
							70,
							55
						].map((w, i) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20 shrink-0" }),
								/* @__PURE__ */ jsx(Skeleton, {
									className: `h-2 rounded-full`,
									style: { width: `${w}%` }
								}),
								/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-8 shrink-0" })
							]
						}, i))]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-20" }), Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [
									/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-8" }),
									/* @__PURE__ */ jsx(Skeleton, { className: "h-2 w-20" }),
									/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-8" })
								]
							}), /* @__PURE__ */ jsx(Skeleton, { className: "h-1 w-full rounded-full" })]
						}, i))]
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3",
					children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-32" }), Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex gap-2.5",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" }), /* @__PURE__ */ jsxs("div", {
							className: "flex-1 space-y-1.5",
							children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-3/4" })]
						})]
					}, i))]
				}), /* @__PURE__ */ jsxs("div", {
					className: "rounded-xl border border-border bg-card p-4 lg:p-5 space-y-3",
					children: [
						/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-24" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-full" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-5/6" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-full rounded-md mt-1" })
					]
				})]
			})]
		})
	});
}
function RecentCardSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-4 space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-32" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-20" })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 items-center gap-2.5",
						children: [
							/* @__PURE__ */ jsx(Skeleton, { className: "h-[18px] w-[25px] rounded-[3px]" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-20 flex-1" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-6" })
						]
					}),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-10 rounded-md shrink-0" }),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 items-center gap-2.5 flex-row-reverse",
						children: [
							/* @__PURE__ */ jsx(Skeleton, { className: "h-[18px] w-[25px] rounded-[3px]" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-20 flex-1" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-6" })
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full" }),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-4/5" }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between pt-1",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-24" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-20" })]
			})
		]
	});
}
function UpcomingCardSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-4 space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-28" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-20" })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 items-center gap-2.5",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-[20px] w-[28px] rounded-[3px]" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-24" })]
					}),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-6 shrink-0" }),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 items-center gap-2.5 flex-row-reverse",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-[20px] w-[28px] rounded-[3px]" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-24" })]
					})
				]
			}),
			/* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-36" })
		]
	});
}
//#endregion
export { UpcomingCardSkeleton as a, SectionSkeleton as i, MatchDetailSkeleton as n, RecentCardSkeleton as r, HeroSkeleton as t };
