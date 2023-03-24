import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request<object, any, ReqBody>, res: Response) {
		if (typeof req.body.id !== "string" || !req.body.id.length) {
			res.status(400).send({ message: "Invalid id provided" });
			return;
		}
		if (typeof req.body.name !== "string" || !req.body.name.length) {
			res.status(400).send({ message: "Invalid name provided" });
			return;
		}

		const tag = await this.server.prisma.tag.findFirst({ where: { OR: { id: req.body.id, name: req.body.name } } });
		if (tag) {
			res.status(400).send({ message: "Tag with that name/id already exists" });
			return;
		}

		const token = this.server.jwt.generateCsrfToken();
		const createdTag = await this.server.prisma.tag.create({ data: { id: req.body.id, name: req.body.name } });
		this.server.data.tags.push(createdTag);

		const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
		const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
		res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
			data: createdTag,
			csrf: token.state
		});
	}
}

interface ReqBody {
	name: string;
	id: string;
}
