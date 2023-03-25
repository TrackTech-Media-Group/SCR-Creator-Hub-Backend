import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { id: tag } = req.params;
		const { preview: _preview, type: _type, page: _page } = req.query;

		const preview = _preview === "true" ? true : false;
		const type = typeof _type === "string" && ["video", "image"].includes(_type) ? _type : "image";
		const page = isNaN(Number(_page)) ? 0 : Number(_page);
		if (preview) {
			const data = this.server.data.footage.filter((f) => f.tagIds.includes(tag) && f.type === type);
			const randomItems = [] as typeof data;
			const max = data.length < 20 ? data.length : 20;

			for (let i = 0; i < max; i++) {
				let item = data[Math.floor(Math.random() * data.length)];
				while (data.includes(item)) item = data[Math.floor(Math.random() * data.length)];

				randomItems.push(item);
			}

			res.send(
				randomItems.map((footage) => ({
					name: footage.name,
					id: footage.id,
					preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
				}))
			);
			return;
		}

		const footage = this.server.data.footage.filter((f) => f.tagIds.includes(tag) && f.type === type);
		const chunks = _.chunk(footage, 100);
		const chunkArr = (page > chunks.length ? chunks[chunks.length - 1] : chunks[page]) ?? [];

		res.send({
			entries: chunkArr.filter(Boolean).map((footage) => ({
				name: footage.name,
				id: footage.id,
				preview: footage.preview || footage.downloads.find((d) => d.name.startsWith("HD"))?.url || footage.downloads[0].url
			})),
			pages: chunks.length
		});
	}
}
