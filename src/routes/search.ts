import type { Request, Response } from "express";
import Fuse from "fuse.js";
import { ApiRoute, ApplyOptions } from "../lib/Api/index.js";
import { chunk } from "../lib/Utils.js";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { query: _search, page: _page } = req.query;
		const searchQ = typeof _search === "string" ? _search : "";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		let footage = await this.server.prisma.footage.findMany({ include: { downloads: true } });
		if (searchQ.length) {
			const search = new Fuse(footage, {
				keys: ["name", "useCases", "tagIds"],
				isCaseSensitive: false
			});
			footage = search.search(searchQ).map((sr) => sr.item);
		}

		const chunks = chunk(footage, 100);
		const chunkArr = (page > chunks.length ? chunks[chunks.length - 1] : chunks[page]) ?? [];

		res.send({
			entries: chunkArr.filter(Boolean).map((f) => ({
				name: f.name,
				id: f.id,
				type: f.type,
				preview: (f.downloads.find((d) => d.name.startsWith("HD")) ?? f.downloads[0]).url
			})),
			pages: chunks.length
		});
	}
}