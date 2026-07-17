import { t as Flag } from "./Flag-VIOBFtoO.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { io } from "socket.io-client";
//#region src/lib/socket.ts
/**
* Pulse Socket client
* Singleton socket.io connection to the backend.
* Components subscribe to match-specific events and clean up on unmount.
*/
var SOCKET_URL = "http://localhost:3001";
var _socket = null;
function getSocket() {
	if (typeof window === "undefined") throw new Error("Socket not available on server");
	if (!_socket) _socket = io(SOCKET_URL, {
		transports: ["websocket"],
		autoConnect: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 1e3
	});
	return _socket;
}
function safeOn(event, cb) {
	try {
		const s = getSocket();
		s.on(event, cb);
		return () => s.off(event, cb);
	} catch {
		return () => {};
	}
}
function onScoreUpdated(cb) {
	return safeOn("scoreUpdated", cb);
}
function onStatsUpdated(cb) {
	return safeOn("statsUpdated", cb);
}
function onTimelineUpdated(cb) {
	return safeOn("timelineUpdated", cb);
}
function onMomentumUpdated(cb) {
	return safeOn("momentumUpdated", cb);
}
function onMatchPulseUpdated(cb) {
	return safeOn("matchPulseUpdated", cb);
}
function onWinProbabilityUpdated(cb) {
	return safeOn("winProbabilityUpdated", cb);
}
function onJoinedNowUpdated(cb) {
	return safeOn("joinedNowUpdated", cb);
}
function onMatchFinished(cb) {
	return safeOn("matchFinished", cb);
}
//#endregion
//#region src/components/Scoreboard.tsx
function Scoreboard({ home, away, minute, status, kickoff, size = "md" }) {
	const isLive = status === "live";
	const isUpcoming = status === "upcoming";
	const sizes = {
		sm: {
			h: "h-9",
			code: "text-[10px]",
			score: "text-[14px]",
			flag: 12
		},
		md: {
			h: "h-11",
			code: "text-[11px]",
			score: "text-[18px]",
			flag: 14
		},
		lg: {
			h: "h-14",
			code: "text-[13px]",
			score: "text-[24px]",
			flag: 18
		}
	}[size];
	return /* @__PURE__ */ jsxs("div", {
		className: "inline-flex overflow-hidden rounded-md shadow-[0_0_0_1px_var(--color-border)]",
		children: [
			/* @__PURE__ */ jsx(TeamBlock, {
				code: home.short,
				flagSize: sizes.flag,
				h: sizes.h,
				codeSize: sizes.code
			}),
			/* @__PURE__ */ jsx("div", {
				className: `${sizes.h} flex min-w-[38px] items-center justify-center bg-black px-2 font-display font-bold text-white ${sizes.score} font-numeric`,
				children: isUpcoming ? "-" : home.score
			}),
			/* @__PURE__ */ jsx("div", {
				className: `${sizes.h} flex items-center justify-center bg-[#0a1f5c] px-3 text-white`,
				children: isLive ? /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ jsx("span", { className: "live-dot" }), /* @__PURE__ */ jsxs("span", {
						className: "font-display text-[11px] font-bold tracking-wider",
						children: [minute, "'"]
					})]
				}) : /* @__PURE__ */ jsx("span", {
					className: "font-display text-[10px] font-semibold uppercase tracking-widest",
					children: kickoff ?? "vs"
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: `${sizes.h} flex min-w-[38px] items-center justify-center bg-black px-2 font-display font-bold text-white ${sizes.score} font-numeric`,
				children: isUpcoming ? "-" : away.score
			}),
			/* @__PURE__ */ jsx(TeamBlock, {
				code: away.short,
				flagSize: sizes.flag,
				h: sizes.h,
				codeSize: sizes.code
			})
		]
	});
}
function TeamBlock({ code, flagSize, h, codeSize }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `${h} flex items-center gap-1.5 bg-white px-2.5 text-black`,
		children: [/* @__PURE__ */ jsx(Flag, {
			code,
			size: flagSize
		}), /* @__PURE__ */ jsx("span", {
			className: `font-display font-bold tracking-wider ${codeSize}`,
			children: code
		})]
	});
}
//#endregion
export { onMomentumUpdated as a, onTimelineUpdated as c, onMatchPulseUpdated as i, onWinProbabilityUpdated as l, onJoinedNowUpdated as n, onScoreUpdated as o, onMatchFinished as r, onStatsUpdated as s, Scoreboard as t };
