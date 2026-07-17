import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import "hugeicons-react";
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-CYHOTmvr.js");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Live matches — Pulse" }, {
		name: "description",
		content: "Every live World Cup match with AI insights that explain the state of play in seconds."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
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
export { Route as n, MomentumBar as t };
