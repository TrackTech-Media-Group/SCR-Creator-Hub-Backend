import type { CreatorHubServer } from "#lib/Server.js";
import { CONTENT_TYPE_FILTER, type ContentTypeFilter } from "#lib/constants.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { Utils } from "#lib/utils.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";

@ApplyOptions<Route.Options>({ ratelimit: Utils.getRatelimitOptions({ windowMs: 5e3, max: 10 }) })
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction) {
		const { tag: tagId } = req.params;
		const { type, preview, page } = this.parseQuery(req.query);

		const tag = this.server.contentManager.tags.get(tagId);
		if (!tag) {
			const notFoundError = new ApiError(HttpStatusCode.NotFound, { tag: `The tag "${tag}" does not exist` });
			return next(notFoundError);
		}

		if (preview) {
			const previewItems = tag.getRandomContent(12, type);
			res.json(previewItems);
			return;
		}

		const filteredContent = tag.getFiltered(type);
		const chunks = _.chunk(filteredContent, 100);
		const chunk = page > chunks.length || page <= 0 ? chunks[0] : chunks[page - 1];

		res.json({ entries: chunk, pages: chunks.length });
	}

	/**
	 * Returns a clean query object
	 * @param query The query to parse
	 */
	private parseQuery(query: Record<string, any>) {
		const { preview: _preview, type: _type, page: _page } = query;

		const preview = _preview === "true" ? true : false;
		const type: ContentTypeFilter = typeof _type === "string" && CONTENT_TYPE_FILTER.includes(_type as any) ? (_type as any) : "all";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		return {
			type,
			page,
			preview
		};
	}
}
