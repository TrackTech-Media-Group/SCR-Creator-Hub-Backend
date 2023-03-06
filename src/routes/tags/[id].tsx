import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { id: tag } = req.params;
		const { preview: _preview, type: _type } = req.query;

		const preview = _preview === "true" ? true : false;
		const type = typeof _type === "string" && ["video", "image"].includes(_type) ? _type : "image";
		if (preview) {
			const data = await this.server.prisma.footage.findMany({ where: { tagIds: { has: tag }, type }, include: { downloads: true } });
			res.send(
				data.slice(0, 20).map((footage) => ({
					name: footage.name,
					id: footage.id,
					preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
				}))
			);
		}
	}
}
