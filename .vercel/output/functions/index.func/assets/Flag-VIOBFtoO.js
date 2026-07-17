import { jsx } from "react/jsx-runtime";
//#region src/lib/api.ts
var BASE_URL = "http://localhost:3001";
async function get(path) {
	const res = await fetch(`${BASE_URL}${path}`, { headers: { "Content-Type": "application/json" } });
	if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
	return res.json();
}
/** GET /matches/live — returns live, upcoming, and recent matches */
async function fetchHomeMatches() {
	return get("/matches/live");
}
/** GET /matches/:id — full match detail */
async function fetchMatch(id) {
	return get(`/matches/${id}`);
}
//#endregion
//#region src/components/Flag.tsx
var FLAGS = {
	ARG: {
		bars: [
			"#75AADB",
			"#FFFFFF",
			"#75AADB"
		],
		dir: "h"
	},
	BRA: {
		bars: [
			"#009C3B",
			"#FFDF00",
			"#002776"
		],
		dir: "h"
	},
	ESP: {
		bars: [
			"#AA151B",
			"#F1BF00",
			"#AA151B"
		],
		dir: "h"
	},
	FRA: {
		bars: [
			"#0055A4",
			"#FFFFFF",
			"#EF4135"
		],
		dir: "v"
	},
	ENG: {
		bars: [
			"#FFFFFF",
			"#CE1124",
			"#FFFFFF"
		],
		dir: "h"
	},
	GER: {
		bars: [
			"#000000",
			"#DD0000",
			"#FFCE00"
		],
		dir: "h"
	},
	POR: {
		bars: ["#046A38", "#DA291C"],
		dir: "v"
	},
	NED: {
		bars: [
			"#AE1C28",
			"#FFFFFF",
			"#21468B"
		],
		dir: "h"
	},
	ITA: {
		bars: [
			"#008C45",
			"#FFFFFF",
			"#CD212A"
		],
		dir: "v"
	},
	BEL: {
		bars: [
			"#000000",
			"#FDDA24",
			"#EF3340"
		],
		dir: "v"
	},
	USA: {
		bars: [
			"#B22234",
			"#FFFFFF",
			"#3C3B6E"
		],
		dir: "h"
	},
	MEX: {
		bars: [
			"#006847",
			"#FFFFFF",
			"#CE1126"
		],
		dir: "v"
	},
	MAR: {
		bars: [
			"#C1272D",
			"#006233",
			"#C1272D"
		],
		dir: "h"
	},
	JPN: {
		bars: [
			"#FFFFFF",
			"#BC002D",
			"#FFFFFF"
		],
		dir: "h"
	},
	KOR: {
		bars: [
			"#FFFFFF",
			"#CD2E3A",
			"#003478"
		],
		dir: "h"
	},
	AUS: {
		bars: [
			"#00008B",
			"#CC142B",
			"#00008B"
		],
		dir: "h"
	},
	SEN: {
		bars: [
			"#00853F",
			"#FDEF42",
			"#E31B23"
		],
		dir: "v"
	},
	URU: {
		bars: [
			"#FFFFFF",
			"#5EB6E4",
			"#FFFFFF"
		],
		dir: "h"
	},
	COL: {
		bars: [
			"#FCD116",
			"#003087",
			"#CE1126"
		],
		dir: "h"
	},
	ECU: {
		bars: [
			"#FFD100",
			"#003893",
			"#CE1126"
		],
		dir: "h"
	}
};
function Flag({ code, size = 20, className = "" }) {
	const spec = FLAGS[code] ?? {
		bars: [
			"#3f3f46",
			"#52525b",
			"#71717a"
		],
		dir: "h"
	};
	const dir = spec.dir ?? "h";
	return /* @__PURE__ */ jsx("div", {
		className: `overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/40 ${className}`,
		style: {
			width: size * 1.4,
			height: size,
			display: "flex",
			flexDirection: dir === "h" ? "column" : "row"
		},
		"aria-hidden": true,
		children: spec.bars.map((c, i) => /* @__PURE__ */ jsx("div", { style: {
			flex: 1,
			background: c
		} }, i))
	});
}
//#endregion
export { fetchHomeMatches as n, fetchMatch as r, Flag as t };
