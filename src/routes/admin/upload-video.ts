import axios from "axios";
import type { Request, Response } from "express";
import Ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";
import { rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
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
			const thumbnail = await this.createThumbnail(download.url);
			const foundTags = await this.server.prisma.tag.findMany({ where: { id: { in: tags } } });
			const footage = await this.server.prisma.footage.create({
				data: {
					name,
					type,
					useCases,
					tagIds: foundTags.map((t) => t.id),
					preview: thumbnail,
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

	private async createThumbnail(videoUrl: string) {
		const name = videoUrl.split("/").reverse()[0];

		const { data: video } = await axios.get<Buffer>(videoUrl, { responseType: "arraybuffer" });
		const savePathVideo = join(process.cwd(), "temp", name);
		const savePathScreenshot = join(process.cwd(), "temp", `${name.split(".")[0]}.png`);
		await writeFile(savePathVideo, video);

		const ffmpeg = Ffmpeg(savePathVideo);
		await new Promise((res) => ffmpeg.screenshot({ count: 1 }).on("end", res).on("error", res).output(savePathScreenshot).run());

		const screenshot = await readFile(savePathScreenshot);
		const optimiser = sharp(screenshot, { sequentialRead: true });
		optimiser.rotate();
		optimiser.png({ quality: 12 });

		const form = new FormData();
		form.append("upload", screenshot, `preview.png`);

		const req = await axios<{ url: string }>(`${process.env.UPLOAD_API}/api/upload`, {
			data: form,
			method: "POST",
			headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
		});

		return req.data.url.replace("http://", "https://");
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
