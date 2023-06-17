import type { CreatorHubServer } from "#lib/Server.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const tags = this.getMusicTags();
		res.json(tags);
	}

	private getMusicTags() {
		const tags = [...this.server.contentManager.tags.values()];
		return tags.filter((tag) => Boolean(tag.getStats().music));
	}
}
