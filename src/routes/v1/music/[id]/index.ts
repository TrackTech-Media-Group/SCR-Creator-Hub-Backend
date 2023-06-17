import type { CreatorHubServer } from "#lib/Server.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const { id } = req.params;
		const durations = this.getMusicDurations(id);
		res.json(durations);
	}

	private getMusicDurations(tagId: string) {
		const tag = this.server.contentManager.tags.get(tagId);
		if (!tag) return [];

		const downloads = tag.content
			.filter((content) => content.isMusic())
			.map((content) => content.downloads.map((download) => download.name))
			.reduce((a, b) => [...a, ...b]);

		return [...new Set(downloads)];
	}
}
