import type { Request, Response } from "express";
import Fuse from "fuse.js";
import { ApiRoute, ApplyOptions } from "../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { query: _search, tag: _tag, page: _page, type: __type } = req.query;
		const searchQ = typeof _search === "string" ? _search : "";
		const tag = typeof _tag === "string" ? _tag : "";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		const _type = typeof __type === "string" ? __type : "";
		const type = ["image", "video", "both"].includes(_type) ? _type : "both";

		let footage = this.server.data.footage
			.filter((f) => (tag.length ? f.tagIds.includes(tag) : true))
			.filter((f) => (type === "both" ? true : f.type === type));
		if (searchQ.length) {
			const search = new Fuse(footage, {
				keys: ["name", "useCases", "tagIds"],
				isCaseSensitive: false
			});
			footage = search.search(searchQ).map((sr) => sr.item);
		}

		const chunks = _.chunk(footage, 100);
		const chunkArr = (page > chunks.length ? chunks[chunks.length - 1] : chunks[page]) ?? [];

		res.send({
			entries: chunkArr.filter(Boolean).map((f) => ({
				name: f.name,
				id: f.id,
				type: f.type,
				preview: f.preview || (f.downloads.find((d) => d.name.startsWith("HD")) ?? f.downloads[0]).url
			})),
			pages: chunks.length
		});
	}
}
