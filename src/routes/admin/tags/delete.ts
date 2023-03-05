import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";

@ApplyOptions({
	methods: "DELETE",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request<object, any, ReqBody>, res: Response) {
		const tag = await this.server.prisma.tag.findFirst({ where: { id: req.body.id } });
		if (!tag) {
			res.status(400).send({ message: "Tag with the provided id does not exist" });
			return;
		}

		const token = this.server.jwt.generateCsrfToken();
		await this.server.prisma.tag.delete({ where: { id: req.body.id } });

		const hasTag = await this.server.prisma.footage.findMany({ where: { tagIds: { has: req.body.id } } });
		for await (const footage of hasTag) {
			await this.server.prisma.footage.update({ where: { id: footage.id }, data: { tagIds: footage.tagIds.filter((t) => t !== tag.id) } });
		}

		res.cookie("XSRF-TOKEN", token.token).send({ csrf: token.state });
	}
}

interface ReqBody {
	id: string;
}
