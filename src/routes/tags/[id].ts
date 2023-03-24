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
			function* getRandomItem() {
				for (let i = 0; i < 20; i++) {
					yield data[Math.floor(Math.random() * data.length)];
				}
			}

			const randomItems = [...getRandomItem()].filter(Boolean);

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
				preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
			})),
			pages: chunks.length
		});
	}
}
