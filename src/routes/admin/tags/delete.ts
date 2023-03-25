import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";

@ApplyOptions({
	methods: "DELETE",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request<object, any, ReqBody>, res: Response) {
		const tag = this.server.data.tags.find((t) => t.id === req.body.id);
		if (!tag) {
			res.status(400).send({ message: "Tag with the provided id does not exist" });
			return;
		}

		const token = this.server.jwt.generateCsrfToken();
		await this.server.prisma.tag.delete({ where: { id: req.body.id } });
		this.server.data.tags = this.server.data.tags.filter((t) => t.id !== tag.id);

		const hasTag = await this.server.prisma.footage.findMany({ where: { tagIds: { contains: req.body.id } } });
		for await (const footage of hasTag) {
			await this.server.prisma.footage.update({
				where: { id: footage.id },
				data: {
					tagIds: footage.tagIds
						.split(",")
						.filter((t) => t !== tag.id)
						.join(",")
				}
			});
		}

		const footageItems = await this.server.prisma.footage.findMany({ include: { downloads: true } });
		this.server.data.footage = footageItems;

		const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
		const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
		res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
			csrf: token.state
		});
	}
}

interface ReqBody {
	id: string;
}
