import type { CreatorHubServer } from "#lib/Server.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

@ApplyOptions<Route.Options>({ middleware: [[methods.GET, "internal-api"]] })
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const content = this.server.contentManager.getRandomContent(12);
		res.set("Cache-Control", "public, max-age=3600").json(content);
	}
}
