import type { Request, Response } from "express";
import Fuse from "fuse.js";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: ["admin-auth"]
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { search: _search, type: _type, page: _page } = req.query;
		const searchQ = typeof _search === "string" ? _search : "";
		const type = typeof _type === "string" && ["image", "video"].includes(_type) ? _type : "image";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		let footage = this.server.data.footage.filter((f) => f.type === type);
		if (searchQ.length) {
			const search = new Fuse(footage, {
				keys: ["name", "useCases", "tagIds"],
				isCaseSensitive: false
			});
			footage = search.search(searchQ).map((sr) => sr.item);
		}

		const chunks = _.chunk(footage, 100);
		const chunkArr = (page > chunks.length ? chunks[chunks.length - 1] : chunks[page]) ?? [];

		res.send({ entries: chunkArr, pages: chunks.length });
	}
}
