import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { type: _type } = req.query;
		const type = typeof _type === "string" ? _type : "image";

		const { tags } = this.server.data;
		const filtered = tags.filter((t) => this.server.data.footage.find((f) => f.type === type && f.tagIds.includes(t.id)));
		res.send(filtered);
	}
}
