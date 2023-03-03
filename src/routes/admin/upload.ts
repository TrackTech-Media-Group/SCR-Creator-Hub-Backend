import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request<object, any, RequestBody>, res: Response) {
		const { name, type, useCases, tags, downloads } = req.body;
		if (typeof name !== "string" || !name.length) return this.badReq(res, "Invalid name provided");
		if (typeof type !== "string" || !["video", "image"].includes(type)) return this.badReq(res, "Invalid type provided");
		if (!Array.isArray(useCases) || useCases.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(res, "Invalid useCases array provided");
		if (!Array.isArray(tags) || tags.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(res, "Invalid tags array provided");
		if (
			!Array.isArray(downloads) ||
			downloads.some((download) => typeof download !== "object" || !download.name?.length || !download.url?.length)
		)
			return this.badReq(res, "Invalid useCases array provided");

		const foundTags = await this.server.prisma.tag.findMany({ where: { name: { in: tags } } });
		const footage = await this.server.prisma.footage.create({
			data: {
				name,
				type,
				useCases,
				tagIds: foundTags.map((t) => t.id),
				downloads: { create: downloads }
			}
		});

		res.send(footage);
	}

	private badReq(res: Response, message: string) {
		res.status(400).send({ message });
	}
}

interface RequestBody {
	name: string;
	type: "video" | "image";

	useCases: string[];
	tags: string[];
	downloads: { url: string; name: string }[];
}
