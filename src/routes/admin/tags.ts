import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "GET",
	middleware: ["admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const tags = await this.server.prisma.tag.findMany();
		res.send(tags);
	}
}
