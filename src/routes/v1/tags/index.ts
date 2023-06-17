import type { CreatorHubServer } from "#lib/Server.js";
import { CONTENT_TYPE_FILTER, type ContentTypeFilter } from "#lib/constants.js";
import { Utils } from "#lib/utils.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

@ApplyOptions<Route.Options>({ ratelimit: Utils.getRatelimitOptions({ windowMs: 1e3, max: 50 }) })
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const tags = [...this.server.contentManager.tags.values()];
		const { type } = this.parseQuery(req.query);

		res.json(tags.filter((tag) => tag.hasType(type)));
	}

	/**
	 * Returns a clean query object
	 * @param query The query to parse
	 */
	private parseQuery(query: Record<string, any>) {
		const { type: _type } = query;
		const type: ContentTypeFilter = typeof _type === "string" && CONTENT_TYPE_FILTER.includes(_type as any) ? (_type as any) : "all";

		return {
			type
		};
	}
}
