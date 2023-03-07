import axios from "axios";
import type { NextFunction, Request, Response } from "express";
import FormData from "form-data";
import multer from "multer";
import { createReadStream } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";
import { Jwt } from "../../../lib/jwt/Jwt.js";

@ApplyOptions({
	methods: ["POST", "DELETE"],
	middleware: ["csrf-protection", "admin-auth"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response, next: NextFunction) {
		if (req.method === "DELETE") {
			await this.runDelete(req, res);
			return;
		}

		multer({
			storage: multer.diskStorage({
				destination: join(process.cwd(), "temp"),
				filename: (req, file, cb) => cb(null, `${Jwt.randomToken(32)}.${file.originalname.split(".").reverse()[0]}`)
			})
		}).array("upload")(req, res, () => void this.runFn(req, res));
	}

	public async runDelete(req: Request, res: Response) {
		const { id } = req.body as { id: string };
		if (typeof id !== "string" || !id.length) return this.badReq(res, "Invalid id provided");

		try {
			const footage = await this.server.prisma.footage.findFirst({ where: { id } });
			if (!footage) return this.badReq(res, "Unknown footageId provided");

			await this.server.prisma.download.deleteMany({ where: { footageId: id } });
			await this.server.prisma.footage.delete({ where: { id } });
			await this.server.userManager.cache.handleDeleteFootage(id);

			const token = this.server.jwt.generateCsrfToken();
			const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
			const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
			res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
				csrf: token.state
			});
		} catch (err) {
			this.server.logger.fatal(`[DELETE ITEM]: `, err);
			res.status(500).send({ message: "Unknown server error, please try again later." });
		}
	}

	public async runFn(req: Request<object, any, { data: string }>, res: Response) {
		const { id, name, type, useCases, tags, downloads, existingDownloads } = JSON.parse(req.body?.data) as RequestBody["data"];
		if (typeof name !== "string" || !name.length) return this.badReq(res, "Invalid name provided");
		if (typeof type !== "string" || !["video", "image"].includes(type)) return this.badReq(res, "Invalid type provided");
		if (!Array.isArray(useCases) || useCases.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(res, "Invalid useCases array provided");
		if (!Array.isArray(tags) || tags.some((str) => typeof str !== "string" || !str.length))
			return this.badReq(res, "Invalid tags array provided");
		if (
			!Array.isArray(downloads) ||
			downloads.some(
				(download) =>
					typeof download !== "object" || !download.name?.length || !download.dimensions?.length || !["QHD", "HD"].includes(download.type)
			)
		)
			return this.badReq(res, "Invalid downloads array provided");
		if (!existingDownloads.length) return this.badReq(res, "Invalid ExistingDownloads array provided");

		try {
			const correctDownloads = await this.uploadFiles((req.files ?? []) as Express.Multer.File[]);
			const existing = await this.server.prisma.download.findMany({ where: { footageId: id } });
			const foundTags = await this.server.prisma.tag.findMany({ where: { name: { in: tags } } });
			const footage = await this.server.prisma.footage.update({
				where: {
					id
				},
				data: {
					name,
					type,
					useCases,
					tagIds: foundTags.map((t) => t.id),
					downloads: {
						create: correctDownloads.map((d) => {
							const foundDownload = downloads.find((v) => v.name === d.name)!;
							return { url: d.url, name: `${foundDownload.type} • ${foundDownload!.dimensions} • ${d.ext}` };
						}),
						deleteMany: {
							id: {
								in: existing.filter((v) => !existingDownloads.map((v) => v.id).includes(v.id)).map((v) => v.id)
							}
						}
					}
				},
				include: {
					downloads: true
				}
			});

			const token = this.server.jwt.generateCsrfToken();
			const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
			const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
			res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
				data: footage,
				csrf: token.state
			});
		} catch (err) {
			this.server.logger.fatal(`[EDIT ITEM]: `, err);

			await rm(join(process.cwd(), "temp")).catch(() => void 0);
			res.status(500).send({ message: "Unknown server error, please try again later." });
		}
	}

	private async uploadFiles(files: Express.Multer.File[]) {
		const items: { name: string; url: string; ext: string }[] = [];

		for await (const file of files) {
			const fileStream = createReadStream(file.path);
			const form = new FormData();
			form.append("upload", fileStream);

			const req = await axios<{ url: string }>(`${this.server.config.config.upload.api}/api/upload`, {
				data: form,
				method: "POST",
				headers: { Authorization: this.server.config.config.upload.key, "Content-Type": "multipart/form-data" }
			});

			await rm(file.path);
			items.push({ name: file.originalname, url: req.data.url, ext: file.originalname.split(".").reverse()[0] });
		}

		return items;
	}

	private badReq(res: Response, message: string) {
		res.status(400).send({ message });
	}
}

interface RequestBody {
	data: {
		id: string;
		name: string;
		type: "video" | "image";

		useCases: string[];
		tags: string[];
		existingDownloads: { name: string; id: string }[];
		downloads: { name: string; dimensions: string; type: "QHD" | "HD" }[];
	};
}
