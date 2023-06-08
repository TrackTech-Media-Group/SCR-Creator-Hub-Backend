import type { CreatorHubServer } from "#lib/Server.js";
import { CONTENT_TYPE_FILTER, type ContentTypeFilter } from "#lib/constants.js";
import MeasurePerformance from "#lib/decorators/MeasurePerformance.js";
import { Utils } from "#lib/utils.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import Fuse from "fuse.js";
import _ from "lodash";

export default class extends Route<CreatorHubServer> {
	public constructor() {
		super();

		const ratelimit = rateLimit(Utils.getRatelimitOptions({ windowMs: 5e3, max: 10 }));
		this.router.use(ratelimit);
	}

	@MeasurePerformance({ name: "Route#search(Methods.GET)" })
	public [methods.GET](req: Request, res: Response) {
		const query = this.cleanQuery(req.query);
		let content = this.getContent(query.type, query.tag);
		if (query.search) {
			const search = new Fuse(content, {
				keys: ["name", "id", "tagIds"],
				isCaseSensitive: false,
				threshold: 0.2
			});
			content = search.search(query.search).map((sr) => sr.item);
		}

		const chunks = _.chunk(content, 100);
		const chunkArr = (query.page > chunks.length ? chunks[chunks.length - 1] : chunks[query.page]) ?? [];

		res.send({
			entries: chunkArr.filter(Boolean).map((item) => item.toJSON()),
			pages: chunks.length
		});
	}

	/**
	 * Returns a filtered list of content with the provided type and tag
	 * @param type The type of content to get
	 * @param tag The optional tag you want to filter on
	 */
	private getContent(type: ContentTypeFilter, tag: string | null) {
		const content = [...this.server.contentManager.content.values()];
		return content.filter((item) => (tag ? item.tagIds.includes(tag) : true)).filter((item) => (type === "all" ? true : item.type === type));
	}

	/**
	 * Returns a clean object of required query
	 * @param query The query to clean
	 */
	private cleanQuery(query: Record<string, any>) {
		const { query: _search, tag: _tag, page: _page, type: __type } = query;
		const search = typeof _search === "string" ? _search : null;
		const tag = typeof _tag === "string" ? _tag : null;
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		const _type = typeof __type === "string" ? __type : "";
		const type = CONTENT_TYPE_FILTER.includes(_type as any) ? _type : "all";

		return {
			search,
			tag,
			page,
			type: type as ContentTypeFilter
		};
	}
}
