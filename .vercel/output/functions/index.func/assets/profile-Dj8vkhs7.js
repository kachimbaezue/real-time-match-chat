import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeft01Icon } from "hugeicons-react";
//#region src/routes/profile.tsx?tsr-split=component
function ProfileRedirect() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[13px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Not available"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-3 text-lg font-semibold text-foreground",
					children: "Profile coming soon"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-[13px] text-muted-foreground",
					children: "Focus on the matches for now."
				}),
				/* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: "mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background",
					children: [/* @__PURE__ */ jsx(ArrowLeft01Icon, {
						size: 14,
						strokeWidth: 2
					}), "Back to matches"]
				})
			]
		})
	});
}
//#endregion
export { ProfileRedirect as component };
