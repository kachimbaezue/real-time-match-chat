import { n as TopBar } from "./AppLayout-C6SHhWQy.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Notification03Icon } from "hugeicons-react";
//#region src/routes/notifications.tsx?tsr-split=component
function Notifications() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TopBar, { title: "Notifications" }), /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-10",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col items-center gap-3 py-16 text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card",
					children: /* @__PURE__ */ jsx(Notification03Icon, {
						size: 20,
						strokeWidth: 1.75,
						className: "text-muted-foreground"
					})
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] font-medium text-foreground",
					children: "No notifications yet"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted-foreground max-w-xs",
					children: "Goal alerts, momentum shifts, and AI updates from live matches will appear here."
				})
			]
		})
	})] });
}
//#endregion
export { Notifications as component };
