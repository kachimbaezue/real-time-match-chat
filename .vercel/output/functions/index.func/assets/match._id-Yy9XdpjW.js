import { r as fetchMatch } from "./Flag-VIOBFtoO.js";
import { createFileRoute, lazyRouteComponent, notFound } from "@tanstack/react-router";
//#region src/routes/match.$id.tsx
var $$splitNotFoundComponentImporter = () => import("./match._id-DnJbMoiC.js");
var $$splitComponentImporter = () => import("./match._id-uLun3BJ_.js");
var Route = createFileRoute("/match/$id")({
	loader: async ({ params }) => {
		try {
			return await fetchMatch(params.id);
		} catch {
			throw notFound();
		}
	},
	head: ({ loaderData: m }) => ({ meta: [{ title: m ? `${m.home.name} ${m.home.score}–${m.away.score} ${m.away.name} — Pulse` : "Match — Pulse" }, {
		name: "description",
		content: m?.headline ?? "Live football insights from Pulse."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
//#endregion
export { Route as t };
