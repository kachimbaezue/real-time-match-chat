import { t as AppLayout } from "./AppLayout-C6SHhWQy.js";
import { n as Route$9 } from "./routes-DkPkRuVB.js";
import { t as Route$10 } from "./match._id-Yy9XdpjW.js";
import { useEffect, useState } from "react";
import { HeadContent, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//#region src/styles.css?url
var styles_default = "/assets/styles-BFQvze4V.css";
//#endregion
//#region src/components/Preloader.tsx
function Preloader() {
	const [phase, setPhase] = useState("visible");
	useEffect(() => {
		const t1 = setTimeout(() => setPhase("fading"), 2e3);
		const t2 = setTimeout(() => setPhase("gone"), 2600);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, []);
	if (phase === "gone") return null;
	return /* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-[999] transition-opacity duration-500 ${phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"}`,
		"aria-hidden": true,
		children: /* @__PURE__ */ jsx("video", {
			autoPlay: true,
			muted: true,
			playsInline: true,
			loop: true,
			className: "h-full w-full object-cover",
			src: "/preloader.mp4"
		})
	});
}
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[13px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-3 text-lg font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-[13px] text-muted-foreground",
					children: "The page you're looking for doesn't exist."
				}),
				/* @__PURE__ */ jsx("a", {
					href: "/",
					className: "mt-6 inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background",
					children: "Go home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-lg font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-[13px] text-muted-foreground",
					children: "Something went wrong. Try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Pulse — Feel the match" },
			{
				name: "description",
				content: "Pulse is an AI-powered second-screen companion that explains what's really happening in a football match in real time."
			},
			{
				property: "og:title",
				content: "Pulse — Feel the match"
			},
			{
				property: "og:description",
				content: "Live match insights that turn stats into stories. Understand any football match in five seconds."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "theme-color",
				content: "#09090B"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@500;600;700;800&family=Geist+Mono:wght@400;500&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		className: "dark",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ jsx(Preloader, {}), /* @__PURE__ */ jsx(AppLayout, { children: /* @__PURE__ */ jsx(Outlet, {}) })]
	});
}
//#endregion
//#region src/routes/upcoming.tsx
var $$splitComponentImporter$6 = () => import("./upcoming-DG-cC5iO.js");
var Route$7 = createFileRoute("/upcoming")({
	head: () => ({ meta: [{ title: "Upcoming — Pulse" }, {
		name: "description",
		content: "Upcoming football matches."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
//#endregion
//#region src/routes/sitemap[.]xml.ts
var BASE_URL = "";
var Route$6 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
		{
			path: "/",
			changefreq: "always",
			priority: "1.0"
		},
		{
			path: "/live",
			changefreq: "always",
			priority: "0.9"
		},
		{
			path: "/explore",
			changefreq: "daily",
			priority: "0.6"
		},
		{
			path: "/notifications",
			changefreq: "daily",
			priority: "0.4"
		},
		{
			path: "/profile",
			changefreq: "monthly",
			priority: "0.3"
		}
	].map((e) => `  <url><loc>${BASE_URL}${e.path}</loc>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`).join("\n")}\n</urlset>`;
	return new Response(xml, { headers: {
		"Content-Type": "application/xml",
		"Cache-Control": "public, max-age=3600"
	} });
} } } });
//#endregion
//#region src/routes/recent.tsx
var $$splitComponentImporter$5 = () => import("./recent-D4n1VTI7.js");
var Route$5 = createFileRoute("/recent")({
	head: () => ({ meta: [{ title: "Recent — Pulse" }, {
		name: "description",
		content: "Recently finished football matches."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/profile.tsx
var $$splitComponentImporter$4 = () => import("./profile-Dj8vkhs7.js");
var Route$4 = createFileRoute("/profile")({
	head: () => ({ meta: [{ title: "Pulse" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/notifications.tsx
var $$splitComponentImporter$3 = () => import("./notifications-BeBPJQew.js");
var Route$3 = createFileRoute("/notifications")({
	head: () => ({ meta: [{ title: "Notifications — Pulse" }, {
		name: "description",
		content: "Momentum shifts, goals, and AI updates from your matches."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/live.tsx
var $$splitComponentImporter$2 = () => import("./live-BnMtWJjB.js");
var Route$2 = createFileRoute("/live")({
	head: () => ({ meta: [{ title: "Live — Pulse" }, {
		name: "description",
		content: "All football matches happening right now."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/hot.tsx
var $$splitComponentImporter$1 = () => import("./hot-CfwKSIYG.js");
var Route$1 = createFileRoute("/hot")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/routes/explore.tsx
var $$splitComponentImporter = () => import("./explore-CVfJQzHL.js");
var Route = createFileRoute("/explore")({
	head: () => ({ meta: [{ title: "Explore — Pulse" }, {
		name: "description",
		content: "Browse teams and fixtures."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var UpcomingRoute = Route$7.update({
	id: "/upcoming",
	path: "/upcoming",
	getParentRoute: () => Route$8
});
var SitemapDotxmlRoute = Route$6.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$8
});
var RecentRoute = Route$5.update({
	id: "/recent",
	path: "/recent",
	getParentRoute: () => Route$8
});
var ProfileRoute = Route$4.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$8
});
var NotificationsRoute = Route$3.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$8
});
var LiveRoute = Route$2.update({
	id: "/live",
	path: "/live",
	getParentRoute: () => Route$8
});
var HotRoute = Route$1.update({
	id: "/hot",
	path: "/hot",
	getParentRoute: () => Route$8
});
var ExploreRoute = Route.update({
	id: "/explore",
	path: "/explore",
	getParentRoute: () => Route$8
});
var rootRouteChildren = {
	IndexRoute: Route$9.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$8
	}),
	ExploreRoute,
	HotRoute,
	LiveRoute,
	NotificationsRoute,
	ProfileRoute,
	RecentRoute,
	SitemapDotxmlRoute,
	UpcomingRoute,
	MatchIdRoute: Route$10.update({
		id: "/match/$id",
		path: "/match/$id",
		getParentRoute: () => Route$8
	})
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
