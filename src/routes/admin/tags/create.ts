import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request<object, any, ReqBody>, res: Response) {
		const tag = await this.server.prisma.tag.findFirst({ where: { OR: { id: req.body.id, name: req.body.name } } });
		if (tag) {
			res.status(400).send({ message: "Tag with that name/id already exists" });
			return;
		}

		const token = this.server.jwt.generateCsrfToken();
		const createdTag = await this.server.prisma.tag.create({ data: { id: req.body.id, name: req.body.name } });

		res.cookie("XSRF-TOKEN", token.token).send({ data: createdTag, csrf: token.state });
	}
}

interface ReqBody {
	name: string;
	id: string;
}
