import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: ["internal-api"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const footage = await this.server.prisma.footage.findMany({ include: { downloads: true } });
		function* getRandomItem() {
			for (let i = 0; i < 20; i++) {
				yield footage[Math.floor(Math.random() * footage.length)];
			}
		}

		const randomItems = [...getRandomItem()].filter(Boolean);
		res.send(
			randomItems.map((footage) => ({
				name: footage.name,
				id: footage.id,
				type: footage.type,
				preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
			}))
		);
	}
}
