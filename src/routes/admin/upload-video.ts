import type { Request, Response } from "express";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { name, type, useCases, tags, download } = req.body as RequestBody["data"];
		if (typeof name !== "string" || !name.length) return this.badReq(req, res, "Invalid name provided");
		if (typeof type !== "string" || !["video", "image"].includes(type)) return this.badReq(req, res, "Invalid type provided");
		if (!Array.isArray(useCases) || useCases.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(req, res, "Invalid useCases array provided");
		if (!Array.isArray(tags) || tags.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(req, res, "Invalid tags array provided");
		if (typeof download !== "object" || !download.name?.length || !download.url?.length)
			return this.badReq(req, res, "Invalid download provided");

		try {
			const foundTags = await this.server.prisma.tag.findMany({ where: { id: { in: tags } } });
			const footage = await this.server.prisma.footage.create({
				data: {
					name,
					type,
					useCases: useCases.join(","),
					tagIds: foundTags.map((t) => t.id).join(","),
					preview: undefined,
					downloads: {
						create: download
					}
				},
				include: {
					downloads: true
				}
			});

			this.server.data.footage.push(footage);

			const token = this.server.jwt.generateCsrfToken();
			const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
			const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
			res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
				data: footage,
				csrf: token.state
			});
		} catch (err) {
			this.server.logger.fatal(`[UPLOAD]: `, err);
			await rm(join(process.cwd(), "temp")).catch(() => void 0);
			const token = this.server.jwt.generateCsrfToken();
			const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
			const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
			res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` })
				.status(500)
				.send({ message: "Unknown server error, please try again later." });
		}
	}

	private badReq(req: Request, res: Response, message: string) {
		const token = this.server.jwt.generateCsrfToken();
		const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
		const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();

		res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` })
			.status(400)
			.send({ message });
	}
}

interface RequestBody {
	data: {
		name: string;
		type: "video";

		useCases: string[];
		tags: string[];
		download: { name: string; url: string };
	};
}
