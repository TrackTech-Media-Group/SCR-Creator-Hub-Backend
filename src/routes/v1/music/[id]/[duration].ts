import type { CreatorHubServer } from "#lib/Server.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const { id, duration } = req.params;
		const content = this.getMusicContent(id, duration);
		res.json(content);
	}

	private getMusicContent(tagId: string, duration: string) {
		const tag = this.server.contentManager.tags.get(tagId);
		if (!tag) return [];

		const content = tag.content
			.filter((content) => content.isMusic())
			.filter((content) => content.downloads.some((download) => download.name === duration));

		return content;
	}
}
