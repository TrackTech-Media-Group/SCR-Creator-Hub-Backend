import type { CreatorHubServer } from "#lib/Server.js";
import { Utils } from "#lib/utils.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

export default class extends Route<CreatorHubServer> {
	public constructor() {
		super();

		const ratelimit = rateLimit(Utils.getRatelimitOptions({ windowMs: 5e3, max: 10 }));
		this.router.use(ratelimit);
	}

	public [methods.GET](req: Request, res: Response) {
		const tags = [...this.server.contentManager.tags.values()];
		res.set("Cache-Control", "public, max-age=3600").json(tags.map((tag) => tag.toJSON()));
	}
}
