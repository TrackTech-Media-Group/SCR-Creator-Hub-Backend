import type { Request, Response } from "express";
import Fuse from "fuse.js";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";
import { chunk } from "../../../lib/Utils.js";

@ApplyOptions({
	methods: "GET",
	middleware: ["admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { search: _search, type: _type, page: _page } = req.query;
		const search = typeof _search === "string" ? _search : "";
		const type = typeof _type === "string" && ["image", "video"].includes(_type) ? _type : "image";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);

		let footage = await this.server.prisma.footage.findMany({ where: { type }, include: { downloads: true } });
		if (search.length) {
			const search = new Fuse(footage, {
				keys: ["name", "size", "views"],
				isCaseSensitive: false
			});
			footage = search.search(search).map((sr) => sr.item);
		}

		const chunks = chunk(footage, 100);
		const chunkArr = (page > chunks.length ? chunks[chunks.length - 1] : chunks[page]) ?? [];

		res.send({ entries: chunkArr, pages: chunks.length });
	}
}