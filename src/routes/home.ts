import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../lib/Api/index.js";
import _ from "lodash";

@ApplyOptions({
	methods: "GET",
	middleware: ["internal-api"]
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { footage } = this.server.data;
		const startIndex = Math.max(0, Math.floor(Math.random() * footage.length) - 12);
		const randomItems = footage.slice(startIndex, startIndex + 12);

		res.send(
			randomItems.map((footage) => ({
				name: footage.name,
				id: footage.id,
				type: footage.type,
				preview: footage.preview || footage.downloads.find((d) => d.name.startsWith("HD"))?.url || footage.downloads[0].url
			}))
		);
	}
}
