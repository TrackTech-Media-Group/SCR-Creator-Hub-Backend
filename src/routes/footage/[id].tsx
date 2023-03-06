import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: ["internal-api"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { id } = req.params;

		const tags = await this.server.prisma.tag.findMany();
		const footage = await this.server.prisma.footage.findFirst({ where: { id }, include: { downloads: true } });
		if (!footage) {
			res.sendStatus(404);
			return;
		}

		const preview = (footage.downloads.find((d) => d.name.startsWith("HD")) ?? footage.downloads[0]).url;

		res.send({
			...footage,
			preview,
			tags: tags.filter((t) => footage.tagIds.includes(t.id)),
			downloads: footage.downloads.map((download) => ({ name: download.name, url: download.url }))
		});
	}
}
